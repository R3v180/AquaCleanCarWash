// File: /apps/server/src/lib/cronService.ts (NUEVO ARCHIVO)

import cron from 'node-cron';
import dayjs from 'dayjs';
import prisma from './prisma';
import { AppointmentStatus } from '@prisma/client';
import { notificationService } from './notificationService';
import type { FullAppointmentDetails } from './notificationService';

const startReminderService = () => {
  // Esta tarea se ejecutará al principio de cada hora (minuto 0).
  // Formato cron: minuto(0-59) hora(0-23) día-del-mes(1-31) mes(1-12) día-de-la-semana(0-7)
  cron.schedule('0 * * * *', async () => {
    console.log(`\n--- [CRON JOB] Ejecutando tarea de recordatorios de citas - ${new Date().toISOString()} ---`);

    try {
      // 1. Definimos la ventana de tiempo para buscar citas.
      // Buscamos citas que ocurran entre 24 y 25 horas desde ahora.
      const now = dayjs();
      const reminderWindowStart = now.add(24, 'hour').toDate();
      const reminderWindowEnd = now.add(25, 'hour').toDate();

      console.log(`Buscando citas entre: ${reminderWindowStart.toISOString()} y ${reminderWindowEnd.toISOString()}`);

      // 2. Buscamos en la base de datos.
      const appointmentsToSendReminder = await prisma.appointment.findMany({
        where: {
          status: AppointmentStatus.CONFIRMED,
          reminderSent: false,
          startTime: {
            gte: reminderWindowStart,
            lt: reminderWindowEnd,
          },
        },
        include: {
          user: true,
          employee: true,
          services: { include: { service: true } },
        },
      });

      if (appointmentsToSendReminder.length === 0) {
        console.log('No se encontraron citas que necesiten un recordatorio en esta ejecución.');
        return;
      }

      console.log(`Se encontraron ${appointmentsToSendReminder.length} citas para enviar recordatorio.`);

      // 3. Procesamos cada cita encontrada.
      for (const appointment of appointmentsToSendReminder) {
        if (appointment.user) {
          // 3a. Enviamos la notificación.
          await notificationService.sendAppointmentReminder(appointment as FullAppointmentDetails);
          
          // 3b. Actualizamos la cita para marcar el recordatorio como enviado.
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSent: true },
          });
          console.log(`Recordatorio para la cita ID ${appointment.id} marcado como enviado en la BBDD.`);
        }
      }

    } catch (error) {
      console.error('Error durante la ejecución del cron job de recordatorios:', error);
    } finally {
        console.log('--- [CRON JOB] Tarea de recordatorios finalizada. ---');
    }
  });

  console.log('✅ Servicio de recordatorios (Cron Job) inicializado y programado.');
};

export const reminderService = {
  start: startReminderService,
};