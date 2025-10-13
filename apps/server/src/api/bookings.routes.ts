// File: /apps/server/src/api/bookings.routes.ts (ACTUALIZADO PARA RESERVA FLEXIBLE)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import { hash } from 'bcryptjs'; // <-- Importamos 'hash'
import prisma from '../lib/prisma';
import { AppointmentStatus, Prisma, UserRole } from '@prisma/client'; // <-- Importamos 'UserRole'
import { notificationService } from '../lib/notificationService';

const router = Router();

// --- ESQUEMA AMPLIADO ---
const createBookingSchema = z.object({
  serviceId: z.string().cuid(),
  startTime: z.coerce.date(),
  employeeId: z.string().cuid().optional(),
  customerName: z.string().min(3),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  createAccount: z.boolean().optional(),
  password: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const { 
      startTime, employeeId, customerName, customerEmail, 
      customerPhone, createAccount, password 
    } = validatedData;

    // 1. Encontrar un hueco disponible (lógica ya corregida)
    const startOfMinute = dayjs(startTime).startOf('minute').toDate();
    const endOfMinute = dayjs(startTime).endOf('minute').toDate();
    const availableSlot = await prisma.appointment.findFirst({
        where: {
            startTime: { gte: startOfMinute, lte: endOfMinute },
            status: AppointmentStatus.AVAILABLE,
            ...(employeeId && { employeeId: employeeId }),
        },
    });

    if (!availableSlot) {
      return res.status(409).json({ message: 'Lo sentimos, este hueco ya no está disponible. Por favor, elige otra hora.' });
    }

    // --- 2. LÓGICA CONDICIONAL PARA CLIENTE/INVITADO ---
    let appointmentUpdateData: Prisma.AppointmentUpdateInput = {};

    if (createAccount && password) {
      // --- Caso: Invitado que quiere crear una cuenta ---
      const passwordHash = await hash(password, 12);
      const newUser = await prisma.user.create({
        data: {
          name: customerName,
          email: customerEmail,
          passwordHash,
          role: UserRole.CUSTOMER,
        },
      });
      appointmentUpdateData.user = { connect: { id: newUser.id } };
      console.log(`[POST /bookings] Nueva cuenta creada para ${customerEmail} y vinculada a la cita.`);
    } else {
      // --- Caso: Reserva como invitado ---
      // (En el futuro, aquí también manejaremos el caso de un usuario ya logueado)
      appointmentUpdateData.guestName = customerName;
      appointmentUpdateData.guestEmail = customerEmail;
      appointmentUpdateData.guestPhone = customerPhone;
      console.log(`[POST /bookings] Cita creada como invitado para ${customerEmail}.`);
    }

    // 3. Actualizar la cita con los datos correspondientes
    const confirmedAppointment = await prisma.appointment.update({
        where: { id: availableSlot.id },
        data: {
            status: AppointmentStatus.CONFIRMED,
            ...appointmentUpdateData, // Aplicamos los datos de usuario o invitado
        },
        include: { 
            user: true, // Incluimos el usuario si existe
            employee: true, 
            services: { include: { service: true } } 
        },
    });

    // 4. Enviar notificación
    // Creamos un objeto 'user' temporal para el servicio de notificaciones si es un invitado
    const notificationUser = confirmedAppointment.user || { name: customerName, email: customerEmail };
    if (notificationUser) {
      const tempAppointmentDetails = { ...confirmedAppointment, user: notificationUser };
      notificationService.sendBookingConfirmation(tempAppointmentDetails as any, customerPhone);
    }
    
    res.status(201).json(confirmedAppointment);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Error de 'unique constraint' (email ya existe)
            return res.status(409).json({ message: 'Ya existe una cuenta con este email. Por favor, inicia sesión para reservar.' });
        }
    }
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;