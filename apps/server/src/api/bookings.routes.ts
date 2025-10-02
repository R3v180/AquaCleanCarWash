// File: /apps/server/src/api/bookings.routes.ts (VERSIÓN FINAL QUE COMPILA)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

// Esquema de validación para los datos de una nueva reserva.
const createBookingSchema = z.object({
  serviceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }),
  startTime: z.coerce.date({ invalid_type_error: 'La fecha de inicio debe ser una fecha válida.' }),
  employeeId: z.string().cuid({ message: 'El ID del empleado no es válido.' }),
  customerName: z.string().min(3, { message: 'El nombre del cliente es requerido.' }),
  customerEmail: z.string().email({ message: 'El email del cliente no es válido.' }),
  customerPhone: z.string().min(1, { message: 'El teléfono del cliente es requerido.' }),
  vehicleMake: z.string().min(1, { message: 'La marca del vehículo es requerida.' }),
  vehicleModel: z.string().min(1, { message: 'El modelo del vehículo es requerido.' }),
});

// --- CREAR UNA NUEVA RESERVA (CITA) ---
router.post('/', async (req, res) => {
  try {
    // 1. Validar los datos de entrada.
    const validatedData = createBookingSchema.parse(req.body);

    // 2. Obtener la duración del servicio para calcular la hora de fin.
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
    });

    if (!service) {
      return res.status(404).json({ message: 'El servicio seleccionado no existe.' });
    }

    // 3. Calcular la hora de finalización de la cita.
    const endTime = dayjs(validatedData.startTime).add(service.duration, 'minutes').toDate();

    // 4. Crear la nueva cita (Appointment) y conectar/crear el usuario asociado.
    const newAppointment = await prisma.appointment.create({
      data: {
        startTime: validatedData.startTime,
        endTime: endTime,
        status: 'CONFIRMED',

        employee: { connect: { id: validatedData.employeeId } },
        services: { create: { service: { connect: { id: validatedData.serviceId } } } },
        
        user: {
          connectOrCreate: {
            where: {
              email: validatedData.customerEmail,
            },
            create: {
              email: validatedData.customerEmail,
              name: validatedData.customerName,
              role: 'CUSTOMER',
              // --- CORRECCIÓN FINAL ---
              // El error de build confirma que el modelo User NO tiene un campo 'phone'.
              // Lo eliminamos para que la compilación sea exitosa.
              // El siguiente paso lógico después de esto será añadir el campo 'phone'
              // al modelo User en el archivo schema.prisma.
            },
          },
        },
      },
    });

    // 5. Devolver la cita recién creada.
    res.status(201).json(newAppointment);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
         return res.status(404).json({ message: 'El servicio, empleado o usuario especificado no existe.' });
      }
    }

    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;