// File: /apps/server/src/api/bookings.routes.ts (ACTUALIZADO CON AUTO-ASIGNACIÓN)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

dayjs.extend(isBetween);

const router = Router();

// --- ESQUEMA ACTUALIZADO ---
// employeeId ahora es opcional.
// Se han eliminado los campos de vehículo que no se usan actualmente.
const createBookingSchema = z.object({
  serviceId: z.string().cuid({ message: 'El ID del servicio no es válido.' }),
  startTime: z.coerce.date({ invalid_type_error: 'La fecha de inicio debe ser una fecha válida.' }),
  employeeId: z.string().cuid({ message: 'El ID del empleado no es válido.' }).optional(),
  customerName: z.string().min(3, { message: 'El nombre del cliente es requerido.' }),
  customerEmail: z.string().email({ message: 'El email del cliente no es válido.' }),
  customerPhone: z.string().min(1, { message: 'El teléfono del cliente es requerido.' }),
});

// --- CREAR UNA NUEVA RESERVA (CITA) ---
router.post('/', async (req, res) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const { serviceId, startTime, customerName, customerEmail, customerPhone } = validatedData;
    let assignedEmployeeId = validatedData.employeeId;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ message: 'El servicio seleccionado no existe.' });
    }
    const endTime = dayjs(startTime).add(service.duration, 'minutes').toDate();

    // --- LÓGICA DE AUTO-ASIGNACIÓN ---
    if (!assignedEmployeeId) {
      const dayOfWeek = dayjs(startTime).format('dddd').toLowerCase();

      // 1. Encontrar empleados ocupados en ese slot
      const overlappingAppointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
        select: { employeeId: true },
      });
      const busyEmployeeIds = new Set(overlappingAppointments.map(a => a.employeeId));

      // 2. Encontrar empleados activos que no tengan ausencia
      const potentialEmployees = await prisma.employee.findMany({
        where: {
          status: 'ACTIVE',
          absences: {
            none: {
              startDate: { lte: endTime },
              endDate: { gte: startTime },
            },
          },
        },
      });
      
      // 3. Filtrar por horario laboral y si están ocupados
      const availableEmployees = potentialEmployees.filter(employee => {
        if (busyEmployeeIds.has(employee.id)) return false;

        const schedule = employee.workSchedule as any;
        const daySchedule = schedule?.[dayOfWeek] as { start: string; end: string }[] | undefined;
        if (!daySchedule) return false;
        
        return daySchedule.some(shift => {
            const shiftStart = dayjs.utc(`${dayjs(startTime).format('YYYY-MM-DD')}T${shift.start}`);
            const shiftEnd = dayjs.utc(`${dayjs(startTime).format('YYYY-MM-DD')}T${shift.end}`);
            return !dayjs(startTime).isBefore(shiftStart) && !dayjs(endTime).isAfter(shiftEnd);
        });
      });

      if (availableEmployees.length === 0) {
        return res.status(409).json({ message: 'Lo sentimos, no hay profesionales disponibles en el horario seleccionado. Por favor, elige otra hora.' });
      }
      
      // 4. Asignar el primer empleado disponible encontrado
      assignedEmployeeId = availableEmployees[0]!.id;
    }
    // --- FIN DE LA LÓGICA DE AUTO-ASIGNACIÓN ---

    const newAppointment = await prisma.appointment.create({
      data: {
        startTime, endTime, status: 'CONFIRMED',
        employee: { connect: { id: assignedEmployeeId } },
        services: { create: { service: { connect: { id: serviceId } } } },
        user: {
          connectOrCreate: {
            where: { email: customerEmail },
            create: { email: customerEmail, name: customerName, role: 'CUSTOMER' },
          },
        },
      },
    });

    res.status(201).json(newAppointment);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'El empleado especificado no existe.' });
    }
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;