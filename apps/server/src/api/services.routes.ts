// File: /apps/server/src/api/services.routes.ts (RECONSTRUIDO)

import { Router } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { createServiceSchema } from '@aquaclean/types';

const router = Router();

// --- OBTENER TODOS LOS SERVICIOS ---
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- CREAR UN NUEVO SERVICIO ---
router.post('/', async (req, res) => {
  try {
    const validatedData = createServiceSchema.parse(req.body);
    const newService = await prisma.service.create({
      data: validatedData,
    });
    res.status(201).json(newService);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ACTUALIZAR UN SERVICIO EXISTENTE ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hacemos el esquema parcial para permitir actualizaciones de solo algunos campos
    const updateSchema = createServiceSchema.partial();
    const validatedData = updateSchema.parse(req.body);

    const updatedService = await prisma.service.update({
      where: { id },
      data: validatedData,
    });
    res.status(200).json(updatedService);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ELIMINAR UN SERVICIO ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Lógica de seguridad: Comprobar si hay citas asociadas
    const appointmentCount = await prisma.appointmentService.count({
      where: { serviceId: id },
    });

    if (appointmentCount > 0) {
      return res.status(409).json({ // 409 Conflict
        message: `No se puede eliminar el servicio porque tiene ${appointmentCount} citas asociadas. Por favor, desactívalo en su lugar.`,
      });
    }

    await prisma.service.delete({
      where: { id },
    });
    res.status(204).send(); // 204 No Content
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;