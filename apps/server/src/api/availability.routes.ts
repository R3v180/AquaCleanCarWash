import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import prisma from '../lib/prisma';

// Dayjs necesita estos plugins para manejar zonas horarias correctamente
dayjs.extend(utc);

const router = Router();

// Esquema para validar los parámetros que recibimos en la URL
const availabilityQuerySchema = z.object({
  // Aseguramos que la fecha venga en formato YYYY-MM-DD
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  // La duración del servicio debe ser un número (vendrá como string de la URL)
  duration: z.string().regex(/^\d+$/).transform(Number),
});

router.get('/', async (req, res) => {
  try {
    // 1. VALIDACIÓN DE ENTRADA
    const validation = availabilityQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ message: 'Parámetros inválidos.', errors: validation.error.issues });
    }
    const { date, duration } = validation.data;
    const selectedDate = dayjs.utc(date);
    const dayOfWeek = selectedDate.format('dddd').toLowerCase(); // 'monday', 'tuesday', etc.

    // 2. OBTENER DATOS RELEVANTES DE LA BASE DE DATOS
    // Por ahora, consideramos a todos los empleados. Más adelante se podría filtrar por employeeId.
    const employees = await prisma.employee.findMany({
      where: { workSchedule: { not: 'null' } }, // Solo empleados con horario definido
    });

    // Buscamos todas las citas para el día seleccionado para saber qué huecos están ya ocupados
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: selectedDate.startOf('day').toDate(),
          lte: selectedDate.endOf('day').toDate(),
        },
      },
    });

    // 3. DEFINIR HORARIO DE ATENCIÓN Y PARÁMETROS
    // Horario general del negocio (se puede hacer más complejo en el futuro)
    const openingTime = 9; // 09:00
    const closingTime = 19; // 19:00
    const slotInterval = 15; // Comprobamos la disponibilidad cada 15 minutos

    // 4. GENERAR TODOS LOS POSIBLES HUECOS DEL DÍA
    const availableSlots: string[] = [];
    let currentTime = selectedDate.hour(openingTime).minute(0).second(0);
    const endOfDay = selectedDate.hour(closingTime).minute(0).second(0);

    while (currentTime.isBefore(endOfDay)) {
      const slotStartTime = currentTime;
      const slotEndTime = currentTime.add(duration, 'minutes');

      // Condición 1: El servicio no puede terminar después de la hora de cierre
      if (slotEndTime.isAfter(endOfDay)) {
        break; // Si ya no caben más servicios hoy, salimos del bucle
      }

      // Condición 2: El hueco debe estar dentro del horario de al menos UN empleado
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
      
      // Condición 3: El hueco no puede solaparse con una cita existente
      const isOverlapping = appointments.some(appointment => {
        const aptStart = dayjs(appointment.startTime);
        const aptEnd = dayjs(appointment.endTime);
        // Lógica de solapamiento: Un hueco se solapa si empieza antes de que termine una cita
        // y termina después de que esa cita haya empezado.
        return slotStartTime.isBefore(aptEnd) && slotEndTime.isAfter(aptStart);
      });

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