// File: /apps/server/src/api/adminDateOverrides.routes.ts (CORREGIDO CON NORMALIZACIÓN UTC)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // <-- Importar el plugin UTC
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

dayjs.extend(utc); // <-- Usar el plugin

const router = Router();

const overrideSchema = z
  .object({
    date: z.coerce.date(),
    reason: z.string().optional(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  })
  .refine(
    (data) => (data.openTime && data.closeTime) || (!data.openTime && !data.closeTime),
    {
      message: 'Se deben proporcionar tanto la hora de apertura como la de cierre, o ninguna de las dos.',
      path: ['openTime', 'closeTime'],
    }
  );

// --- OBTENER TODAS LAS ANULACIONES DE FECHA ---
router.get('/', async (req, res) => {
  try {
    const overrides = await prisma.dateOverride.findMany({
      orderBy: { date: 'asc' },
    });
    res.status(200).json(overrides);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- AÑADIR UNA NUEVA ANULACIÓN (CIERRE U HORARIO ESPECIAL) ---
router.post('/', async (req, res) => {
  try {
    const { date, reason, openTime, closeTime } = overrideSchema.parse(req.body);

    // --- CORRECCIÓN CLAVE: NORMALIZAR LA FECHA A UTC ---
    const utcDate = dayjs(date).utc().startOf('day').toDate();
    const startOfDay = dayjs(utcDate); // Ya está en UTC
    const endOfDay = startOfDay.endOf('day');

    // Comprobar si ya existe una anulación para este día
    const existingOverride = await prisma.dateOverride.findFirst({
        where: { date: utcDate },
    });

    if (existingOverride) {
        return res.status(409).json({ message: 'Ya existe una configuración especial para este día.' });
    }
    // --- FIN DE LA CORRECCIÓN ---


    let conflictingAppointments = [];

    if (openTime && closeTime) {
      const specialOpening = dayjs.utc(`${startOfDay.format('YYYY-MM-DD')}T${openTime}`);
      const specialClosing = dayjs.utc(`${startOfDay.format('YYYY-MM-DD')}T${closeTime}`);

      conflictingAppointments = await prisma.appointment.findMany({
        where: {
          startTime: { gte: startOfDay.toDate(), lte: endOfDay.toDate() },
          OR: [
            { startTime: { lt: specialOpening.toDate() } },
            { endTime: { gt: specialClosing.toDate() } },
          ],
        },
        include: { user: { select: { name: true } } },
      });
    } else {
      conflictingAppointments = await prisma.appointment.findMany({
        where: { startTime: { gte: startOfDay.toDate(), lte: endOfDay.toDate() } },
        include: { user: { select: { name: true } } },
      });
    }

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        message: `La operación entra en conflicto con ${conflictingAppointments.length} citas existentes.`,
        conflicts: conflictingAppointments,
      });
    }

    const newOverride = await prisma.dateOverride.create({
      data: { date: utcDate, reason, openTime, closeTime }, // <-- Usar la fecha normalizada
    });

    res.status(201).json(newOverride);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ELIMINAR UNA ANULACIÓN ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dateOverride.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'La anulación no fue encontrada.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;