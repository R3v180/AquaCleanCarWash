// File: /apps/server/src/lib/notificationService.ts (ACTUALIZADO)

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Appointment, Employee, Service, User } from '@prisma/client';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import prisma from './prisma';

dayjs.locale('es');

export type FullAppointmentDetails = Appointment & {
  user: User;
  employee: Employee;
  services: { service: Service }[];
};

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

async function sendWhatsAppConfirmation(appointmentDetails: FullAppointmentDetails, customerPhone: string) {
  try {
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    if (!settings || !settings.twilioSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
      console.log('--- Faltan credenciales de Twilio en la BBDD. Omitiendo envío de WhatsApp. ---');
      return;
    }
    console.log('--- Credenciales de Twilio encontradas. Intentando enviar WhatsApp. ---');
    const client = twilio(settings.twilioSid, settings.twilioAuthToken);
    const { user, services, startTime } = appointmentDetails;
    const service = services[0]?.service;
    if (!service) return;

    const formattedDate = dayjs(startTime).format('D [de] MMMM');
    const formattedTime = dayjs(startTime).format('HH:mm');

    const fromNumber = settings.twilioPhoneNumber;
    const toNumber = `whatsapp:${customerPhone.startsWith('+') ? customerPhone : `+34${customerPhone}`.replace(/\s+/g, '')}`;

    console.log(`  -> Intentando enviar desde: ${fromNumber}`);
    console.log(`  -> Intentando enviar a: ${toNumber}`);

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: `¡Hola ${user.name}! 👋 Tu cita en AquaClean para un *${service.name}* el *${formattedDate}* a las *${formattedTime}h* está confirmada. ¡Te esperamos!`,
    });

    console.log(`✅ WhatsApp de confirmación enviado con éxito a: ${toNumber}`);

  } catch (error) {
    console.error('Error al enviar el WhatsApp de confirmación:', error);
  }
}

async function sendBookingConfirmation(appointmentDetails: FullAppointmentDetails, customerPhone: string) {
  try {
    const mailTransporter = await getTransporter();
    const { user, employee, services, startTime } = appointmentDetails;
    const service = services[0]?.service;
    if (!service) { return; }
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

  } catch (error) {
    console.error('Error durante el proceso de notificación:', error);
  }
}

// --- NUEVA FUNCIÓN AÑADIDA ---
async function sendAppointmentReminder(appointmentDetails: FullAppointmentDetails) {
  try {
    const mailTransporter = await getTransporter();
    const { user, services, startTime } = appointmentDetails;
    const service = services[0]?.service;
    if (!service || !user) return; // Salimos si no hay servicio o usuario

    const formattedTime = dayjs(startTime).format('HH:mm');
    const settings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
    const fromEmail = settings?.emailFrom || '"AquaClean Car Wash" <noreply@aquaclean.com>';

    const customerMailOptions = {
      from: fromEmail,
      to: user.email,
      subject: `Recordatorio: Tu cita en AquaClean es mañana a las ${formattedTime}h`,
      html: `<p>Hola ${user.name || 'Cliente'},</p><p>Este es un recordatorio de tu cita para un <strong>${service.name}</strong> mañana a las <strong>${formattedTime}h</strong>.</p><p>Si necesitas realizar algún cambio, por favor, ponte en contacto con nosotros.</p><p>¡Te esperamos!</p>`,
    };

    const info = await mailTransporter.sendMail(customerMailOptions);

    if (info.accepted.length > 0) {
      console.log(`✅ Email de RECORDATORIO enviado con éxito a: ${user.email} para la cita ID: ${appointmentDetails.id}`);
    }
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('🔗 Vista previa del recordatorio (Ethereal):', previewUrl);
    }
    
    // Aquí iría la llamada a sendWhatsAppReminder si tuviéramos el teléfono

  } catch (error) {
    console.error(`Error al enviar el recordatorio para la cita ID ${appointmentDetails.id}:`, error);
  }
}

export const notificationService = {
  sendBookingConfirmation,
  sendAppointmentReminder, // <-- Exportamos la nueva función
};