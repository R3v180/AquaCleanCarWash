// File: /apps/server/src/server.ts (CONECTANDO RUTAS DEL PANEL DE CLIENTE)

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importamos nuestros enrutadores
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

// --- IMPORTACIÓN AÑADIDA ---
import customerRouter from './api/customer.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors({ origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// --- RUTAS DE LA API ---

// Rutas Públicas y de Autenticación de Cliente
app.use('/api/services', servicesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/customer', customerAuthRouter);
app.use('/api/reviews', reviewsRouter);

// Rutas Protegidas específicas del Cliente Logueado
app.use('/api/me', customerRouter); // <-- RUTA AÑADIDA

// Ruta de Autenticación Admin
app.use('/api/auth', authRouter);

// Rutas Específicas del Panel de Administración
app.use('/api/admin/appointments', adminAppointmentsRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/admin/overrides', adminDateOverridesRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);

// Ruta de prueba
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: '👋 Hello from the AquaClean API!' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  reminderService.start();
});