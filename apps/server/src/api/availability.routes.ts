import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import prisma from '../lib/prisma';

dayjs.extend(utc);

const router = Router();

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  duration: z.string().regex(/^\d+$/).transform(Number),
});

router.get('/', async (req, res) => {
  try {
    const validation = availabilityQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ message: 'Parámetros inválidos.', errors: validation.error.issues });
    }
    const { date, duration } = validation.data;
    const selectedDate = dayjs.utc(date);
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();

    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
    });

    if (!settings) {
      // Este es el error que veías. Ahora lo devolvemos con un 404 para ser más claros.
      return res.status(404).json({ message: 'La configuración del negocio no ha sido establecida.' });
    }

    const weeklySchedule = settings.weeklySchedule as any;
    const businessDayHours = weeklySchedule[dayOfWeek];

    if (!businessDayHours || !businessDayHours.open || !businessDayHours.close) {
      return res.status(200).json([]);
    }

    const employees = await prisma.employee.findMany({
      where: { workSchedule: { not: 'null' } },
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: selectedDate.startOf('day').toDate(),
          lte: selectedDate.endOf('day').toDate(),
        },
      },
    });

    const openingTime = parseInt(businessDayHours.open.split(':')[0]);
    const closingTime = parseInt(businessDayHours.close.split(':')[0]);
    const slotInterval = 15;

    const availableSlots: string[] = [];
    let currentTime = selectedDate.hour(openingTime).minute(0).second(0);
    const endOfDay = selectedDate.hour(closingTime).minute(0).second(0);

    while (currentTime.isBefore(endOfDay)) {
      const slotStartTime = currentTime;
      const slotEndTime = currentTime.add(duration, 'minutes');

      if (slotEndTime.isAfter(endOfDay)) {
        break;
      }

      const isWithinEmployeeHours = employees.some(employee => {
        const schedule = employee.workSchedule as any;
        const daySchedule = schedule[dayOfWeek] as { start: string, end: string }[] | undefined;
        if (!daySchedule) return false;

        return daySchedule.some(shift => {
          const shiftStart = dayjs.utc(`${date}T${shift.start}`);
          const shiftEnd = dayjs.utc(`${date}T${shift.end}`);
          return !slotStartTime.isBefore(shiftStart) && !slotEndTime.isAfter(shiftEnd);
        });
      });

      if (!isWithinEmployeeHours) {
        currentTime = currentTime.add(slotInterval, 'minutes');
        continue;
      }

      // --- LÍNEA CORREGIDA ---
      // Esta es la lógica correcta de solapamiento.
      const isOverlapping = appointments.some(appointment => {
        const aptStart = dayjs(appointment.startTime);
        const aptEnd = dayjs(appointment.endTime);
        return slotStartTime.isBefore(aptEnd) && slotEndTime.isAfter(aptStart);
      });
      // --- FIN DE LA CORRECCIÓN ---

      if (!isOverlapping) {
        availableSlots.push(slotStartTime.format('HH:mm'));
      }

      currentTime = currentTime.add(slotInterval, 'minutes');
    }

    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Error al calcular la disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;