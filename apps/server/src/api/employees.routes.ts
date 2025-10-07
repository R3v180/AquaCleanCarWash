// File: /apps/server/src/api/employees.routes.ts (ORDEN CORREGIDO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import { Prisma, EmployeeStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { createEmployeeSchema } from '@aquaclean/types';

const router = Router();

// --- GESTIÓN DEL PERFIL DEL EMPLEADO Y RUTAS PÚBLICAS ---

// Ruta para el panel de admin
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = {};
    if (status === 'ACTIVE' || status === 'ARCHIVED') {
      whereClause = { status: status as EmployeeStatus };
    }
    const employees = await prisma.employee.findMany({ where: whereClause, orderBy: { name: 'asc' } });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA PÚBLICA (MOVIDA HACIA ARRIBA) ---
router.get('/public', async (req, res) => {
  try {
    const publicEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, bio: true, imageUrl: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(publicEmployees);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA GENÉRICA CON :id (AHORA VA DESPUÉS DE LA ESPECÍFICA) ---
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ message: 'Empleado no encontrado.' });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);
    const { workSchedule, ...restOfData } = validatedData;
    const newEmployee = await prisma.employee.create({
      data: {
        ...restOfData,
        workSchedule: (workSchedule as Prisma.JsonObject) ?? Prisma.JsonNull,
      },
    });
    res.status(201).json(newEmployee);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe un empleado con ese email.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

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
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return res.status(404).json({ message: 'Empleado no encontrado.' });
      if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe otro empleado con ese email.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- GESTIÓN DE AUSENCIAS (VACACIONES, ETC.) ---
// ... (el resto del archivo no cambia) ...

const absenceSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
});

router.get('/:employeeId/absences', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const absences = await prisma.absence.findMany({ where: { employeeId } });
    res.status(200).json(absences);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/:employeeId/absences', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const validatedData = absenceSchema.parse(req.body);
    const newAbsence = await prisma.absence.create({
      data: { ...validatedData, employeeId },
    });
    res.status(201).json(newAbsence);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.delete('/:employeeId/absences/:absenceId', async (req, res) => {
  try {
    const { absenceId } = req.params;
    await prisma.absence.delete({ where: { id: absenceId } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Ausencia no encontrada.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;