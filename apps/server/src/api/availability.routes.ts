// File: /apps/server/src/api/availability.routes.ts (VERSIÓN FINAL CON CORRECCIÓN DE TIPO)

import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import prisma from '../lib/prisma';
import { isEmployeeAvailable } from '../lib/availabilityService';

dayjs.extend(utc);
dayjs.extend(isBetween);

const router = Router();

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  employeeId: z.string().cuid().optional(),
});

router.get('/', async (req, res) => {
  try {
    const { date, employeeId } = availabilityQuerySchema.parse(req.query);
    const selectedDate = dayjs.utc(date);

    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' }, include: { defaultService: true },
    });

    if (!settings?.defaultService) {
      return res.status(503).json({ message: 'El servicio por defecto no está configurado.' });
    }

    let businessDayHours: { open: string; close: string } | null = null;
    const override = await prisma.dateOverride.findFirst({
      where: { date: { gte: selectedDate.startOf('day').toDate(), lte: selectedDate.endOf('day').toDate() } }
    });

    if (override) {
      if (override.openTime && override.closeTime) {
        businessDayHours = { open: override.openTime, close: override.closeTime };
      }
    } else {
      const dayOfWeek = selectedDate.locale('en').format('dddd').toLowerCase();
      const weeklySchedule = settings.weeklySchedule as any;
      const daySchedule = weeklySchedule?.[dayOfWeek];
      if (daySchedule) {
        if (Array.isArray(daySchedule) && daySchedule.length > 0 && daySchedule[0]) {
          businessDayHours = { open: daySchedule[0].start, close: daySchedule[0].end };
        } else if (daySchedule.open && daySchedule.close) {
          businessDayHours = { open: daySchedule.open, close: daySchedule.close };
        }
      }
    }

    if (!businessDayHours) {
      return res.json([]);
    }

    const { defaultService } = settings;
    const serviceDuration = defaultService.duration;
    
    const appointmentsOnDay = await prisma.appointment.findMany({
      where: { startTime: { gte: selectedDate.startOf('day').toDate(), lte: selectedDate.endOf('day').toDate() } },
      select: { startTime: true, endTime: true, employeeId: true },
    });

    const employeesToCheck = await prisma.employee.findMany({
      where: { status: 'ACTIVE', ...(employeeId && { id: employeeId }) },
      include: { absences: true },
    });
    
    const availableSlots: string[] = [];
    const openingTime = dayjs.utc(`${date}T${businessDayHours.open}`);
    const closingTime = dayjs.utc(`${date}T${businessDayHours.close}`);

    let currentTime = openingTime;
    
    const slotInterval = serviceDuration;
    
    while (currentTime.add(serviceDuration, 'minutes').isBefore(closingTime.add(1, 'minute'))) {
      const slotStart = currentTime;
      const slotEnd = currentTime.add(serviceDuration, 'minutes');

      const theoreticallyAvailableEmployees = employeesToCheck.filter(emp => 
        isEmployeeAvailable(emp, slotStart, serviceDuration)
      );
      
      // --- BLOQUE CORREGIDO ---
      // Agrupamos las citas por empleado de una forma que TypeScript puede verificar
      const employeeAppointments = appointmentsOnDay.reduce((acc, apt) => {
        const key = apt.employeeId;
        if (!acc[key]) {
          acc[key] = [];
        }
        // Ahora TypeScript sabe que acc[key] es un array y permite el push
        acc[key].push(apt);
        return acc;
      }, {} as Record<string, (typeof appointmentsOnDay)>);
      // --- FIN DEL BLOQUE CORREGIDO ---

      const freeEmployeeCount = theoreticallyAvailableEmployees.filter(emp => {
        const appointmentsForEmployee = employeeAppointments[emp.id] || [];
        const hasOverlappingAppointment = appointmentsForEmployee.some(apt => 
            dayjs.utc(apt.startTime).isBefore(slotEnd) && dayjs.utc(apt.endTime).isAfter(slotStart)
        );
        return !hasOverlappingAppointment;
      }).length;

      if (freeEmployeeCount > 0) {
        availableSlots.push(slotStart.format('HH:mm'));
      }
      
      currentTime = currentTime.add(slotInterval, 'minutes');
    }
    
    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('[AVAILABILITY] Error fatal:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;