// File: /apps/server/src/api/employees.routes.ts (CORREGIDO)

import { Router } from 'express';
import prisma from '../lib/prisma';
import { createEmployeeSchema } from '@aquaclean/types'; // <-- IMPORTACIÓN CORREGIDA
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();

// --- OBTENER TODOS LOS EMPLEADOS ---
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error al obtener los empleados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- OBTENER UN EMPLEADO POR SU ID ---
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error al obtener el empleado:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- CREAR UN NUEVO EMPLEADO ---
router.post('/', async (req, res) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);

    const newEmployee = await prisma.employee.create({
      data: {
        ...validatedData,
        workSchedule: validatedData.workSchedule as Prisma.JsonObject,
      },
    });

    res.status(201).json(newEmployee);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          message: 'Conflicto: ya existe un empleado con ese email.',
          field: (error.meta?.target as string[])?.[0],
        });
      }
    }
    console.error('Error al crear el empleado:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ACTUALIZAR UN EMPLEADO EXISTENTE ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = createEmployeeSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    const { workSchedule, ...restOfData } = validatedData;

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...restOfData,
        ...(workSchedule && {
          workSchedule: workSchedule as Prisma.JsonObject,
        }),
      },
    });

    res.status(200).json(updatedEmployee);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Conflicto: ya existe un empleado con ese email.', field: 'email' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Empleado no encontrado.' });
      }
    }
    console.error('Error al actualizar el empleado:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ELIMINAR UN EMPLEADO ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Empleado no encontrado.' });
      }
    }
    console.error('Error al eliminar el empleado:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;