// File: /apps/server/prisma/seed.ts (CORREGIDO CON BUCLE DE CREACIÓN DE EMPLEADOS)

import { PrismaClient, UserRole, EmployeeStatus, AppointmentStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // --- 0. Limpieza Completa ---
  console.log('Cleaning up old data...');
  await prisma.businessSettings.updateMany({ data: { defaultServiceId: null } });
  await prisma.appointmentService.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.dateOverride.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({ where: { role: 'CUSTOMER' } });
  await prisma.service.deleteMany({});
  console.log('Cleanup complete.');

  // --- 1. Seed del Usuario Administrador ---
  await prisma.user.upsert({
    where: { email: 'admin@aquaclean.com' },
    update: {},
    create: {
      email: 'admin@aquaclean.com', name: 'Admin User',
      passwordHash: await hash('password123', 12),
      role: UserRole.ADMIN, emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user seeded.`);
  
  // --- 2. Seed del Servicio por Defecto ---
  const defaultService = await prisma.service.create({
    data: {
      name: 'Servicio Completo de Detallado', duration: 75,
      description: 'El único servicio que lo tiene todo.',
      prices: { standard: 60, suv: 75 }, category: 'Completo', isActive: true,
    },
  });
  console.log(`✅ Seeded 1 default service.`);

  // --- 3. Seed de la Configuración del Negocio ---
  await prisma.businessSettings.upsert({
    where: { singleton: 'SINGLETON' },
    update: { defaultServiceId: defaultService.id },
    create: {
      singleton: 'SINGLETON', defaultServiceId: defaultService.id,
      weeklySchedule: {
        monday: { open: '09:00', close: '19:00' }, tuesday: { open: '09:00', close: '19:00' },
        wednesday: { open: '09:00', close: '19:00' }, thursday: { open: '09:00', close: '19:00' },
        friday: { open: '09:00', close: '19:00' }, saturday: { open: '10:00', close: '14:00' },
        sunday: null,
      },
    },
  });
  console.log('✅ Business settings created/updated.');

  // --- 4. Seed de Empleados con Colores (CORREGIDO) ---
  console.log('Seeding employees...');
  const standardWorkSchedule = {
    monday: [{ start: '09:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
    tuesday: [{ start: '09:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
    wednesday: [{ start: '09:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
    thursday: [{ start: '09:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
    friday: [{ start: '09:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
    saturday: [{ start: '10:00', end: '14:00' }],
  };
  
  const employeesToCreate = [
    { email: 'juan@aquaclean.com', name: 'Juan Empleado', role: UserRole.EMPLOYEE, status: EmployeeStatus.ACTIVE, workSchedule: standardWorkSchedule, color: '#228be6' }, // Azul
    { email: 'maria@aquaclean.com', name: 'Maria Recepcionista', role: UserRole.EMPLOYEE, status: EmployeeStatus.ACTIVE, workSchedule: standardWorkSchedule, color: '#e64980' }, // Rosa
    { email: 'carlos@aquaclean.com', name: 'Carlos Detallista', role: UserRole.EMPLOYEE, status: EmployeeStatus.ACTIVE, workSchedule: standardWorkSchedule, color: '#12b886' }, // Verde
  ];

  for (const employeeData of employeesToCreate) {
    await prisma.employee.create({ data: employeeData });
  }
  console.log(`✅ Seeded ${employeesToCreate.length} employees with colors.`);

  // --- 5. GENERADOR DE INVENTARIO Y CITAS CONFIRMADAS ---
  console.log('Generating appointment inventory...');
  const employees = await prisma.employee.findMany();
  const serviceDuration = defaultService.duration;
  let appointmentsToCreate = [];

  for (const employee of employees) {
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const currentDay = dayjs().add(dayOffset, 'day');
      const dayOfWeek = currentDay.locale('en').format('dddd').toLowerCase();
      const daySchedule = (employee.workSchedule as any)?.[dayOfWeek];

      if (daySchedule) {
        for (const shift of daySchedule) {
          let currentTime = dayjs.utc(`${currentDay.format('YYYY-MM-DD')}T${shift.start}`);
          const shiftEnd = dayjs.utc(`${currentDay.format('YYYY-MM-DD')}T${shift.end}`);
          
          while (currentTime.add(serviceDuration, 'minutes').isSameOrBefore(shiftEnd)) {
            appointmentsToCreate.push({
              startTime: currentTime.toDate(),
              endTime: currentTime.add(serviceDuration, 'minutes').toDate(),
              employeeId: employee.id,
              status: AppointmentStatus.AVAILABLE,
            });
            currentTime = currentTime.add(serviceDuration, 'minutes');
          }
        }
      }
    }
  }

  await prisma.appointment.createMany({ data: appointmentsToCreate });

  const createdAppointments = await prisma.appointment.findMany({ where: { status: AppointmentStatus.AVAILABLE } });
  for (const appt of createdAppointments) {
      await prisma.appointmentService.create({
          data: { appointmentId: appt.id, serviceId: defaultService.id }
      });
  }
  console.log(`✅ Generated ${createdAppointments.length} available appointment slots.`);

  console.log('Converting a portion of appointments to CONFIRMED for demo purposes...');
  let confirmedCount = 0;
  for (const appt of createdAppointments) {
    if (Math.random() < 0.6) {
      const customerEmail = `customer.${dayjs(appt.startTime).unix()}@example.com`;
      const customer = await prisma.user.upsert({
        where: { email: customerEmail },
        update: {},
        create: {
          email: customerEmail,
          name: `Cliente ${dayjs(appt.startTime).format('HH:mm')}`,
          role: UserRole.CUSTOMER,
        },
      });

      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          status: AppointmentStatus.CONFIRMED,
          userId: customer.id,
        },
      });
      confirmedCount++;
    }
  }
  console.log(`✅ Converted ${confirmedCount} appointments to CONFIRMED state.`);
  console.log('Database seed finished successfully.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });