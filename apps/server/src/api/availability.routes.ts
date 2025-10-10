// File: /apps/server/src/api/availability.routes.ts (REFACTORIZADO PARA LEER INVENTARIO)

import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { AppointmentStatus } from '@prisma/client';
import prisma from '../lib/prisma';

const router = Router();

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  employeeId: z.string().cuid().optional(),
});

router.get('/', async (req, res) => {
  try {
    const { date, employeeId } = availabilityQuerySchema.parse(req.query);
    const selectedDate = dayjs(date);
    const now = dayjs();

    // Construimos la consulta base
    const whereClause: any = {
      status: AppointmentStatus.AVAILABLE,
      startTime: {
        gte: selectedDate.startOf('day').toDate(),
        lt: selectedDate.endOf('day').toDate(),
      },
    };

    // Si se pide un empleado específico, lo añadimos al filtro
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    
    // Si la fecha es hoy, añadimos la condición de que el hueco sea en el futuro
    if (selectedDate.isSame(now, 'day')) {
        whereClause.startTime.gte = now.toDate();
    }

    const availableAppointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc',
      },
      select: {
        startTime: true,
      },
    });

    // Usamos un Set para obtener solo las horas de inicio únicas (evita duplicados si 3 empleados están libres a la misma hora)
    const uniqueSlots = new Set(
      availableAppointments.map(appt => dayjs(appt.startTime).format('HH:mm'))
    );
    
    // Convertimos el Set a un array y lo devolvemos
    const slots = Array.from(uniqueSlots);
    
    res.status(200).json(slots);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    }
    console.error('[AVAILABILITY] Error fatal:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;