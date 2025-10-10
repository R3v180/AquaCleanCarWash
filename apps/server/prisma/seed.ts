// File: /apps/server/prisma/seed.ts (CORREGIDO CON LIMPIEZA DE EMPLEADOS)

import { PrismaClient, UserRole, EmployeeStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // --- 0. Limpieza Previa de Datos Relacionados ---
  console.log('Cleaning up old data...');
  await prisma.businessSettings.updateMany({
    data: { defaultServiceId: null },
  });
  await prisma.appointmentService.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.dateOverride.deleteMany({});
  await prisma.appointment.deleteMany({});

  // --- PASO DE LIMPIEZA AÑADIDO ---
  // Esto soluciona el bug del empleado duplicado
  await prisma.employee.deleteMany({});
  console.log('Previous employees deleted.');
  // --- FIN DEL PASO AÑADIDO ---

  // --- 1. Seed del Usuario Administrador ---
  const adminEmail = 'admin@aquaclean.com';
  const adminPassword = 'password123';
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminUser) {
    const hashedPassword = await hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Admin user created successfully: ${adminEmail}`);
  } else {
    console.log('Admin user already exists. Skipping creation.');
  }

  // --- 2. Seed de Empleados de Prueba ---
  console.log('Seeding employees...');
  await prisma.employee.createMany({
    data: [
      {
        email: 'juan@aquaclean.com',
        name: 'Juan Empleado',
        role: UserRole.EMPLOYEE,
        status: EmployeeStatus.ACTIVE,
        workSchedule: {
          monday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
          saturday: [{ start: '10:00', end: '14:00' }],
        },
      },
      {
        email: 'maria@aquaclean.com',
        name: 'Maria Recepcionista',
        role: UserRole.EMPLOYEE,
        status: EmployeeStatus.ACTIVE,
        workSchedule: {
          monday: [{ start: '09:00', end: '14:00' }],
          tuesday: [{ start: '09:00', end: '14:00' }],
          wednesday: [{ start: '09:00', end: '14:00' }],
          thursday: [{ start: '09:00', end: '14:00' }],
          friday: [{ start: '09:00', end: '14:00' }],
        },
      },
      {
        email: 'carlos@aquaclean.com',
        name: 'Carlos Detallista',
        role: UserRole.EMPLOYEE,
        status: EmployeeStatus.ACTIVE,
        workSchedule: {
          monday: [{ start: '13:00', end: '19:00' }],
          tuesday: [{ start: '13:00', end: '19:00' }],
          wednesday: [{ start: '13:00', end: '19:00' }],
          thursday: [{ start: '13:00', end: '19:00' }],
          friday: [{ start: '13:00', end: '19:00' }],
        },
      }
    ]
  });
  console.log(`✅ Seeded 3 employees.`);

  // --- 3. Seed del Servicio por Defecto ---
  console.log('Seeding default service...');
  await prisma.service.deleteMany({});
  
  const defaultService = await prisma.service.create({
    data: {
      name: 'Servicio Completo de Detallado',
      description: 'El único servicio que lo tiene todo. Limpieza exterior e interior profunda para dejar tu vehículo como el primer día.',
      duration: 75,
      prices: { standard: 60, suv: 75 },
      category: 'Completo',
      isActive: true,
    },
  });
  console.log(`✅ Seeded 1 default service: "${defaultService.name}"`);

  // --- 4. Seed de la Configuración del Negocio ---
  await prisma.businessSettings.upsert({
    where: { singleton: 'SINGLETON' },
    update: {
      defaultServiceId: defaultService.id,
      weeklySchedule: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '10:00', close: '14:00' },
          sunday: null,
      },
    },
    create: {
      singleton: 'SINGLETON',
      defaultServiceId: defaultService.id,
      weeklySchedule: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '10:00', close: '14:00' },
          sunday: null,
      },
    },
  });
  console.log('✅ Business settings created/updated and linked to default service.');

  console.log('Database seed finished.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });