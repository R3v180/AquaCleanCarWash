// File: /apps/server/prisma/seed.ts (CON CORRECCIÓN DE CITAS FUTURAS DUPLICADAS)

import { PrismaClient, UserRole, EmployeeStatus, AppointmentStatus, ReviewStatus, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';
import * as dotenv from 'dotenv';

dotenv.config();
dayjs.extend(utc);
dayjs.locale('es');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando el proceso de seeding de la base de datos...');

  console.log('🧹 Limpiando datos antiguos...');
  await prisma.review.deleteMany({});
  await prisma.appointmentService.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.dateOverride.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
  console.log('✅ Limpieza completada.');

  await prisma.user.upsert({
    where: { email: 'admin@aquaclean.com' },
    update: {},
    create: {
      email: 'admin@aquaclean.com', name: 'Admin User',
      passwordHash: await hash('password123', 12),
      role: UserRole.ADMIN, emailVerified: new Date(),
    },
  });
  console.log(`✅ Usuario admin 'admin@aquaclean.com' asegurado.`);

  const olivierUser = await prisma.user.upsert({
    where: { email: 'olivierhottelet1980@gmail.com' },
    update: {},
    create: {
      name: 'olivier hottelet',
      email: 'olivierhottelet1980@gmail.com',
      passwordHash: await hash('Matrix2010@', 12),
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Cliente fijo 'olivierhottelet1980@gmail.com' asegurado.`);

  const mainService = await prisma.service.create({
    data: {
      name: 'Servicio Completo de Detallado', duration: 75,
      description: 'Limpieza profunda interior y exterior, con encerado y tratamiento de plásticos.',
      prices: { standard: 75 }, category: 'Completo', isActive: true,
    },
  });
  console.log('✅ 1 servicio principal creado.');
  
  await prisma.businessSettings.upsert({
    where: { singleton: 'SINGLETON' },
    update: { 
        defaultServiceId: mainService.id,
        emailHost: process.env.EMAIL_HOST, emailPort: process.env.EMAIL_PORT,
        emailUser: process.env.EMAIL_USER, emailPass: process.env.EMAIL_PASS,
        emailFrom: process.env.EMAIL_FROM, twilioSid: process.env.TWILIO_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN, twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    create: {
      singleton: 'SINGLETON', defaultServiceId: mainService.id,
      weeklySchedule: {
        monday: { open: '09:00', close: '19:00' }, tuesday: { open: '09:00', close: '19:00' },
        wednesday: { open: '09:00', close: '19:00' }, thursday: { open: '09:00', close: '19:00' },
        friday: { open: '09:00', close: '19:00' }, saturday: { open: '10:00', close: '14:00' }, sunday: null,
      },
      emailHost: process.env.EMAIL_HOST, emailPort: process.env.EMAIL_PORT,
      emailUser: process.env.EMAIL_USER, emailPass: process.env.EMAIL_PASS,
      emailFrom: process.env.EMAIL_FROM, twilioSid: process.env.TWILIO_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN, twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  });
  console.log('✅ Ajustes del negocio guardados.');

  const standardWorkSchedule = {
    monday: [{ start: '09:00', end: '13:30' }, { start: '15:00', end: '19:00' }],
    tuesday: [{ start: '09:00', end: '13:30' }, { start: '15:00', end: '19:00' }],
    wednesday: [{ start: '09:00', end: '13:30' }, { start: '15:00', end: '19:00' }],
    thursday: [{ start: '09:00', end: '13:30' }, { start: '15:00', end: '19:00' }],
    friday: [{ start: '09:00', end: '13:30' }, { start: '15:00', end: '19:00' }],
    saturday: [{ start: '10:00', end: '14:00' }],
  };
  await prisma.employee.createMany({
    data: [
      { email: 'juan@aquaclean.com', name: 'Juan Empleado', role: UserRole.EMPLOYEE, status: EmployeeStatus.ACTIVE, workSchedule: standardWorkSchedule, color: '#228be6' },
      { email: 'maria@aquaclean.com', name: 'Maria Recepcionista', role: UserRole.EMPLOYEE, status: EmployeeStatus.ACTIVE, workSchedule: standardWorkSchedule, color: '#e64980' },
    ],
  });
  console.log('✅ 2 empleados creados.');

  console.log('🗓️  Generando inventario de citas...');
  const employees = await prisma.employee.findMany();
  const appointmentsToCreate: Prisma.AppointmentCreateManyInput[] = [];
  
  for (const employee of employees) {
    for (let dayOffset = -3; dayOffset < 14; dayOffset++) {
      const currentDay = dayjs().add(dayOffset, 'day').startOf('day');
      const dayOfWeek = currentDay.locale('en').format('dddd').toLowerCase();
      const daySchedule = (employee.workSchedule as any)?.[dayOfWeek];
      if (daySchedule && daySchedule.length > 0) {
        for (const shift of daySchedule) {
          let currentSlotStart = dayjs.utc(`${currentDay.format('YYYY-MM-DD')}T${shift.start}`);
          const shiftEnd = dayjs.utc(`${currentDay.format('YYYY-MM-DD')}T${shift.end}`);
          while (currentSlotStart.isBefore(shiftEnd)) {
            const currentSlotEnd = currentSlotStart.add(mainService.duration, 'minutes');
            if (currentSlotEnd.isAfter(shiftEnd)) break;
            appointmentsToCreate.push({
              startTime: currentSlotStart.toDate(), endTime: currentSlotEnd.toDate(),
              employeeId: employee.id, status: AppointmentStatus.AVAILABLE,
            });
            currentSlotStart = currentSlotEnd;
          }
        }
      }
    }
  }
  
  const createdAppointmentsResult = await prisma.appointment.createMany({ data: appointmentsToCreate });
  console.log(`✅ ${createdAppointmentsResult.count} huecos de cita creados.`);

  let allCreatedAppointments = await prisma.appointment.findMany();
  for (const appt of allCreatedAppointments) {
    await prisma.appointmentService.create({ data: { appointmentId: appt.id, serviceId: mainService.id } });
  }

  console.log(`👤 Asignando historial de citas a ${olivierUser.name}...`);
  const pastAppointments = await prisma.appointment.findMany({ where: { status: 'AVAILABLE', startTime: { lt: dayjs().toDate() } }, take: 3, orderBy: { startTime: 'desc' } });
  
  // --- BLOQUE MODIFICADO PARA EVITAR CONFLICTOS ---
  const firstFutureAppointment = await prisma.appointment.findFirst({ where: { status: 'AVAILABLE', startTime: { gt: dayjs().toDate() } }, orderBy: { startTime: 'asc' } });
  let secondFutureAppointment = null;
  if (firstFutureAppointment) {
    secondFutureAppointment = await prisma.appointment.findFirst({
        where: { 
            status: 'AVAILABLE', 
            // Buscamos una cita que empiece DESPUÉS de que termine la primera
            startTime: { gt: firstFutureAppointment.endTime } 
        },
        orderBy: { startTime: 'asc' }
    });
  }

  if(pastAppointments[0]) {
    await prisma.appointment.update({ where: { id: pastAppointments[0].id }, data: { status: 'COMPLETED', userId: olivierUser.id }});
    await prisma.review.create({ data: { appointmentId: pastAppointments[0].id, userId: olivierUser.id, employeeId: pastAppointments[0].employeeId, rating: 5, comment: '¡Servicio impecable como siempre! El mejor sitio para cuidar mi coche.', status: 'APPROVED' }});
  }
  if(pastAppointments[1]) await prisma.appointment.update({ where: { id: pastAppointments[1].id }, data: { status: 'CANCELLED', userId: olivierUser.id }});
  if(pastAppointments[2]) await prisma.appointment.update({ where: { id: pastAppointments[2].id }, data: { status: 'NO_SHOW', userId: olivierUser.id }});
  
  if(firstFutureAppointment) await prisma.appointment.update({ where: { id: firstFutureAppointment.id }, data: { status: 'CONFIRMED', userId: olivierUser.id }});
  if(secondFutureAppointment) await prisma.appointment.update({ where: { id: secondFutureAppointment.id }, data: { status: 'CONFIRMED', userId: olivierUser.id }});
  // --- FIN DEL BLOQUE MODIFICADO ---
  
  console.log('✅ Historial de Olivier creado.');

  console.log('🎭 Simulando reservas aleatorias para el resto de huecos...');
  allCreatedAppointments = await prisma.appointment.findMany();
  for (const appt of allCreatedAppointments) {
    if (appt.status !== 'AVAILABLE') continue;
    const isPast = dayjs(appt.startTime).isBefore(dayjs().startOf('day'));
    let newStatus: AppointmentStatus | null = null;
    
    if (isPast) newStatus = Math.random() < 0.9 ? 'COMPLETED' : 'NO_SHOW';
    else if (Math.random() < 0.5) newStatus = 'CONFIRMED';
    else if (Math.random() < 0.1) newStatus = 'CANCELLED';
    
    if (newStatus) {
      const customerEmail = `cliente.${appt.id}@example.com`;
      const customer = await prisma.user.create({ data: { email: customerEmail, name: `Cliente ${dayjs(appt.startTime).format('HH:mm')}` }});
      await prisma.appointment.update({ where: { id: appt.id }, data: { status: newStatus, userId: customer.id } });
    }
  }
  console.log(`✅ Simulación de relleno completada.`);

  console.log('✨ Creando escenarios de prueba específicos...');
  const juan = await prisma.employee.findUnique({ where: { email: 'juan@aquaclean.com' } });
  if (juan) {
    const nextMonday = dayjs().day(8).startOf('day');
    await prisma.absence.create({
      data: { employeeId: juan.id, startDate: nextMonday.toDate(), endDate: nextMonday.add(2, 'days').endOf('day').toDate(), reason: 'Asuntos personales' }
    });
    console.log('✅ Ausencia programada para Juan la próxima semana.');
  }
  const nextFriday = dayjs().day(5).isBefore(dayjs()) ? dayjs().day(12) : dayjs().day(5);
  await prisma.dateOverride.create({ data: { date: nextFriday.startOf('day').toDate(), reason: 'Festivo Local' } });
  console.log(`✅ Negocio cerrado por festivo el próximo viernes.`);
}

main()
  .catch((e) => { console.error('❌ Error durante el proceso de seeding:', e); process.exit(1); })
  .finally(async () => { console.log('🔚 Proceso de seeding finalizado.'); await prisma.$disconnect(); });