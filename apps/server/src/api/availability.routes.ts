// File: /apps/server/src/api/availability.routes.ts (CORREGIDO CON LÓGICA SECUENCIAL)

import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import prisma from '../lib/prisma';
import { Employee, Absence } from '@prisma/client';

dayjs.extend(utc);
dayjs.extend(isBetween);

const router = Router();

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  employeeId: z.string().cuid().optional(),
});

const isEmployeeAvailable = (
  employee: Employee & { absences: Absence[] },
  slot: dayjs.Dayjs,
  serviceDuration: number
): boolean => {
  const dayOfWeek = slot.format('dddd').toLowerCase();
  const workSchedule = employee.workSchedule as any;
  const daySchedule = workSchedule?.[dayOfWeek] as { start: string; end: string }[] | undefined;
  if (!daySchedule) return false;

  const worksDuringSlot = daySchedule.some(shift => {
    const shiftStart = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.start}`);
    const shiftEnd = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.end}`);
    return !slot.isBefore(shiftStart) && !slot.add(serviceDuration, 'minutes').isAfter(shiftEnd);
  });
  if (!worksDuringSlot) return false;
  
  const hasAbsence = employee.absences.some(absence => {
    return slot.isBetween(dayjs.utc(absence.startDate), dayjs.utc(absence.endDate), 'day', '[]');
  });
  if (hasAbsence) return false;

  return true;
};

router.get('/', async (req, res) => {
  try {
    const validation = availabilityQuerySchema.safeParse(req.query);
    if (!validation.success) return res.status(400).json({ errors: validation.error.issues });
    
    const { date, employeeId } = validation.data;
    const selectedDate = dayjs.utc(date);

    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: { defaultService: true },
    });
    if (!settings?.defaultService) return res.status(503).json({ message: 'El servicio por defecto no está configurado.' });

    const { defaultService, weeklySchedule } = settings;
    const serviceDuration = defaultService.duration;
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();
    const businessDayHours = (weeklySchedule as any)[dayOfWeek];
    if (!businessDayHours) return res.json([]);

    const appointments = await prisma.appointment.findMany({
      where: { startTime: { gte: selectedDate.startOf('day').toDate(), lte: selectedDate.endOf('day').toDate() } },
    });
    const bookedSlots = new Set(appointments.map(apt => dayjs.utc(apt.startTime).format('HH:mm')));
    
    const availableSlots: string[] = [];
    const openingTime = dayjs.utc(`${date}T${businessDayHours.open}`);
    const closingTime = dayjs.utc(`${date}T${businessDayHours.close}`);
    let currentTime = openingTime;

    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { absences: true },
    });

    while (currentTime.add(serviceDuration, 'minutes').isBefore(closingTime.add(1, 'minute'))) {
      const slotTime = currentTime.format('HH:mm');

      // 1. El hueco ya está ocupado, pasamos al siguiente
      if (bookedSlots.has(slotTime)) {
        currentTime = currentTime.add(serviceDuration, 'minutes');
        continue;
      }
      
      let isSomeEmployeeAvailable = false;
      // 2. Si se pide un empleado específico, comprobamos si ESE está disponible
      if (employeeId && employeeId !== 'any') {
        const specificEmployee = activeEmployees.find(emp => emp.id === employeeId);
        if (specificEmployee) {
          isSomeEmployeeAvailable = isEmployeeAvailable(specificEmployee, currentTime, serviceDuration);
        }
      // 3. Si es "Cualquier empleado", comprobamos si AL MENOS UNO está disponible
      } else {
        isSomeEmployeeAvailable = activeEmployees.some(emp => isEmployeeAvailable(emp, currentTime, serviceDuration));
      }

      // 4. Si el hueco está libre Y alguien puede trabajar, lo añadimos
      if (isSomeEmployeeAvailable) {
        availableSlots.push(slotTime);
      }

      // --- CORRECCIÓN CLAVE ---
      // Avanzamos al siguiente hueco consecutivo
      currentTime = currentTime.add(serviceDuration, 'minutes');
    }

    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Error al calcular la disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;