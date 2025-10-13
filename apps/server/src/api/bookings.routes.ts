// ====== [61] apps/server/src/api/bookings.routes.ts ======
// File: /apps/server/src/api/bookings.routes.ts (GUARDANDO TELÉFONO EN PERFIL DE USUARIO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AppointmentStatus, Prisma, UserRole } from '@prisma/client';
import { notificationService } from '../lib/notificationService';

const router = Router();

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

interface TokenPayload {
    userId: string;
    role: UserRole;
}

router.post('/', async (req, res) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const { 
      startTime, employeeId, customerName, customerEmail, 
      customerPhone, createAccount, password 
    } = validatedData;

    // 1. Encontrar un hueco disponible
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
      return res.status(409).json({ message: 'Lo sentimos, este hueco ya no está disponible.' });
    }

    // 2. Lógica para detectar usuario logueado o crear cuenta
    let appointmentUpdateData: Prisma.AppointmentUpdateInput = {};
    let authenticatedUser: { id: string, name: string | null, email: string } | null = null;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (token && jwtSecret) {
        try {
            const payload = jwt.verify(token, jwtSecret) as TokenPayload;
            if (payload.role === UserRole.CUSTOMER) {
                const user = await prisma.user.findUnique({ where: { id: payload.userId } });
                if (user) authenticatedUser = user;
            }
        } catch (error) { /* Ignoramos el token si es inválido y procedemos como invitado */ }
    }

    if (authenticatedUser) {
        appointmentUpdateData.user = { connect: { id: authenticatedUser.id } };
        // También guardamos el teléfono en la cita por si el usuario usa uno diferente para esta reserva específica
        appointmentUpdateData.guestPhone = customerPhone; 
        console.log(`[POST /bookings] Cita solicitada por usuario autenticado: ${authenticatedUser.email}`);

    } else if (createAccount && password) {
      const passwordHash = await hash(password, 12);
      
      // --- CAMBIO CLAVE: AÑADIMOS EL TELÉFONO AL CREAR EL USUARIO ---
      const newUser = await prisma.user.create({
        data: { 
          name: customerName, 
          email: customerEmail, 
          passwordHash, 
          role: UserRole.CUSTOMER,
          phone: customerPhone, // <-- LÍNEA AÑADIDA
        },
      });
      // --- FIN DEL CAMBIO ---

      appointmentUpdateData.user = { connect: { id: newUser.id } };
      appointmentUpdateData.guestPhone = customerPhone; // Guardamos también en la cita
      authenticatedUser = newUser; 
      console.log(`[POST /bookings] Nueva cuenta creada para ${customerEmail} y vinculada (con teléfono).`);
    
    } else {
      appointmentUpdateData.guestName = customerName;
      appointmentUpdateData.guestEmail = customerEmail;
      appointmentUpdateData.guestPhone = customerPhone;
      console.log(`[POST /bookings] Cita creada como invitado para ${customerEmail}.`);
    }

    // 3. Actualizar la cita
    const confirmedAppointment = await prisma.appointment.update({
        where: { id: availableSlot.id },
        data: { status: AppointmentStatus.CONFIRMED, ...appointmentUpdateData },
        include: { user: true, employee: true, services: { include: { service: true } } },
    });

    // 4. Enviar notificación
    const finalUser = authenticatedUser || { name: customerName, email: customerEmail };
    if (finalUser) {
      const tempAppointmentDetails = { ...confirmedAppointment, user: finalUser };
      notificationService.sendBookingConfirmation(tempAppointmentDetails as any, customerPhone);
    }
    
    res.status(201).json(confirmedAppointment);

  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Ya existe una cuenta con este email. Por favor, inicia sesión.' });
    }
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;