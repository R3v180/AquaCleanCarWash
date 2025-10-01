// File: /apps/server/src/api/services.routes.ts (CORREGIDO)

import { Router } from 'express';
import prisma from '../lib/prisma';
import { createServiceSchema } from '@aquaclean/types'; // <-- IMPORTACIÓN CORREGIDA
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();

// --- OBTENER TODOS LOS SERVICIOS ---
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.status(200).json(services);
  } catch (error) {
    console.error('Error al obtener los servicios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- OBTENER UN SERVICIO POR SU ID ---
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }

    res.status(200).json(service);
  } catch (error) {
    console.error('Error al obtener el servicio:', error);
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
    console.error('Error al crear el servicio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ACTUALIZAR UN SERVICIO EXISTENTE ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Servicio no encontrado.' });
      }
    }
    console.error('Error al actualizar el servicio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ELIMINAR UN SERVICIO ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Servicio no encontrado.' });
      }
    }
    console.error('Error al eliminar el servicio:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;