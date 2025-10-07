// File: /apps/server/src/lib/availabilityService.ts (CORRECCIÓN FINAL DE LÓGICA DE LÍMITES)

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/en';
import { Employee, Absence } from '@prisma/client';
import prisma from './prisma';

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('en');

export function isEmployeeAvailable(
  employee: Employee & { absences: Absence[] },
  slot: dayjs.Dayjs,
  serviceDuration: number
): boolean {
  const dayOfWeek = slot.format('dddd').toLowerCase();
  const workSchedule = employee.workSchedule as any;
  const daySchedule = workSchedule?.[dayOfWeek];

  console.log(`\n[isEmployeeAvailable] Empleado: ${employee.name}, Slot: ${slot.format('HH:mm')}, Día: [${dayOfWeek}]`);

  if (!daySchedule) {
    console.log(` -> RESULTADO: FALLO (No se encontró horario para [${dayOfWeek}]).`);
    return false;
  }

  const worksDuringSlot = (daySchedule as any[]).some(shift => {
    console.log(` -> Comprobando turno: ${shift.start}-${shift.end}`);
    const shiftStart = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.start}`);
    const shiftEnd = dayjs.utc(`${slot.format('YYYY-MM-DD')}T${shift.end}`);
    const slotEnd = slot.add(serviceDuration, 'minutes');

    const fits = slot.isSameOrAfter(shiftStart) && slotEnd.isSameOrBefore(shiftEnd);
    
    if(!fits) {
      console.log(`    -> RESULTADO TURNO: FALLO.`);
    } else {
      console.log(`    -> RESULTADO TURNO: ÉXITO (El tramo cabe en este turno).`);
    }
    return fits;
  });

  if (!worksDuringSlot) {
    console.log(` -> RESULTADO FINAL: FALLO (No encaja en ningún turno).`);
    return false;
  }
  
  const hasAbsence = employee.absences.some(absence => {
    return slot.isBetween(dayjs.utc(absence.startDate), dayjs.utc(absence.endDate), 'day', '[]');
  });

  if (hasAbsence) {
    console.log(` -> RESULTADO FINAL: FALLO (Ausencia programada).`);
    return false;
  }

  console.log(` -> RESULTADO FINAL: ÉXITO.`);
  return true;
};

export async function findAvailableEmployeeForSlot(startTime: Date, endTime: Date, serviceDuration: number): Promise<string | undefined> {
  console.log('\n--- [findAvailableEmployeeForSlot] Buscando empleado... ---');
  
  const overlappingAppointments = await prisma.appointment.findMany({
    where: { OR: [ { startTime: { lt: endTime }, endTime: { gt: startTime } } ] },
    select: { employeeId: true },
  });
  const busyEmployeeIds = new Set(overlappingAppointments.map(a => a.employeeId));

  const potentialEmployees = await prisma.employee.findMany({
    where: { status: 'ACTIVE', absences: { none: { startDate: { lte: endTime }, endDate: { gte: startTime } } } },
    include: { absences: true }
  });
  
  const startTimeUtc = dayjs(startTime.toISOString());
  console.log(`[findAvailableEmployeeForSlot] Hora de inicio normalizada a UTC: ${startTimeUtc.format('YYYY-MM-DD HH:mm:ss')}`);


  const availableEmployee = potentialEmployees.find(employee => {
    if (busyEmployeeIds.has(employee.id)) {
        return false;
    }
    return isEmployeeAvailable(employee, startTimeUtc, serviceDuration);
  });

  if (!availableEmployee) {
    console.log('--- [findAvailableEmployeeForSlot] RESULTADO: NO se encontró ningún empleado. ---');
  } else {
    console.log(`--- [findAvailableEmployeeForSlot] RESULTADO: Empleado encontrado -> ${availableEmployee.name}`);
  }

  return availableEmployee ? availableEmployee.id : undefined;
}