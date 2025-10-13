// ====== [72] apps/server/src/server.ts ======
// File: /apps/server/src/server.ts (CON CONFIGURACIÓN DE CORS FLEXIBLE PARA DESARROLLO)

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ... (todas las demás importaciones no cambian)
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

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURACIÓN DE CORS ACTUALIZADA ---
const allowedOrigins = [
  'http://localhost:5173', // Origen antiguo para http
  process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173', // Origen del .env (que puede ser http o https)
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Si el origen de la petición está en nuestra lista de permitidos (o no hay origen, como en las peticiones de servidor a servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`El origen ${origin} no está permitido por CORS.`));
    }
  },
};

app.use(cors(corsOptions));
// --- FIN DE LA ACTUALIZACIÓN DE CORS ---

app.use(express.json());

// --- RUTAS DE LA API (sin cambios) ---
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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  reminderService.start();
});
