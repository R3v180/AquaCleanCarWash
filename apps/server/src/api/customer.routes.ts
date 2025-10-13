// File: /apps/server/src/api/customer.routes.ts (NUEVO ARCHIVO)

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

const router = Router();

// --- INTERFAZ PARA AÑADIR DATOS A LA PETICIÓN DE EXPRESS ---
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

// --- MIDDLEWARE DE AUTENTICACIÓN PARA CLIENTES ---
const authenticateCustomer = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string; role: UserRole };

    // Verificamos que el token corresponde a un cliente
    if (payload.role !== UserRole.CUSTOMER) {
        return res.status(403).json({ message: 'Acceso prohibido. Ruta solo para clientes.' });
    }
    
    req.user = payload; // Adjuntamos el payload del token a la petición
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token no válido o expirado.' });
  }
};

// --- TODAS LAS RUTAS EN ESTE ARCHIVO ESTARÁN PROTEGIDAS ---
router.use(authenticateCustomer);


// --- ENDPOINT PARA OBTENER LAS CITAS DEL CLIENTE LOGUEADO ---
router.get('/appointments', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: userId },
      orderBy: { startTime: 'desc' },
      include: {
        services: { include: { service: { select: { name: true, duration: true } } } },
        employee: { select: { name: true } },
      },
    });

    res.status(200).json(appointments);

  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


export default router;