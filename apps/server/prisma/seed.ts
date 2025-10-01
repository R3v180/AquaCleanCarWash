import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const adminEmail = 'admin@aquaclean.com';
  const adminPassword = 'password123'; // ¡Recuerda no usar esta contraseña en producción!

  // Buscamos si el usuario administrador ya existe para no crearlo dos veces
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  // Si no existe, lo creamos
  if (!adminUser) {
    const hashedPassword = await hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(), // Lo marcamos como verificado para poder hacer login
      },
    });
    console.log(`✅ Admin user created successfully with email: ${adminEmail}`);
  } else {
    console.log('Admin user already exists. Skipping creation.');
  }

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