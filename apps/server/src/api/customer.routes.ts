// File: /apps/server/src/api/customer.routes.ts (CORREGIDO)

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
// --- LÍNEA MODIFICADA ---
import { UserRole, AppointmentStatus, Prisma } from '@prisma/client';

const router = Router();

interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole; };
}

const authenticateCustomer = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

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

router.use(authenticateCustomer);

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
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/appointments/:appointmentId/cancel', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { appointmentId } = req.params;

    try {
        const updatedAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId,
                userId: userId,
            },
            data: {
                status: AppointmentStatus.CANCELLED,
            },
        });

        res.status(200).json({ message: 'Cita cancelada correctamente.', appointment: updatedAppointment });

    } catch (error) {
        // --- BLOQUE CATCH CORREGIDO ---
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'No se encontró la cita o no tienes permiso para cancelarla.' });
        }
        // --- FIN DE LA CORRECCIÓN ---
        console.error('Error al cancelar la cita:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


export default router;