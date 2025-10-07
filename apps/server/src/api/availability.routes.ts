// File: /apps/server/src/api/availability.routes.ts (CORRECCIÓN FINAL: dayjs locale)

import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/en'; // <-- IMPORTAMOS EL LOCALE INGLÉS
import prisma from '../lib/prisma';
import { Employee, Absence } from '@prisma/client';
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
    const validation = availabilityQuerySchema.safeParse(req.query);
    if (!validation.success) return res.status(400).json({ errors: validation.error.issues });
    
    const { date, employeeId } = validation.data;
    const selectedDate = dayjs.utc(date);

    // --- LÍNEA CORREGIDA ---
    // Forzamos a dayjs a usar inglés para que 'monday' coincida con la clave en la BBDD
    dayjs.locale('en');

    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: { defaultService: true },
    });
    if (!settings?.defaultService) return res.status(503).json({ message: 'El servicio por defecto no está configurado.' });

    let businessDayHours: { open: string; close: string } | null = null;

    const override = await prisma.dateOverride.findFirst({
        where: { date: { gte: selectedDate.startOf('day').toDate(), lte: selectedDate.endOf('day').toDate() } }
    });

    if (override) {
        if (override.openTime && override.closeTime) {
            businessDayHours = { open: override.openTime, close: override.closeTime };
        } else {
            return res.json([]);
        }
    } else {
        const dayOfWeek = selectedDate.format('dddd').toLowerCase(); // <-- Esto ahora devolverá "monday", "tuesday", etc.
        const weeklySchedule = settings.weeklySchedule as any;
        businessDayHours = weeklySchedule?.[dayOfWeek] || null;
    }
    
    if (!businessDayHours) {
        return res.json([]);
    }
    
    const { defaultService } = settings;
    const serviceDuration = defaultService.duration;

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
      if (bookedSlots.has(slotTime)) {
        currentTime = currentTime.add(serviceDuration, 'minutes');
        continue;
      }
      let isSlotAvailable = false;
      if (employeeId && employeeId !== 'any') {
          const specificEmployee = activeEmployees.find(emp => emp.id === employeeId);
          if (specificEmployee) {
              isSlotAvailable = isEmployeeAvailable(specificEmployee, currentTime, serviceDuration);
          }
      } else {
          isSlotAvailable = activeEmployees.some(emp => isEmployeeAvailable(emp, currentTime, serviceDuration));
      }
      
      if (isSlotAvailable) {
        availableSlots.push(slotTime);
      }
      
      currentTime = currentTime.add(serviceDuration, 'minutes');
    }
    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Error al calcular la disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;