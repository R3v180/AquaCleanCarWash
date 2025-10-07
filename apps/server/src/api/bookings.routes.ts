// File: /apps/server/src/api/bookings.routes.ts (REFACTORIZADO Y CON NOTIFICACIONES)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { notificationService } from '../lib/notificationService';
import { findAvailableEmployeeForSlot } from '../lib/availabilityService';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }),
  startTime: z.coerce.date({ invalid_type_error: 'La fecha de inicio debe ser una fecha válida.' }),
  employeeId: z.string().cuid({ message: 'El ID del empleado no es válido.' }).optional(),
  customerName: z.string().min(3, { message: 'El nombre del cliente es requerido.' }),
  customerEmail: z.string().email({ message: 'El email del cliente no es válido.' }),
  customerPhone: z.string().min(1, { message: 'El teléfono del cliente es requerido.' }),
});


router.post('/', async (req, res) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const { serviceId, startTime, customerName, customerEmail, customerPhone } = validatedData;
    let assignedEmployeeId = validatedData.employeeId;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ message: 'El servicio seleccionado no existe.' });
    }
    const endTime = dayjs(startTime).add(service.duration, 'minutes').toDate();

    // --- LÓGICA DE AUTO-ASIGNACIÓN REFACTORIZADA ---
    if (!assignedEmployeeId) {
      assignedEmployeeId = await findAvailableEmployeeForSlot(startTime, endTime, service.duration);
    }
    // --- FIN DE LA LÓGICA ---

    if (!assignedEmployeeId) {
      return res.status(409).json({ message: 'Lo sentimos, no hay profesionales disponibles en el horario seleccionado. Por favor, elige otra hora.' });
    }
    
    const newAppointment = await prisma.appointment.create({
      data: {
        startTime, endTime, status: 'CONFIRMED',
        employee: { connect: { id: assignedEmployeeId } },
        services: { create: { service: { connect: { id: serviceId } } } },
        user: {
          connectOrCreate: {
            where: { email: customerEmail },
            create: { email: customerEmail, name: customerName, role: 'CUSTOMER' },
          },
        },
      },
    });

    // --- ENVIAR NOTIFICACIONES ---
    // Obtenemos los detalles completos de la cita para pasarlos al servicio de notificaciones
    const fullAppointmentDetails = await prisma.appointment.findUnique({
      where: { id: newAppointment.id },
      include: {
        user: true,
        employee: true,
        services: { include: { service: true } },
      },
    });

    if (fullAppointmentDetails) {
      await notificationService.sendBookingConfirmation(fullAppointmentDetails);
    }
    // --- FIN DEL ENVÍO ---

    res.status(201).json(newAppointment);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'El empleado especificado no existe.' });
    }
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;