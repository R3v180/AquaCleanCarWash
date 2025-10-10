// File: /apps/server/src/lib/availabilityService.ts (CON LOGS DE DEPURACIÓN EN isEmployeeAvailable)

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/en';
import { Employee, Absence } from '@prisma/client';
import prisma from './prisma';

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.locale('en');

export function isEmployeeAvailable(
  employee: Employee & { absences: Absence[] },
  slot: dayjs.Dayjs,
  serviceDuration: number
): boolean {
  const dayOfWeek = slot.locale('en').format('dddd').toLowerCase();
  const workSchedule = employee.workSchedule as any;
  const daySchedule = workSchedule?.[dayOfWeek];

  if (!daySchedule || daySchedule.length === 0) {
    return false;
  }

  // --- LOGS DE DEPURACIÓN ---
  const slotEnd = slot.add(serviceDuration, 'minutes');
  console.log(`\n[DEBUG] Comprobando Empleado: ${employee.name} | Slot: ${slot.format('HH:mm')} - ${slotEnd.format('HH:mm')} | Día: ${dayOfWeek}`);
  // --- FIN DE LOGS ---

  const worksDuringSlot = (daySchedule as any[]).some(shift => {
    const shiftStart = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.start}`);
    const shiftEnd = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.end}`);

    const isAfterStart = slot.isSameOrAfter(shiftStart);
    const isBeforeEnd = slotEnd.isSameOrBefore(shiftEnd);

    // --- LOGS DE DEPURACIÓN ---
    console.log(`  -> Turno: ${shift.start}-${shift.end} (${shiftStart.format('HH:mm')}-${shiftEnd.format('HH:mm')} UTC)`);
    console.log(`     Slot empieza >= Turno empieza? ${isAfterStart} (${slot.format('HH:mm')} >= ${shiftStart.format('HH:mm')})`);
    console.log(`     Slot termina <= Turno termina? ${isBeforeEnd} (${slotEnd.format('HH:mm')} <= ${shiftEnd.format('HH:mm')})`);
    // --- FIN DE LOGS ---

    return isAfterStart && isBeforeEnd;
  });

  if (!worksDuringSlot) {
    console.log(`[DEBUG] RESULTADO: ❌ ${employee.name} NO trabaja en este slot.`);
    return false;
  }
  
  const hasAbsence = employee.absences.some(absence => {
    const absenceStart = dayjs.utc(absence.startDate).startOf('day');
    const absenceEnd = dayjs.utc(absence.endDate).endOf('day');
    const hasConflict = slot.isBetween(absenceStart, absenceEnd, null, '[]');
    if (hasConflict) {
        console.log(`[DEBUG] Conflicto de ausencia encontrado: ${absenceStart.format('YYYY-MM-DD')} a ${absenceEnd.format('YYYY-MM-DD')}`);
    }
    return hasConflict;
  });

  if (hasAbsence) {
    console.log(`[DEBUG] RESULTADO: ❌ ${employee.name} tiene una ausencia programada.`);
    return false;
  }

  console.log(`[DEBUG] RESULTADO: ✅ ${employee.name} ESTÁ disponible para este slot.`);
  return true;
};

export async function findAvailableEmployeeForSlot(startTime: Date, endTime: Date, serviceDuration: number): Promise<string | undefined> {
  const overlappingAppointments = await prisma.appointment.findMany({
    where: { OR: [ { startTime: { lt: endTime }, endTime: { gt: startTime } } ] },
    select: { employeeId: true },
  });
  const busyEmployeeIds = new Set(overlappingAppointments.map(a => a.employeeId));

  const potentialEmployees = await prisma.employee.findMany({
    where: { 
      status: 'ACTIVE', 
      id: { notIn: Array.from(busyEmployeeIds) },
      absences: { none: { startDate: { lte: endTime }, endDate: { gte: startTime } } } 
    },
    include: { absences: true }
  });
  
  const startTimeUtc = dayjs.utc(startTime);

  const availableEmployee = potentialEmployees.find(employee => {
    return isEmployeeAvailable(employee, startTimeUtc, serviceDuration);
  });

  return availableEmployee ? availableEmployee.id : undefined;
}