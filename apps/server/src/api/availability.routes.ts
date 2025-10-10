// ====== [46] apps/server/src/api/availability.routes.ts ======
// File: /apps/server/src/api/availability.routes.ts (CORRECCIÓN FINAL DE FORMATEO A LOCAL)

import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import prisma from '../lib/prisma';
import { AppointmentStatus, Prisma } from '@prisma/client';

dayjs.extend(utc);

const router = Router();

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  employeeId: z.string().cuid().optional(),
});

router.get('/', async (req, res) => {
  try {
    console.log('\n\n--- [GET /availability] Nueva Petición de Disponibilidad ---');
    const { date, employeeId } = availabilityQuerySchema.parse(req.query);
    console.log(`1. Parámetros recibidos: date=${date}, employeeId=${employeeId || 'ninguno'}`);

    const startOfDay = dayjs.utc(date).startOf('day');
    const endOfDay = dayjs.utc(date).endOf('day');
    const now = dayjs.utc();
    
    const gteTime = startOfDay.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')
      ? now.toDate()
      : startOfDay.toDate();

    const whereClause: Prisma.AppointmentWhereInput = {
      status: AppointmentStatus.AVAILABLE,
      startTime: {
        gte: gteTime,
        lte: endOfDay.toDate(),
      },
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    console.log('2. Cláusula WHERE para Prisma:', JSON.stringify(whereClause, null, 2));

    const availableAppointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc',
      },
      select: {
        startTime: true,
      },
    });

    console.log(`3. Citas encontradas en la BBDD: ${availableAppointments.length} resultados.`);
    console.log('   -> Primeros resultados:', availableAppointments.slice(0, 10));

    const uniqueSlots = new Set<string>();
    availableAppointments.forEach(appt => {
      // --- LÍNEA CORREGIDA ---
      // Tomamos la fecha UTC de la BBDD y la formateamos en la zona horaria local del servidor.
      // dayjs() por defecto convierte la fecha UTC a local.
      uniqueSlots.add(dayjs(appt.startTime).format('HH:mm'));
    });

    const finalSlots = Array.from(uniqueSlots);
    console.log('4. Slots finales enviados al frontend:', finalSlots);

    res.status(200).json(finalSlots);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    }
    console.error('[AVAILABILITY] Error fatal al buscar en inventario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;