// File: /apps/server/src/server.ts (ACTUALIZADO)

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. IMPORTAMOS NUESTRO NUEVO ENRUTADOR DE SERVICIOS
import servicesRouter from './api/services.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// --- RUTAS DE LA API ---
// 2. LE DECIMOS A LA APP QUE USE EL ENRUTADOR PARA LAS PETICIONES A /api/services
app.use('/api/services', servicesRouter);

// Ruta de prueba para verificar que el servidor funciona
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: '👋 Hello from the AquaClean API!' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});