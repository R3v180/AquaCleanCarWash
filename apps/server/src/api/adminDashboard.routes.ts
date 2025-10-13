// File: /apps/server/src/api/adminDashboard.routes.ts (CON ENDPOINT PARA GRÁFICO)

import { Router } from 'express';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { AppointmentStatus, UserRole } from '@prisma/client';

const router = Router();

// --- ENDPOINT DE KPIs (sin cambios) ---
router.get('/kpis', async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();

    const appointmentsToday = await prisma.appointment.findMany({
      where: { startTime: { gte: todayStart, lte: todayEnd }, status: AppointmentStatus.CONFIRMED },
      include: { services: { include: { service: true } } },
    });
    const appointmentsTodayCount = appointmentsToday.length;

    const potentialRevenueToday = appointmentsToday.reduce((total, appt) => {
        const servicePrice = appt.services[0]?.service.prices as { standard?: number };
        return total + (servicePrice?.standard || 0);
    }, 0);

    const newCustomersThisMonth = await prisma.user.count({
      where: { role: UserRole.CUSTOMER, emailVerified: { gte: monthStart, lte: monthEnd } },
    });

    const completedAppointmentsThisMonth = await prisma.appointment.count({
        where: { startTime: { gte: monthStart, lte: monthEnd }, status: AppointmentStatus.COMPLETED }
    });
    const noShowAppointmentsThisMonth = await prisma.appointment.count({
        where: { startTime: { gte: monthStart, lte: monthEnd }, status: AppointmentStatus.NO_SHOW }
    });
    const totalFinishedAppointments = completedAppointmentsThisMonth + noShowAppointmentsThisMonth;
    const noShowRate = totalFinishedAppointments > 0 ? (noShowAppointmentsThisMonth / totalFinishedAppointments) * 100 : 0;

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


// --- NUEVO ENDPOINT PARA EL GRÁFICO ---
router.get('/charts/bookings-over-time', async (req, res) => {
    try {
        const today = dayjs().endOf('day');
        const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day');

        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: sevenDaysAgo.toDate(),
                    lte: today.toDate(),
                },
                status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
            },
            select: {
                startTime: true,
            },
        });

        // Agrupamos las citas por día
        const countsByDay = new Map<string, number>();
        for (const appt of appointments) {
            const date = dayjs(appt.startTime).format('YYYY-MM-DD');
            countsByDay.set(date, (countsByDay.get(date) || 0) + 1);
        }

        // Creamos el array de datos final, rellenando con 0 los días sin citas
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const day = sevenDaysAgo.add(i, 'day');
            const dateKey = day.format('YYYY-MM-DD');
            const formattedDate = day.format('DD/MM');
            
            chartData.push({
                date: formattedDate,
                Citas: countsByDay.get(dateKey) || 0,
            });
        }

        res.status(200).json(chartData);

    } catch (error) {
        console.error('Error fetching bookings over time data:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


export default router;