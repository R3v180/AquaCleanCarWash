// ====== [44] apps/server/src/api/adminSettings.routes.ts ======
// File: /apps/server/src/api/adminSettings.routes.ts (ACTUALIZADO PARA GESTIONAR NOTIFICACIONES)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

// --- ESQUEMA AMPLIADO ---
const updateSettingsSchema = z.object({
  defaultServiceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }).optional(),
  weeklySchedule: z.record(z.any()).optional(),

  // Campos de Email (SMTP)
  emailHost: z.string().optional(),
  emailPort: z.string().optional(),
  emailUser: z.string().optional(),
  emailPass: z.string().optional(),
  emailFrom: z.string().optional(),

  // Campos de WhatsApp (Twilio)
  twilioSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
});

router.get('/', async (req, res) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: { defaultService: true },
    });

    if (!settings) {
      // Si no hay settings, creamos uno por defecto para evitar errores en el frontend
      const newSettings = await prisma.businessSettings.create({
        data: {
          singleton: 'SINGLETON',
          weeklySchedule: {}, // Un horario vacío por defecto
        },
      });
      const allServices = await prisma.service.findMany({ where: { isActive: true } });
      return res.status(200).json({ settings: newSettings, allServices });
    }
    
    // Transformamos el horario para que coincida con el formato del componente ScheduleEditor
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
    const validatedData = updateSettingsSchema.parse(req.body);
    const { weeklySchedule, ...otherSettings } = validatedData;
    
    const updatePayload: Prisma.BusinessSettingsUpdateInput = { ...otherSettings };

    // Si se recibe un weeklySchedule, lo transformamos al formato de la BBDD
    if (weeklySchedule) {
        const scheduleToSave: { [key: string]: { open: string, close: string } | null } = {};
        for (const day in weeklySchedule) {
            const shifts = weeklySchedule[day] as { start: string, end: string }[];
            if (shifts && shifts.length > 0 && shifts[0]) {
                scheduleToSave[day] = { open: shifts[0].start, close: shifts[0].end };
            } else {
                scheduleToSave[day] = null;
            }
        }
        updatePayload.weeklySchedule = scheduleToSave;
    }

    const updatedSettings = await prisma.businessSettings.update({
      where: { singleton: 'SINGLETON' },
      data: updatePayload,
    });

    res.status(200).json(updatedSettings);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'El servicio o la configuración no existen.' });
    }
    console.error('Error al actualizar la configuración del negocio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


export default router;