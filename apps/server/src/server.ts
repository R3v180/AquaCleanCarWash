// File: /apps/server/src/server.ts (ACTUALIZADO)

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importamos nuestros enrutadores
import servicesRouter from './api/services.routes';
import employeesRouter from './api/employees.routes';
import authRouter from './api/auth.routes';
import availabilityRouter from './api/availability.routes';
import bookingsRouter from './api/bookings.routes';
import adminAppointmentsRouter from './api/adminAppointments.routes'; // <-- LÍNEA AÑADIDA

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors({ origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// --- RUTAS DE LA API ---

// Rutas Públicas y de Clientes
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);

// Rutas Específicas del Panel de Administración
app.use('/api/admin/appointments', adminAppointmentsRouter); // <-- LÍNEA AÑADIDA


// Ruta de prueba para verificar que el servidor funciona
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: '👋 Hello from the AquaClean API!' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});