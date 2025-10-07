// File: /apps/server/src/lib/availabilityService.ts (CORRECCIÓN FINAL DE ZONA HORARIA)

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // <-- Importamos UTC
import { Employee, Absence } from '@prisma/client';
import prisma from './prisma';

dayjs.extend(utc); // <-- Y lo usamos

/**
 * Comprueba si un empleado específico está disponible para un tramo horario.
 * @param employee El objeto del empleado con sus ausencias.
 * @param slot El objeto dayjs del inicio del tramo.
 * @param serviceDuration La duración del servicio en minutos.
 * @returns true si el empleado está disponible, false si no.
 */
export function isEmployeeAvailable(
  employee: Employee & { absences: Absence[] },
  slot: dayjs.Dayjs,
  serviceDuration: number
): boolean {
  const dayOfWeek = slot.format('dddd').toLowerCase();
  const workSchedule = employee.workSchedule as any;
  const daySchedule = workSchedule?.[dayOfWeek] as { start: string; end: string }[] | undefined;
  if (!daySchedule) return false;

  const worksDuringSlot = daySchedule.some(shift => {
    const shiftStart = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.start}`);
    const shiftEnd = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.end}`);
    const slotEnd = slot.add(serviceDuration, 'minutes');
    return !slot.isBefore(shiftStart) && !slotEnd.isAfter(shiftEnd);
  });
  if (!worksDuringSlot) return false;
  
  const hasAbsence = employee.absences.some(absence => {
    return slot.isBetween(dayjs.utc(absence.startDate), dayjs.utc(absence.endDate), 'day', '[]');
  });
  if (hasAbsence) return false;

  return true;
};

/**
 * Busca un empleado activo y disponible para un tramo horario específico.
 * @param startTime El inicio de la cita.
 * @param endTime El fin de la cita.
 * @param serviceDuration La duración en minutos.
 * @returns El ID del primer empleado disponible encontrado, o undefined si no hay ninguno.
 */
export async function findAvailableEmployeeForSlot(startTime: Date, endTime: Date, serviceDuration: number): Promise<string | undefined> {
  // 1. Encontrar empleados ocupados en ese slot
  const overlappingAppointments = await prisma.appointment.findMany({
    where: {
      OR: [ { startTime: { lt: endTime }, endTime: { gt: startTime } } ],
    },
    select: { employeeId: true },
  });
  const busyEmployeeIds = new Set(overlappingAppointments.map(a => a.employeeId));

  // 2. Encontrar empleados activos que no tengan ausencia
  const potentialEmployees = await prisma.employee.findMany({
    where: {
      status: 'ACTIVE',
      absences: { none: { startDate: { lte: endTime }, endDate: { gte: startTime } } },
    },
    include: { absences: true } // Incluimos ausencias para pasarlo al helper
  });
  
  // 3. Filtrar por horario laboral usando el helper centralizado
  const availableEmployee = potentialEmployees.find(employee => {
    if (busyEmployeeIds.has(employee.id)) return false;
    // --- LÍNEA CORREGIDA ---
    // DEBE ser dayjs.utc() para que coincida con la lógica de la API de disponibilidad
    return isEmployeeAvailable(employee, dayjs.utc(startTime), serviceDuration);
  });

  return availableEmployee ? availableEmployee.id : undefined;
}