// File: /apps/server/src/server.ts - v1.0

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Ruta de prueba para verificar que el servidor funciona
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: '👋 Hello from the AquaClean API!' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});