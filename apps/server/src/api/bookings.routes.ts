// ====== [47] apps/server/src/api/bookings.routes.ts ======
// File: /apps/server/src/api/bookings.routes.ts (PASANDO EL TELÉFONO AL SERVICIO DE NOTIFICACIÓN)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { notificationService } from '../lib/notificationService';

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

    const { startTime, customerName, customerEmail, employeeId, customerPhone } = validatedData;
    
    const availableSlot = await prisma.appointment.findFirst({
        where: {
            startTime: startTime,
            status: AppointmentStatus.AVAILABLE,
            ...(employeeId && { employeeId: employeeId }),
        },
    });

    if (!availableSlot) {
      console.log('[POST /bookings] FALLO: No se encontró un slot "AVAILABLE" coincidente. Devolviendo 409.');
      return res.status(409).json({ message: 'Lo sentimos, no hay profesionales disponibles en el horario seleccionado. Por favor, elige otra hora.' });
    }

    console.log(`[POST /bookings] ÉXITO: Slot disponible encontrado (ID: ${availableSlot.id}), asignado al empleado ID: ${availableSlot.employeeId}`);

    const customer = await prisma.user.upsert({
      where: { email: customerEmail },
      update: { name: customerName },
      create: { email: customerEmail, name: customerName, role: 'CUSTOMER' },
    });

    const confirmedAppointment = await prisma.appointment.update({
        where: { id: availableSlot.id },
        data: {
            status: AppointmentStatus.CONFIRMED,
            userId: customer.id,
        },
        include: { 
            user: true, 
            employee: true, 
            services: { include: { service: true } } 
        },
    });

    if (confirmedAppointment.user) {
      // --- LÍNEA MODIFICADA ---
      // Ahora también pasamos el número de teléfono del cliente a la función
      notificationService.sendBookingConfirmation(confirmedAppointment as any, customerPhone);
    }

    res.status(201).json(confirmedAppointment);

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