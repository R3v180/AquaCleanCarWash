// File: /apps/server/src/api/availability.routes.ts (RECONSTRUIDO)

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

// El esquema ahora acepta un employeeId opcional
const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  employeeId: z.string().cuid().optional(),
});

// --- FUNCIÓN HELPER PARA VERIFICAR SI UN EMPLEADO ESTÁ DISPONIBLE EN UN TRAMO HORARIO ---
const isEmployeeAvailable = (
  employee: Employee & { absences: Absence[] },
  slot: dayjs.Dayjs,
  serviceDuration: number
): boolean => {
  const dayOfWeek = slot.format('dddd').toLowerCase();
  const workSchedule = employee.workSchedule as any;
  const daySchedule = workSchedule?.[dayOfWeek] as { start: string; end: string }[] | undefined;

  // 1. ¿Tiene horario de trabajo definido para este día?
  if (!daySchedule) return false;

  // 2. ¿Su horario de trabajo cubre el tramo completo de la cita?
  const worksDuringSlot = daySchedule.some(shift => {
    const shiftStart = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.start}`);
    const shiftEnd = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.end}`);
    return !slot.isBefore(shiftStart) && !slot.add(serviceDuration, 'minutes').isAfter(shiftEnd);
  });
  if (!worksDuringSlot) return false;
  
  // 3. ¿Tiene alguna ausencia registrada para este día?
  const hasAbsence = employee.absences.some(absence => {
    return slot.isBetween(dayjs.utc(absence.startDate), dayjs.utc(absence.endDate), 'day', '[]');
  });
  if (hasAbsence) return false;

  // Si pasa todas las comprobaciones, está disponible
  return true;
};


router.get('/', async (req, res) => {
  try {
    // 1. Validar la entrada
    const validation = availabilityQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.issues });
    }
    const { date, employeeId } = validation.data;
    const selectedDate = dayjs.utc(date);

    // 2. Obtener configuración esencial del negocio
    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: { defaultService: true },
    });
    if (!settings?.defaultService) {
      return res.status(503).json({ message: 'El servicio por defecto no está configurado.' });
    }
    const { defaultService, weeklySchedule } = settings;
    const serviceDuration = defaultService.duration;
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();
    const businessDayHours = (weeklySchedule as any)[dayOfWeek];

    if (!businessDayHours) {
      return res.json([]); // Negocio cerrado
    }
    
    // 3. Obtener todas las citas del día
    const appointments = await prisma.appointment.findMany({
      where: { startTime: { gte: selectedDate.startOf('day').toDate(), lte: selectedDate.endOf('day').toDate() } },
    });

    // 4. Generar todos los tramos horarios posibles del día
    const availableSlots = new Set<string>();
    const openingTime = dayjs.utc(`${date}T${businessDayHours.open}`);
    const closingTime = dayjs.utc(`${date}T${businessDayHours.close}`);
    let currentTime = openingTime;

    while (currentTime.add(serviceDuration, 'minutes').isBefore(closingTime.add(1, 'minute'))) {
      
      // LÓGICA PARA EL CASO "UN EMPLEADO ESPECÍFICO"
      if (employeeId) {
        const employee = await prisma.employee.findFirst({ 
          where: { id: employeeId, status: 'ACTIVE' },
          include: { absences: true }
        });

        if (employee && isEmployeeAvailable(employee, currentTime, serviceDuration)) {
          const isBooked = appointments.some(apt => apt.employeeId === employeeId && dayjs.utc(apt.startTime).isSame(currentTime));
          if (!isBooked) {
            availableSlots.add(currentTime.format('HH:mm'));
          }
        }
      // LÓGICA PARA EL CASO "CUALQUIER EMPLEADO"
      } else {
        const activeEmployees = await prisma.employee.findMany({
          where: { status: 'ACTIVE' },
          include: { absences: true },
        });

        const potentialCapacity = activeEmployees.filter(emp => isEmployeeAvailable(emp, currentTime, serviceDuration)).length;
        const bookedCapacity = appointments.filter(apt => dayjs.utc(apt.startTime).isSame(currentTime)).length;

        if (potentialCapacity > bookedCapacity) {
          availableSlots.add(currentTime.format('HH:mm'));
        }
      }
      currentTime = currentTime.add(15, 'minutes'); // Verificamos la disponibilidad cada 15 mins
    }

    res.status(200).json(Array.from(availableSlots).sort());

  } catch (error) {
    console.error('Error al calcular la disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;