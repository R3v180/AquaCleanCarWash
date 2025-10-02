// File: /apps/server/src/api/adminAppointments.routes.ts (ACTUALIZADO)

import { Router } from 'express';
import { z, ZodError } from 'zod'; // <-- LÍNEA AÑADIDA
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client'; // <-- LÍNEA AÑADIDA

const router = Router();

// --- ESQUEMA DE VALIDACIÓN PARA LA ACTUALIZACIÓN ---
const updateAppointmentSchema = z.object({
  start: z.coerce.date({ invalid_type_error: 'La fecha de inicio debe ser una fecha válida.' }),
  end: z.coerce.date({ invalid_type_error: 'La fecha de fin debe ser una fecha válida.' }),
  // En el futuro, podríamos añadir aquí el 'resourceId' (employeeId) para gestionar la reasignación.
});

// --- OBTENER TODAS LAS CITAS PARA EL CALENDARIO DEL ADMIN ---
router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    const events = appointments.map((appointment) => {
      const serviceName = appointment.services[0]?.service.name || 'Servicio';
      const customerName = appointment.user?.name || 'Cliente';
      return {
        id: appointment.id,
        title: `${serviceName} - ${customerName}`,
        start: appointment.startTime,
        end: appointment.endTime,
        resourceId: appointment.employeeId,
      };
    });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching appointments for admin:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ACTUALIZAR UNA CITA (PARA DRAG & DROP) ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 1. Validamos los datos que nos llegan (nueva fecha de inicio y fin)
    const validatedData = updateAppointmentSchema.parse(req.body);

    // 2. Actualizamos la cita en la base de datos
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: validatedData.start,
        endTime: validatedData.end,
      },
    });

    // 3. Devolvemos la cita actualizada para confirmar que todo fue bien
    res.status(200).json(updatedAppointment);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    // Manejamos el error específico de Prisma cuando no se encuentra el registro
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'La cita que intentas actualizar no fue encontrada.' });
    }
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;