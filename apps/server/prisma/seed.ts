// File: /apps/server/prisma/seed.ts (CORREGIDO)

import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

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

  // --- 2. Seed de la Configuración del Negocio ---
  const businessSettings = await prisma.businessSettings.findUnique({ where: { singleton: 'SINGLETON' } });
  const defaultWeeklySchedule = {
    monday: { open: '09:00', close: '19:00' },
    tuesday: { open: '09:00', close: '19:00' },
    wednesday: { open: '09:00', close: '19:00' },
    thursday: { open: '09:00', close: '19:00' },
    friday: { open: '09:00', close: '19:00' },
    saturday: { open: '10:00', close: '14:00' },
    sunday: null,
  };

  if (!businessSettings) {
    await prisma.businessSettings.create({
      data: {
        singleton: 'SINGLETON',
        weeklySchedule: defaultWeeklySchedule,
      },
    });
    console.log('✅ Default business settings created.');
  } else {
    await prisma.businessSettings.update({
      where: { singleton: 'SINGLETON' },
      data: { weeklySchedule: defaultWeeklySchedule },
    });
    console.log('✅ Business settings updated to default values.');
  }

  // --- 3. Seed del Empleado de Prueba ---
  const employeeEmail = 'employee@aquaclean.com';
  const testEmployee = await prisma.employee.findUnique({ where: { email: employeeEmail } });
  const employeeWorkSchedule = {
    monday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }],
    saturday: [{ start: '10:00', end: '14:00' }],
  };

  if (!testEmployee) {
    await prisma.employee.create({
      data: {
        email: employeeEmail,
        name: 'Juan Empleado',
        role: UserRole.EMPLOYEE,
        workSchedule: employeeWorkSchedule,
      },
    });
    console.log(`✅ Test employee created successfully: ${employeeEmail}`);
  } else {
    await prisma.employee.update({
        where: { email: employeeEmail },
        data: { workSchedule: employeeWorkSchedule }
    });
    console.log('✅ Test employee updated with default work schedule.');
  }

  // --- 4. SEED DE SERVICIOS (LA PARTE QUE FALTABA) ---
  console.log('Seeding services...');
  // Para asegurar un estado limpio, borramos los servicios existentes antes de crearlos
  await prisma.service.deleteMany({});
  
  const servicesToCreate = [
    {
      name: 'Lavado Básico Exterior',
      description: 'Un lavado exterior rápido y eficiente para dejar tu coche reluciente. Incluye prelavado, lavado a mano con champú pH neutro y secado con microfibra.',
      duration: 30,
      prices: { standard: 20 },
      category: 'Lavado Exterior',
    },
    {
      name: 'Lavado Premium Completo',
      description: 'El tratamiento completo. Incluye lavado exterior, aspirado interior, limpieza de cristales y salpicadero.',
      duration: 60,
      prices: { standard: 45, suv: 55 },
      category: 'Completo',
    },
    {
      name: 'Limpieza Interior Profunda',
      description: 'Dejamos el interior de tu coche como nuevo. Aspirado profundo, limpieza de tapicería (tela o cuero), paneles de puerta y consola central.',
      duration: 90,
      prices: { standard: 70 },
      category: 'Detallado Interior',
    },
  ];

  await prisma.service.createMany({
    data: servicesToCreate,
  });
  console.log(`✅ Seeded ${servicesToCreate.length} services.`);
  // --- FIN DE LA SECCIÓN AÑADIDA ---

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