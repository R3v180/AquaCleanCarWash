// ====== [70] apps/server/src/lib/notificationService.ts ======
// File: /apps/server/src/lib/notificationService.ts (VERSIÓN COMPLETA CON LÓGICA PUSH)

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import webpush from 'web-push'; // --- IMPORTACIÓN AÑADIDA ---
import { Appointment, Employee, Service, User } from '@prisma/client';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import prisma from './prisma';

dayjs.locale('es');

// --- CONFIGURACIÓN DE WEB-PUSH AÑADIDA ---
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_USER || 'admin@example.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Servicio de Notificaciones Push configurado con claves VAPID.');
} else {
  console.warn('⚠️  Advertencia: Claves VAPID no encontradas. Las notificaciones Push estarán deshabilitadas.');
}
// --- FIN DE LA CONFIGURACIÓN ---


export type FullAppointmentDetails = Appointment & {
  user: (User & { phone?: string | null }) | { name: string | null; email: string | null; };
  employee: Employee;
  services: { service: Service }[];
};

function getContactDetailsForAppointment(appointment: FullAppointmentDetails): { name: string; email: string; phone: string } | null {
  const user = appointment.user as User;
  const email = user?.email || appointment.guestEmail;
  const name = user?.name || appointment.guestName || 'Cliente';
  const phone = appointment.guestPhone || user?.phone;
  if (email && phone) { return { name, email, phone }; }
  console.warn(`[NotificationService] Faltan datos de contacto críticos (email o teléfono) para la cita ID: ${appointment.id}. No se puede notificar.`);
  return null;
}

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) { return transporter; }
  const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
  if (settings && settings.emailHost && settings.emailPort && settings.emailUser && settings.emailPass) {
    console.log('--- Configuración SMTP encontrada en la BBDD. Usando transporter real. ---');
    transporter = nodemailer.createTransport({
      host: settings.emailHost,
      port: Number(settings.emailPort),
      secure: Number(settings.emailPort) === 465,
      auth: { user: settings.emailUser, pass: settings.emailPass },
    });
    return transporter;
  }
  console.log('--- No se encontró configuración SMTP. Usando simulador Ethereal. ---');
  const testAccount = await nodemailer.createTestAccount();
  console.log('User:', testAccount.user, 'Pass:', testAccount.pass);
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return transporter;
}

async function sendVerificationEmail(userEmail: string, token: string) {
  try {
    const mailTransporter = await getTransporter();
    const verificationUrl = `http://localhost:3001/api/customer/verify-email?token=${token}`;
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    const fromEmail = settings?.emailFrom || '"AquaClean Car Wash" <noreply@aquaclean.com>';
    const mailOptions = {
      from: fromEmail, to: userEmail, subject: '¡Activa tu cuenta en AquaClean!',
      html: `<p>¡Hola!</p><p>Gracias por registrarte en AquaClean Car Wash. Por favor, haz clic en el siguiente botón para activar tu cuenta:</p><p style="text-align: center;"><a href="${verificationUrl}" style="padding: 12px 20px; background-color: #228be6; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">Confirmar mi Email</a></p><p>Si no te has registrado, por favor, ignora este mensaje.</p><p>El enlace es válido por 24 horas.</p>`,
    };
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`✅ Email de verificación enviado con éxito a: ${userEmail}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('🔗 Vista previa (Ethereal):', previewUrl);
  } catch (error) { console.error(`Error al enviar el email de verificación a ${userEmail}:`, error); }
}

async function sendPasswordResetEmail(userEmail: string, token: string) {
    try {
      const mailTransporter = await getTransporter();
      const resetUrl = `${process.env.CORS_ALLOWED_ORIGIN}/reset-password?token=${token}`;
      const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
      const fromEmail = settings?.emailFrom || '"AquaClean Car Wash" <noreply@aquaclean.com>';
      const mailOptions = {
        from: fromEmail, to: userEmail, subject: 'Restablece tu contraseña de AquaClean',
        html: `<p>Hola,</p><p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para elegir una nueva:</p><p style="text-align: center;"><a href="${resetUrl}" style="padding: 12px 20px; background-color: #228be6; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">Restablecer Contraseña</a></p><p>Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.</p><p>El enlace es válido por 1 hora.</p>`,
      };
      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`✅ Email de reseteo de contraseña enviado con éxito a: ${userEmail}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log('🔗 Vista previa (Ethereal):', previewUrl);
    } catch (error) { console.error(`Error al enviar el email de reseteo de contraseña a ${userEmail}:`, error); }
}

