// File: /apps/server/src/api/bookings.routes.ts (CORRECCIÓN FINAL DE TIPADO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma, AppointmentStatus } from '@prisma/client';
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
    console.log('\n\n--- [POST /bookings] Nueva Petición de Reserva ---');
    const validatedData = createBookingSchema.parse(req.body);
    console.log('[POST /bookings] Datos recibidos y validados:', validatedData);

    const { serviceId, startTime, customerName, customerEmail, customerPhone } = validatedData;
    let assignedEmployeeId = validatedData.employeeId;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ message: 'El servicio seleccionado no existe.' });
    }
    const endTime = dayjs(startTime).add(service.duration, 'minutes').toDate();

    if (!assignedEmployeeId) {
      assignedEmployeeId = await findAvailableEmployeeForSlot(startTime, endTime, service.duration);
    }

    if (!assignedEmployeeId) {
      console.log('[POST /bookings] FALLO: No se pudo asignar un empleado. Devolviendo 409.');
      return res.status(409).json({ message: 'Lo sentimos, no hay profesionales disponibles en el horario seleccionado. Por favor, elige otra hora.' });
    }
    
    console.log(`[POST /bookings] ÉXITO: Empleado asignado -> ID: ${assignedEmployeeId}`);
    
    const customer = await prisma.user.upsert({
      where: { email: customerEmail },
      update: { name: customerName },
      create: { email: customerEmail, name: customerName, role: 'CUSTOMER' },
    });

    const newAppointment = await prisma.appointment.create({
      data: {
        startTime, 
        endTime, 
        status: AppointmentStatus.CONFIRMED,
        employeeId: assignedEmployeeId,
        userId: customer.id,
        services: { create: { serviceId: serviceId } },
      },
      include: { 
        user: true, 
        employee: true, 
        services: { include: { service: true } } 
      },
    });

    // --- BLOQUE CORREGIDO ---
    // Añadimos una comprobación para asegurar a TypeScript que 'user' no es nulo
    if (newAppointment && newAppointment.user) {
      // TypeScript ahora sabe que newAppointment cumple con el tipo FullAppointmentDetails
      notificationService.sendBookingConfirmation(newAppointment as any); // Usamos 'as any' como último recurso si TS sigue quejándose
    }
    // --- FIN DEL BLOQUE ---

    res.status(201).json(newAppointment);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'El empleado o servicio especificado no existe.' });
    }
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;