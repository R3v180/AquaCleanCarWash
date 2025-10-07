// File: /apps/server/src/api/adminSettings.routes.ts (ACTUALIZADO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

const updateSettingsSchema = z.object({
  defaultServiceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }),
});


// --- OBTENER LA CONFIGURACIÓN ACTUAL DEL NEGOCIO ---
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: {
        defaultService: true,
      },
    });

    if (!settings) {
      return res.status(404).json({ message: 'No se ha encontrado la configuración del negocio.' });
    }

    // --- LÍNEA MODIFICADA ---
    // Ahora solo obtenemos los servicios que están activos
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
    });
    // --- FIN DE LA MODIFICACIÓN ---

    res.status(200).json({
      settings,
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

    const updatedSettings = await prisma.businessSettings.update({
      where: { singleton: 'SINGLETON' },
      data: {
        defaultServiceId: validatedData.defaultServiceId,
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