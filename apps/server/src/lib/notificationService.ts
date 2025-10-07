// File: /apps/server/src/lib/notificationService.ts (VERSIÓN FINAL CON ETHEREAL FORZADO Y SIN ERRORES)

import nodemailer from 'nodemailer';
import { Appointment, Employee, Service, User } from '@prisma/client';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export type FullAppointmentDetails = Appointment & {
  user: User;
  employee: Employee;
  services: { service: Service }[];
};

let transporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

/**
 * Crea y configura un transporter de Nodemailer usando una cuenta de prueba de Ethereal.
 * Es una función asíncrona que solo se ejecuta una vez para obtener las credenciales.
 */
async function getTransporter() {
  // Si ya tenemos el transporter, lo reutilizamos.
  if (transporter) {
    return transporter;
  }

  // Si no, creamos una cuenta de prueba de Ethereal.
  testAccount = await nodemailer.createTestAccount();

  console.log('--- Ethereal Mail Account (SIMULADOR DE EMAIL) ---');
  console.log('User:', testAccount.user);
  console.log('Pass:', testAccount.pass);
  console.log('Los emails enviados aparecerán en la terminal con un enlace individual.');
  console.log('----------------------------------------------------');

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  return transporter;
}

/**
 * Envía un email de confirmación de reserva al cliente y una notificación al negocio.
 * @param appointmentDetails - El objeto completo de la cita con sus relaciones.
 */
async function sendBookingConfirmation(appointmentDetails: FullAppointmentDetails) {
  try {
    const mailTransporter = await getTransporter();
    const { user, employee, services, startTime } = appointmentDetails;
    const service = services[0]?.service;

    if (!service) {
      console.error('Error: No se encontró el servicio en los detalles de la cita.');
      return;
    }

    const formattedDateTime = dayjs(startTime).format('dddd, D [de] MMMM [de] YYYY [a las] HH:mm');

    // 1. Email para el Cliente
    const customerMailOptions = {
      from: '"AquaClean Car Wash" <noreply@aquaclean.com>',
      to: user.email,
      subject: `¡Tu cita en AquaClean está confirmada para el ${dayjs(startTime).format('DD/MM/YYYY')}!`,
      text: `
        Hola ${user.name || 'Cliente'},

        ¡Gracias por reservar con nosotros!

        Tu cita ha sido confirmada con los siguientes detalles:
        - Servicio: ${service.name}
        - Profesional: ${employee.name}
        - Fecha y Hora: ${formattedDateTime}

        Te esperamos. Si necesitas cancelar o reprogramar, por favor, contacta con nosotros.

        Saludos,
        El equipo de AquaClean Car Wash
      `,
    };

    // 2. Email para el Negocio (se enviará a Ethereal también)
    const businessMailOptions = {
      from: '"Sistema de Reservas AquaClean" <noreply@aquaclean.com>',
      to: 'business@aquaclean.com', // Dirección de prueba
      subject: `📢 Nueva Reserva: ${service.name} para ${user.name}`,
      text: `
        ¡Se ha registrado una nueva reserva!

        Detalles de la cita:
        - Cliente: ${user.name} (${user.email})
        - Servicio: ${service.name}
        - Profesional Asignado: ${employee.name}
        - Fecha y Hora: ${formattedDateTime}

        La cita ha sido añadida automáticamente al planning.
      `,
    };

    const [customerInfo, businessInfo] = await Promise.all([
      mailTransporter.sendMail(customerMailOptions),
      mailTransporter.sendMail(businessMailOptions),
    ]);

    // --- LOGS CORREGIDOS ---
    // Obtenemos la URL del mensaje DESPUÉS de enviarlo, lo cual es correcto y no da error.
    console.log('----------------------------------------------------');
    console.log('✅ Emails de simulación enviados con éxito.');
    console.log('🔗 Vista previa del email del CLIENTE:', nodemailer.getTestMessageUrl(customerInfo));
    console.log('🔗 Vista previa del email del NEGOCIO:', nodemailer.getTestMessageUrl(businessInfo));
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('Error al enviar los emails de confirmación:', error);
  }
}


// Exportamos el servicio para que pueda ser utilizado en otras partes de la aplicación
export const notificationService = {
  sendBookingConfirmation,
};