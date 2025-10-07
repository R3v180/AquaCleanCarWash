// File: /apps/server/src/api/adminClosures.routes.ts (NUEVO ARCHIVO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

const closureSchema = z.object({
  date: z.coerce.date(),
  reason: z.string().optional(),
});

// --- OBTENER TODOS LOS DÍAS DE CIERRE ---
router.get('/', async (req, res) => {
  try {
    const closures = await prisma.businessClosure.findMany({
      orderBy: { date: 'asc' },
    });
    res.status(200).json(closures);
  } catch (error) {
    console.error('Error fetching business closures:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- AÑADIR UN NUEVO DÍA DE CIERRE (CON DETECCIÓN DE CONFLICTOS) ---
router.post('/', async (req, res) => {
  try {
    const { date, reason } = closureSchema.parse(req.body);

    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    // 1. Buscar citas en conflicto en la fecha solicitada
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: { select: { name: true } }, // Incluir nombre del cliente para el modal
      },
    });

    // 2. Si hay conflictos, devolver error 409
    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        message: `No se puede cerrar el negocio este día porque existen ${conflictingAppointments.length} citas programadas.`,
        conflicts: conflictingAppointments,
      });
    }

    // 3. Si no hay conflictos, crear el cierre
    const newClosure = await prisma.businessClosure.create({
      data: {
        date,
        reason,
      },
    });

    res.status(201).json(newClosure);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Este día ya ha sido marcado como cerrado.' });
    }
    console.error('Error creating business closure:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ELIMINAR UN DÍA DE CIERRE ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.businessClosure.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'El día de cierre que intentas eliminar no fue encontrado.' });
    }
    console.error('Error deleting business closure:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;