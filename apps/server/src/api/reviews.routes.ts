// File: /apps/server/src/api/reviews.routes.ts (CON RUTAS DE ADMINISTRACIÓN)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Prisma, ReviewStatus } from '@prisma/client';

const router = Router();

// --- ESQUEMAS ---
const createReviewSchema = z.object({
  token: z.string().min(1, 'El token es requerido.'),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

const updateReviewStatusSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

interface ReviewTokenPayload {
  appointmentId: string;
}

// =============================================
// --- RUTA PÚBLICA PARA ENVIAR VALORACIÓN ---
// =============================================
router.post('/', async (req, res) => {
  try {
    const { token, rating, comment } = createReviewSchema.parse(req.body);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'Error de configuración del servidor.' });
    }

    let payload: ReviewTokenPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as ReviewTokenPayload;
    } catch (error) {
      return res.status(401).json({ message: 'El token de valoración no es válido o ha expirado.' });
    }

    const { appointmentId } = payload;
    const targetAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { review: true },
    });

    if (!targetAppointment) {
      return res.status(404).json({ message: 'La cita asociada no fue encontrada.' });
    }
    if (targetAppointment.review) {
      return res.status(409).json({ message: 'Esta cita ya ha sido valorada.' });
    }

    const newReview = await prisma.review.create({
      data: {
        rating, comment, status: ReviewStatus.PENDING,
        appointment: { connect: { id: targetAppointment.id } },
        employee: { connect: { id: targetAppointment.employeeId } },
        ...(targetAppointment.userId && { user: { connect: { id: targetAppointment.userId } } }),
      },
    });

    res.status(201).json(newReview);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    console.error('Error al crear la valoración:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// =======================================================
// --- RUTAS DE ADMINISTRACIÓN PARA MODERAR VALORACIONES ---
// =======================================================

// --- OBTENER TODAS LAS VALORACIONES PARA EL PANEL DE ADMIN ---
router.get('/admin', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                employee: { select: { name: true } },
                appointment: {
                    include: {
                        user: { select: { name: true } },
                        services: { include: { service: { select: { name: true } } } }
                    }
                }
            }
        });

        // Aplanamos los datos para que sean más fáciles de consumir en el frontend
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            status: review.status,
            createdAt: review.createdAt,
            employeeName: review.employee.name,
            customerName: review.appointment.user?.name || review.appointment.guestName,
            serviceName: review.appointment.services[0]?.service.name || 'Servicio Desconocido',
        }));

        res.status(200).json(formattedReviews);
    } catch (error) {
        console.error('Error al obtener las valoraciones para admin:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- ACTUALIZAR EL ESTADO DE UNA VALORACIÓN ---
router.put('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = updateReviewStatusSchema.parse(req.body);

        const updatedReview = await prisma.review.update({
            where: { id },
            data: { status },
        });

        res.status(200).json(updatedReview);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'La valoración no fue encontrada.' });
        }
        console.error('Error al actualizar la valoración:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


export default router;