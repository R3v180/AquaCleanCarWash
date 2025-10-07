// File: /apps/server/src/api/availability.routes.ts (ACTUALIZADO CON NUEVA LÓGICA)

import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import prisma from '../lib/prisma';

dayjs.extend(utc);

const router = Router();

// El esquema de validación ahora es mucho más simple. Solo necesitamos la fecha.
const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
});

router.get('/', async (req, res) => {
  try {
    // 1. Validar la fecha de entrada
    const validation = availabilityQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ message: 'Parámetros inválidos.', errors: validation.error.issues });
    }
    const { date } = validation.data;
    const selectedDate = dayjs.utc(date);
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();

    // 2. Obtener la configuración del negocio, incluyendo el servicio por defecto
    const settings = await prisma.businessSettings.findUnique({
      where: { singleton: 'SINGLETON' },
      include: {
        defaultService: true, // Incluimos el servicio para obtener su duración
      },
    });

    // Si no hay configuración o servicio por defecto, el sistema no puede operar.
    if (!settings || !settings.defaultService) {
      return res.status(503).json({ message: 'La configuración del negocio no está completa o no se ha establecido un servicio por defecto.' });
    }

    const { weeklySchedule, defaultService } = settings;
    const serviceDuration = defaultService.duration; // La duración fija del servicio
    
    // 3. Comprobar si el negocio está abierto en el día seleccionado
    const businessDayHours = (weeklySchedule as any)[dayOfWeek];
    if (!businessDayHours || !businessDayHours.open || !businessDayHours.close) {
      return res.status(200).json([]); // El negocio está cerrado, devolvemos 0 huecos.
    }

    // 4. Obtener las citas que ya existen para ese día
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: selectedDate.startOf('day').toDate(),
          lte: selectedDate.endOf('day').toDate(),
        },
      },
    });
    // Creamos un Set con las horas de inicio ya reservadas para una búsqueda rápida
    const bookedSlots = new Set(
      appointments.map(apt => dayjs(apt.startTime).utc().format('HH:mm'))
    );

    // 5. Generar todos los tramos horarios posibles del día
    const openingTime = dayjs.utc(`${date}T${businessDayHours.open}`);
    const closingTime = dayjs.utc(`${date}T${businessDayHours.close}`);
    
    const availableSlots: string[] = [];
    let currentTime = openingTime;

    while (currentTime.add(serviceDuration, 'minutes').isBefore(closingTime.add(1, 'minute'))) {
      const slot = currentTime.format('HH:mm');
      
      // Añadimos el tramo solo si NO está ya reservado
      if (!bookedSlots.has(slot)) {
        availableSlots.push(slot);
      }
      
      // El siguiente tramo empieza justo cuando acaba el actual
      currentTime = currentTime.add(serviceDuration, 'minutes');
    }

    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Error al calcular la disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;