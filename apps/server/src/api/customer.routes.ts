// File: /apps/server/src/api/customer.routes.ts (CON GESTIÓN DE PERFIL)

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod'; // Zod importado
import { hash, compare } from 'bcryptjs'; // bcryptjs importado
import prisma from '../lib/prisma';
import { UserRole, AppointmentStatus, Prisma } from '@prisma/client';

const router = Router();

// --- ESQUEMAS DE VALIDACIÓN AÑADIDOS ---
const updateProfileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida.'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
});

// --- MIDDLEWARE DE AUTENTICACIÓN (SIN CAMBIOS) ---
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

// --- RUTAS DE CITAS (SIN CAMBIOS) ---
router.get('/appointments', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: userId },
      orderBy: { startTime: 'desc' },
      include: {
        services: { include: { service: { select: { name: true, duration: true, id: true } } } }, // id añadido
        employee: { select: { name: true, id: true } }, // id añadido
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
            where: { id: appointmentId, userId: userId },
            data: { status: AppointmentStatus.CANCELLED },
        });
        res.status(200).json({ message: 'Cita cancelada correctamente.', appointment: updatedAppointment });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'No se encontró la cita o no tienes permiso para cancelarla.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- NUEVAS RUTAS DE GESTIÓN DE PERFIL ---

// Actualizar datos del perfil (nombre)
router.put('/profile', async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    try {
        const { name } = updateProfileSchema.parse(req.body);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name },
            select: { id: true, name: true, email: true }, // Devuelve solo datos seguros
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Cambiar la contraseña
router.post('/change-password', async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.passwordHash) {
            return res.status(403).json({ message: 'Acción no permitida para este tipo de cuenta.' });
        }

        const isPasswordValid = await compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(403).json({ message: 'La contraseña actual es incorrecta.' });
        }

        const newPasswordHash = await hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


export default router;