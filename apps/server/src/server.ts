// File: /apps/server/src/server.ts (CON LOGS DE DIAGNÓSTICO)

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// --- INICIO DEL BLOQUE DE DIAGNÓSTICO ---
console.log('--- [DIAGNÓSTICO] Iniciando el servidor. Comprobando variables de entorno... ---');
const requiredEnvVars = [
  'DATABASE_URL',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ALLOWED_ORIGIN'
];
let hasError = false;
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ FATAL: La variable de entorno requerida "${varName}" no está definida.`);
    hasError = true;
  } else {
    // No mostramos el valor completo de secretos por seguridad, solo una confirmación
    const value = ['DATABASE_URL', 'JWT_SECRET'].includes(varName)
      ? '****** (definida)'
      : process.env[varName];
    console.log(`✅ ${varName}: ${value}`);
  }
}
if (hasError) {
  console.error('--- [DIAGNÓSTICO] Faltan variables de entorno críticas. El servidor no puede continuar. ---');
  process.exit(1); // Forzamos la salida si falta algo esencial
}
console.log('--- [DIAGNÓSTICO] Todas las variables de entorno requeridas están presentes. ---');
// --- FIN DEL BLOQUE DE DIAGNÓSTICO ---


import servicesRouter from './api/services.routes';
import employeesRouter from './api/employees.routes';
import authRouter from './api/auth.routes';
import availabilityRouter from './api/availability.routes';
import bookingsRouter from './api/bookings.routes';
import adminAppointmentsRouter from './api/adminAppointments.routes';
import adminSettingsRouter from './api/adminSettings.routes';
import adminDateOverridesRouter from './api/adminDateOverrides.routes';
import customerAuthRouter from './api/customerAuth.routes';
import reviewsRouter from './api/reviews.routes';
import adminDashboardRouter from './api/adminDashboard.routes';
import { reminderService } from './lib/cronService';
import customerRouter from './api/customer.routes';
import pushRouter from './api/push.routes';

dotenv.config();

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to the database successfully');
  } catch (error) {
    console.error('❌ Prisma failed to connect to the database:', error);
    process.exit(1);
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGIN,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/services', servicesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/customer', customerAuthRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/push', pushRouter);
app.use('/api/me', customerRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/appointments', adminAppointmentsRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/admin/overrides', adminDateOverridesRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: '👋 Hello from the AquaClean API!' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is running and listening on port ${PORT}`);
  reminderService.start();
});