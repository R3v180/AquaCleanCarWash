// File: /apps/server/src/api/adminSettings.routes.ts (CORREGIDO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

const updateSettingsSchema = z.object({
  defaultServiceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }),
  // El frontend ahora nos enviará el horario en el formato de array de shifts
  weeklySchedule: z.record(z.any()).optional(),
});


// --- OBTENER LA CONFIGURACIÓN ACTUAL DEL NEGOCIO ---
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: { defaultService: true },
    });

    if (!settings) {
      return res.status(404).json({ message: 'No se ha encontrado la configuración del negocio.' });
    }
    
    // --- LÓGICA DE TRANSFORMACIÓN ---
    // Convertimos el formato de la BBDD { open, close } al formato que el
    // componente ScheduleEditor espera: [{ start, end }]
    const transformedSchedule: { [key: string]: { start: string, end: string }[] } = {};
    const originalSchedule = settings.weeklySchedule as any;
    if (originalSchedule) {
        for (const day in originalSchedule) {
            const daySetting = originalSchedule[day];
            if (daySetting && daySetting.open && daySetting.close) {
                transformedSchedule[day] = [{ start: daySetting.open, end: daySetting.close }];
            } else {
                transformedSchedule[day] = [];
            }
        }
    }
    // --- FIN DE LA TRANSFORMACIÓN ---

    const allServices = await prisma.service.findMany({
      where: { isActive: true },
    });
    
    res.status(200).json({
      settings: { ...settings, weeklySchedule: transformedSchedule }, // Enviamos el horario transformado
      allServices,
    });

  } catch (error) {
    console.error('Error al obtener la configuración del negocio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ACTUALIZAR LA CONFIGURACIÓN DEL NEGOCIO ---
router.put('/', async (req, res) => {
  try {
    const validatedData = updateSettingsSchema.parse(req.body);
    const { defaultServiceId, weeklySchedule } = validatedData;
    
    // --- LÓGICA DE TRANSFORMACIÓN INVERSA ---
    // Convertimos el formato del ScheduleEditor [{ start, end }] de vuelta
    // al formato que guardamos en la BBDD para el negocio: { open, close }
    const scheduleToSave: { [key: string]: { open: string, close: string } | null } = {};
    if (weeklySchedule) {
        for (const day in weeklySchedule) {
            const shifts = weeklySchedule[day] as { start: string, end: string }[];
            // Solo nos interesa el primer turno para el horario del negocio
            if (shifts && shifts.length > 0 && shifts[0]) {
                scheduleToSave[day] = { open: shifts[0].start, close: shifts[0].end };
            } else {
                scheduleToSave[day] = null; // Día cerrado
            }
        }
    }
    // --- FIN DE LA TRANSFORMACIÓN INVERSA ---

    const updatedSettings = await prisma.businessSettings.update({
      where: { singleton: 'SINGLETON' },
      data: {
        defaultServiceId,
        weeklySchedule: scheduleToSave, // Guardamos el horario en el formato original
      },
    });

    res.status(200).json(updatedSettings);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'El servicio seleccionado no existe.' });
    }
    console.error('Error al actualizar la configuración del negocio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


export default router;