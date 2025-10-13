// ====== [68] apps/server/src/lib/cronService.ts ======
// File: /apps/server/src/lib/cronService.ts (USANDO LÓGICA DE CONTACTO CENTRALIZADA)

import cron from 'node-cron';
import dayjs from 'dayjs';
import prisma from './prisma';
import { AppointmentStatus } from '@prisma/client';
import { notificationService } from './notificationService';
import type { FullAppointmentDetails } from './notificationService';

const startReminderService = () => {
  // Esta tarea se ejecutará al principio de cada hora (minuto 0).
  cron.schedule('0 * * * *', async () => {
    console.log(`\n--- [CRON JOB] Ejecutando tarea de recordatorios de citas - ${new Date().toISOString()} ---`);

    try {
      // 1. Definimos la ventana de tiempo para buscar citas.
      const now = dayjs();
      const reminderWindowStart = now.add(24, 'hour').toDate();
      const reminderWindowEnd = now.add(25, 'hour').toDate();

      console.log(`Buscando citas entre: ${reminderWindowStart.toISOString()} y ${reminderWindowEnd.toISOString()}`);

      // 2. Buscamos en la base de datos (la consulta ya incluye todos los datos necesarios).
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
          user: true, // Incluimos perfil completo del usuario (con teléfono)
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
        
        // --- LÓGICA REFACTORIZADA ---
        // Simplemente delegamos la cita al servicio de notificación.
        // Él se encargará de averiguar si hay datos de contacto válidos (invitado o registrado) y enviar el recordatorio.
        await notificationService.sendAppointmentReminder(appointment as FullAppointmentDetails);
        
        // Marcamos la cita como recordatorio enviado para no volver a notificarla.
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        });
        console.log(`Recordatorio para la cita ID ${appointment.id} procesado y marcado como enviado.`);
        // --- FIN DE LA LÓGICA REFACTORIZADA ---

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