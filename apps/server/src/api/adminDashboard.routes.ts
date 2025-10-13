// File: /apps/server/src/api/adminDashboard.routes.ts (NUEVO ARCHIVO)

import { Router } from 'express';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { AppointmentStatus, UserRole } from '@prisma/client';

const router = Router();

router.get('/kpis', async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();

    // 1. Citas para Hoy
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        startTime: { gte: todayStart, lte: todayEnd },
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        services: { include: { service: true } },
      },
    });
    const appointmentsTodayCount = appointmentsToday.length;

    // 2. Ingresos Potenciales de Hoy
    const potentialRevenueToday = appointmentsToday.reduce((total, appt) => {
        const servicePrice = appt.services[0]?.service.prices as { standard?: number };
        return total + (servicePrice?.standard || 0);
    }, 0);

    // 3. Nuevos Clientes del Mes
    const newCustomersThisMonth = await prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
        emailVerified: { gte: monthStart, lte: monthEnd }, // Asumiendo que emailVerified es la fecha de creación
      },
    });

    // 4. Tasa de No-Shows del Mes
    const completedAppointmentsThisMonth = await prisma.appointment.count({
        where: {
            startTime: { gte: monthStart, lte: monthEnd },
            status: AppointmentStatus.COMPLETED,
        }
    });
    const noShowAppointmentsThisMonth = await prisma.appointment.count({
        where: {
            startTime: { gte: monthStart, lte: monthEnd },
            status: AppointmentStatus.NO_SHOW,
        }
    });

    const totalFinishedAppointments = completedAppointmentsThisMonth + noShowAppointmentsThisMonth;
    const noShowRate = totalFinishedAppointments > 0 
        ? (noShowAppointmentsThisMonth / totalFinishedAppointments) * 100 
        : 0;

    res.status(200).json({
      appointmentsToday: appointmentsTodayCount,
      potentialRevenueToday: potentialRevenueToday,
      newCustomersThisMonth: newCustomersThisMonth,
      noShowRateThisMonth: noShowRate,
    });

  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;