// --- NUEVA FUNCIÓN INTERNA PARA ENVIAR PUSH ---
async function sendPushNotification(userId: string, payload: object) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) { return; }
  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) {
      console.log(`[Push] No se encontraron suscripciones push para el usuario ID: ${userId}`);
      return;
    }
    console.log(`[Push] Enviando notificación a ${subscriptions.length} dispositivo(s) para el usuario ID: ${userId}`);
    const payloadString = JSON.stringify(payload);
    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payloadString)
      .catch(async (error) => {
        if (error.statusCode === 410) {
          console.log(`[Push] Suscripción obsoleta encontrada (410 Gone). Eliminando de la BBDD: ${sub.endpoint}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error(`[Push] Error al enviar notificación a ${sub.endpoint}:`, error.body);
        }
      })
    );
    await Promise.all(sendPromises);
  } catch (dbError) {
    console.error(`[Push] Error de base de datos al buscar suscripciones para el usuario ID ${userId}:`, dbError);
  }
}

async function sendWhatsAppConfirmation(appointmentDetails: FullAppointmentDetails, customerPhone: string) {
  try {
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    if (!settings || !settings.twilioSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
      console.log('--- Faltan credenciales de Twilio en la BBDD. Omitiendo envío de WhatsApp. ---');
      return;
    }
    const client = twilio(settings.twilioSid, settings.twilioAuthToken);
    const { user, services, startTime } = appointmentDetails;
    const service = services[0]?.service;
    if (!service) return;
    const formattedDate = dayjs(startTime).format('D [de] MMMM');
    const formattedTime = dayjs(startTime).format('HH:mm');
    const fromNumber = settings.twilioPhoneNumber;
    const toNumber = `whatsapp:${customerPhone.startsWith('+') ? customerPhone : `+34${customerPhone}`.replace(/\s+/g, '')}`;
    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: `¡Hola ${user.name || 'Cliente'}! 👋 Tu cita en AquaClean para un *${service.name}* el *${formattedDate}* a las *${formattedTime}h* está confirmada. ¡Te esperamos!`,
    });
    console.log(`✅ WhatsApp de confirmación enviado con éxito a: ${toNumber}`);
  } catch (error) {
    console.error('Error al enviar el WhatsApp de confirmación:', error);
  }
}

async function sendBookingConfirmation(appointmentDetails: FullAppointmentDetails, customerPhone: string) {
  try {
    const mailTransporter = await getTransporter();
    const { user, employee, services, startTime, userId } = appointmentDetails;
    const service = services[0]?.service;
    if (!service || !user.email) { return; }
    
    const formattedDateTime = dayjs(startTime).format('dddd, D [de] MMMM [de] YYYY [a las] HH:mm');
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    const fromEmail = settings?.emailFrom || '"AquaClean Car Wash" <noreply@aquaclean.com>';
    const businessEmail = settings?.emailUser || 'business@aquaclean.com';
    
    const customerMailOptions = {
      from: fromEmail,
      to: user.email,
      subject: `¡Tu cita en AquaClean está confirmada para el ${dayjs(startTime).format('DD/MM/YYYY')}!`,
      html: `<p>Hola ${user.name || 'Cliente'},</p><p>Tu cita ha sido confirmada con los siguientes detalles:</p><ul><li><strong>Servicio:</strong> ${service.name}</li><li><strong>Profesional:</strong> ${employee.name}</li><li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li></ul><p>Te esperamos.</p>`,
    };
    const businessMailOptions = {
      from: fromEmail,
      to: businessEmail,
      subject: `📢 Nueva Reserva: ${service.name} para ${user.name}`,
      html: `<p>Nueva reserva:</p><ul><li><strong>Cliente:</strong> ${user.name} (${user.email})</li><li><strong>Servicio:</strong> ${service.name}</li><li><strong>Profesional:</strong> ${employee.name}</li><li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li></ul>`,
    };

    const [customerInfo, businessInfo] = await Promise.all([
      mailTransporter.sendMail(customerMailOptions),
      mailTransporter.sendMail(businessMailOptions),
    ]);
    if (customerInfo.accepted.length > 0) { console.log('✅ Email de confirmación enviado con éxito a:', user.email); }
    if (businessInfo.accepted.length > 0) { console.log('✅ Email de notificación enviado con éxito a:', businessEmail); }
    const previewUrl = nodemailer.getTestMessageUrl(customerInfo);
    if (previewUrl) { console.log('🔗 Vista previa (Ethereal):', previewUrl); }
    
    await sendWhatsAppConfirmation(appointmentDetails, customerPhone);

    if (userId) {
      const payload = {
        title: '¡Reserva Confirmada! ✅',
        body: `Tu cita para un ${service.name} el ${dayjs(startTime).format('DD/MM')} a las ${dayjs(startTime).format('HH:mm')}h está confirmada.`,
        url: '/dashboard/appointments',
      };
      await sendPushNotification(userId, payload);
    }
  } catch (error) { console.error('Error durante el proceso de notificación:', error); }
}

async function sendAppointmentReminder(appointmentDetails: FullAppointmentDetails) {
  const contact = getContactDetailsForAppointment(appointmentDetails);
  if (!contact) return;

  try {
    const mailTransporter = await getTransporter();
    const { services, startTime, userId } = appointmentDetails;
    const service = services[0]?.service;
    if (!service) return;

    const formattedTime = dayjs(startTime).format('HH:mm');
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    const fromEmail = settings?.emailFrom || '"AquaClean Car Wash" <noreply@aquaclean.com>';

    const customerMailOptions = {
      from: fromEmail,
      to: contact.email,
      subject: `Recordatorio: Tu cita en AquaClean es mañana a las ${formattedTime}h`,
      html: `<p>Hola ${contact.name},</p><p>Este es un recordatorio de tu cita para un <strong>${service.name}</strong> mañana a las <strong>${formattedTime}h</strong>.</p><p>Si necesitas realizar algún cambio, por favor, ponte en contacto con nosotros.</p><p>¡Te esperamos!</p>`,
    };

    const info = await mailTransporter.sendMail(customerMailOptions);
    if (info.accepted.length > 0) {
      console.log(`✅ Email de RECORDATORIO enviado con éxito a: ${contact.email} para la cita ID: ${appointmentDetails.id}`);
    }
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('🔗 Vista previa del recordatorio (Ethereal):', previewUrl);
    
    if (userId && service) {
      const payload = {
        title: '⏰ Recordatorio de Cita',
        body: `¡No lo olvides! Mañana a las ${dayjs(startTime).format('HH:mm')}h tienes tu cita para un ${service.name}.`,
        url: '/dashboard/appointments',
      };
      await sendPushNotification(userId, payload);
    }
  } catch (error) { console.error(`Error al enviar el recordatorio para la cita ID ${appointmentDetails.id}:`, error); }
}

async function sendWhatsAppReviewRequest(appointmentDetails: FullAppointmentDetails, reviewUrl: string, customerPhone: string) {
  try {
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    if (!settings || !settings.twilioSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) { return; }
    const client = twilio(settings.twilioSid, settings.twilioAuthToken);
    const { user } = appointmentDetails;
    const fromNumber = settings.twilioPhoneNumber;
    const toNumber = `whatsapp:${customerPhone.startsWith('+') ? customerPhone : `+34${customerPhone}`.replace(/\s+/g, '')}`;
    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: `¡Hola ${user.name || 'Cliente'}! 👋 Esperamos que tu coche haya quedado impecable. ¿Te importaría dejarnos tu opinión en 1 minuto? Tu feedback nos ayuda a mejorar. ¡Gracias!\n\n${reviewUrl}`,
    });
    console.log(`✅ WhatsApp de SOLICITUD DE VALORACIÓN enviado con éxito a: ${toNumber}`);
  } catch (error) { console.error(`Error al enviar WhatsApp de valoración para la cita ID ${appointmentDetails.id}:`, error); }
}

async function sendReviewRequest(appointmentDetails: FullAppointmentDetails) {
  const contact = getContactDetailsForAppointment(appointmentDetails);
  if (!contact) return;

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) { console.error('No se puede generar el token de valoración: JWT_SECRET no definido.'); return; }
    
    const reviewToken = jwt.sign({ appointmentId: appointmentDetails.id }, jwtSecret, { expiresIn: '7d' });
    const reviewUrl = `http://localhost:5173/review?token=${reviewToken}`;
    const mailTransporter = await getTransporter();
    const { services, userId } = appointmentDetails;
    const service = services[0]?.service;
    if (!service) return;
    
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    const fromEmail = settings?.emailFrom || '"AquaClean" <noreply@aquaclean.com>';
    const customerMailOptions = {
      from: fromEmail,
      to: contact.email,
      subject: `¡Gracias por tu visita a AquaClean! ¿Qué tal ha ido?`,
      html: `<p>Hola ${contact.name},</p><p>¡Esperamos que tu coche haya quedado impecable! ✨</p><p>Tu opinión es muy importante. ¿Te importaría dedicar un minuto a valorar tu experiencia?</p><p><a href="${reviewUrl}" style="padding: 10px 15px; background-color: #228be6; color: white; text-decoration: none; border-radius: 5px;">Dejar mi valoración</a></p><p>¡Gracias por confiar en AquaClean!</p>`,
    };
    
    const info = await mailTransporter.sendMail(customerMailOptions);
    console.log(`✅ Email de SOLICITUD DE VALORACIÓN enviado con éxito a: ${contact.email}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('🔗 Vista previa (Ethereal):', previewUrl);
    
    await sendWhatsAppReviewRequest(appointmentDetails, reviewUrl, contact.phone);
    
    if (userId) {
      const payload = {
        title: '¡Gracias por tu visita! ⭐',
        body: 'Tu opinión es muy importante para nosotros. ¿Te importaría valorar tu experiencia?',
        url: '/dashboard/appointments',
      };
      await sendPushNotification(userId, payload);
    }
  } catch (error) { console.error(`Error al enviar la solicitud de valoración para la cita ID ${appointmentDetails.id}:`, error); }
}

export const notificationService = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendReviewRequest,
};