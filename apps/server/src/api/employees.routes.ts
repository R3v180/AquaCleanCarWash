// File: /apps/server/src/api/employees.routes.ts (ACTUALIZADO CON DETECCIÓN DE CONFLICTOS)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import { Prisma, EmployeeStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { createEmployeeSchema } from '@aquaclean/types';

const router = Router();

// --- GESTIÓN DEL PERFIL DEL EMPLEADO ---

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

const absenceSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
});

router.get('/:employeeId/absences', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const absences = await prisma.absence.findMany({ where: { employeeId }, orderBy: { startDate: 'asc' } });
    res.status(200).json(absences);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ENDPOINT MODIFICADO CON LÓGICA DE CONFLICTOS ---
router.post('/:employeeId/absences', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const validatedData = absenceSchema.parse(req.body);
    const { startDate, endDate } = validatedData;

    // 1. Buscamos citas que se solapen con el periodo de ausencia
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        employeeId: employeeId,
        startTime: {
          gte: startDate,
          lt: endDate, // Usamos 'lt' (less than) para cubrir hasta el final del día
        },
      },
      include: {
        user: { select: { name: true } }, // Incluimos el nombre del cliente
      },
    });

    // 2. Si hay conflictos, devolvemos un error 409 con los datos
    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        message: `No se puede programar la ausencia. Entra en conflicto con ${conflictingAppointments.length} cita(s).`,
        conflicts: conflictingAppointments,
      });
    }

    // 3. Si no hay conflictos, creamos la ausencia
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