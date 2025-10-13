// File: /apps/server/src/api/push.routes.ts (CORREGIDO)

import { Router, Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

const router = Router();

// --- Middleware de autenticación (similar al de customer.routes) ---
interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole };
}

const authenticateCustomer = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) { return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' }); }
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) { return res.status(500).json({ message: 'Error de configuración del servidor.' }); }

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string; role: UserRole };
    if (payload.role !== UserRole.CUSTOMER) {
      return res.status(403).json({ message: 'Acceso prohibido. Ruta solo para clientes.' });
    }
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token no válido o expirado.' });
  }
};


// --- Endpoints ---

// Endpoint público para obtener la clave VAPID
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error('Error: VAPID_PUBLIC_KEY no está definida en las variables de entorno.');
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }
  res.status(200).json({ publicKey });
});

// Esquema de validación para el objeto de suscripción
const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// Endpoint para guardar una nueva suscripción push
router.post('/subscribe', authenticateCustomer, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = subscriptionSchema.parse(req.body);
    const userId = req.user!.userId;

    await prisma.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId,
      },
    });

    res.status(201).json({ message: 'Suscripción guardada correctamente.' });

  } catch (error: any) { // <-- LÍNEA CORREGIDA
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    // Manejar el caso de que el endpoint ya exista (aunque es poco probable)
    if (error.code === 'P2002') {
        return res.status(200).json({ message: 'La suscripción ya existía.' });
    }
    console.error('Error al guardar la suscripción push:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// (Opcional pero recomendado) Endpoint para eliminar una suscripción
router.post('/unsubscribe', authenticateCustomer, async (req: AuthRequest, res: Response) => {
    try {
        const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
        
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint: endpoint,
                userId: req.user!.userId, // Aseguramos que solo el usuario propietario pueda borrarla
            },
        });

        res.status(200).json({ message: 'Suscripción eliminada correctamente.' });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error('Error al eliminar la suscripción push:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


export default router;