// File: /apps/server/src/api/adminSettings.routes.ts (VERSIÓN DE DEPURACIÓN PARA EL GUARDADO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

const updateSettingsSchema = z.object({
  defaultServiceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }),
  weeklySchedule: z.record(z.any()).optional(),
});

router.get('/', async (req, res) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: { defaultService: true },
    });

    if (!settings) {
      return res.status(404).json({ message: 'No se ha encontrado la configuración del negocio.' });
    }
    
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

    const allServices = await prisma.service.findMany({
      where: { isActive: true },
    });
    
    res.status(200).json({
      settings: { ...settings, weeklySchedule: transformedSchedule },
      allServices,
    });

  } catch (error) {
    console.error('Error al obtener la configuración del negocio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.put('/', async (req, res) => {
  try {
    // --- SECCIÓN DE LOGS ---
    console.log('\n\n--- Petición PUT a /api/admin/settings ---');

    const validatedData = updateSettingsSchema.parse(req.body);
    const { defaultServiceId, weeklySchedule } = validatedData;
    
    console.log('1. Datos recibidos del frontend (weeklySchedule):', JSON.stringify(weeklySchedule, null, 2));

    const scheduleToSave: { [key: string]: { open: string, close: string } | null } = {};
    if (weeklySchedule) {
        for (const day in weeklySchedule) {
            const shifts = weeklySchedule[day] as { start: string, end: string }[];
            if (shifts && shifts.length > 0 && shifts[0]) {
                scheduleToSave[day] = { open: shifts[0].start, close: shifts[0].end };
            } else {
                scheduleToSave[day] = null;
            }
        }
    }
    
    console.log('2. Datos transformados para guardar en BBDD:', JSON.stringify(scheduleToSave, null, 2));
    // --- FIN DE SECCIÓN DE LOGS ---

    const updatedSettings = await prisma.businessSettings.update({
      where: { singleton: 'SINGLETON' },
      data: {
        defaultServiceId,
        weeklySchedule: scheduleToSave,
      },
    });

    console.log('3. Guardado en base de datos completado con éxito.');
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