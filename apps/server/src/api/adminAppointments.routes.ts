// File: /apps/server/src/api/adminAppointments.routes.ts (CORREGIDO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

// --- ESQUEMAS ---
const createAppointmentAdminSchema = z.object({
  customerName: z.string().min(1), customerEmail: z.string().email(),
  serviceId: z.string().cuid(), employeeId: z.string().cuid(),
  startTime: z.coerce.date(),
});
const updateAppointmentAdminSchema = createAppointmentAdminSchema.partial();
const updateAppointmentDndSchema = z.object({ start: z.coerce.date(), end: z.coerce.date() });

// --- OBTENER TODAS LAS CITAS ---
router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        services: { include: { service: { select: { id: true, name: true } } } },
      },
    });
    const events = appointments.map((appointment) => {
      const service = appointment.services[0]?.service;
      const customer = appointment.user;
      return {
        id: appointment.id, title: `${service?.name || 'Servicio'} - ${customer?.name || 'Cliente'}`,
        start: appointment.startTime, end: appointment.endTime, resourceId: appointment.employeeId,
        extendedProps: {
          appointmentId: appointment.id, customerName: customer?.name, customerEmail: customer?.email,
          serviceId: service?.id, employeeId: appointment.employeeId, start: appointment.startTime,
        }
      };
    });
    res.status(200).json(events);
  } catch (error) { res.status(500).json({ message: 'Error interno del servidor.' }); }
});

// --- CREAR CITA ---
router.post('/', async (req, res) => {
  try {
    const validatedData = createAppointmentAdminSchema.parse(req.body);
    const service = await prisma.service.findUnique({ where: { id: validatedData.serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado.' });
    const endTime = dayjs(validatedData.startTime).add(service.duration, 'minutes').toDate();
    const newAppointment = await prisma.appointment.create({
      data: {
        startTime: validatedData.startTime, endTime, status: 'CONFIRMED',
        employee: { connect: { id: validatedData.employeeId } },
        services: { create: { service: { connect: { id: validatedData.serviceId } } } },
        user: {
          connectOrCreate: {
            where: { email: validatedData.customerEmail },
            create: { email: validatedData.customerEmail, name: validatedData.customerName, role: 'CUSTOMER' },
          },
        },
      },
    });
    res.status(201).json(newAppointment);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ACTUALIZAR CITA ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.start && req.body.end) {
      const { start, end } = updateAppointmentDndSchema.parse(req.body);
      const updated = await prisma.appointment.update({ where: { id }, data: { startTime: start, endTime: end } });
      return res.status(200).json(updated);
    }
    const validatedData = updateAppointmentAdminSchema.parse(req.body);
    const { customerName, customerEmail, serviceId, employeeId, startTime } = validatedData;
    const updateData: Prisma.AppointmentUpdateInput = {};
    if (startTime) updateData.startTime = startTime;
    if (employeeId) updateData.employee = { connect: { id: employeeId } };
    if (serviceId) updateData.services = { deleteMany: {}, create: { serviceId } };
    if (customerEmail && customerName) {
      updateData.user = { connectOrCreate: { where: { email: customerEmail }, create: { email: customerEmail, name: customerName, role: 'CUSTOMER' } } };
    }
    if (startTime || serviceId) {
        const currentAppointment = await prisma.appointment.findUnique({ where: { id }, include: { services: true } });
        const finalServiceId = serviceId || currentAppointment?.services[0]?.serviceId;
        const finalStartTime = startTime || currentAppointment?.startTime;
        if(finalServiceId && finalStartTime) {
            const service = await prisma.service.findUnique({ where: { id: finalServiceId } });
            if (service) updateData.endTime = dayjs(finalStartTime).add(service.duration, 'minutes').toDate();
        }
    }
    const updatedAppointment = await prisma.appointment.update({ where: { id }, data: updateData });
    res.status(200).json(updatedAppointment);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ message: 'La cita no fue encontrada.' });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- ANULAR/ELIMINAR UNA CITA (CORREGIDO) ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Usamos una transacción para asegurar que ambas operaciones se completen
    await prisma.$transaction([
      // 1. Borramos los registros de la tabla intermedia
      prisma.appointmentService.deleteMany({
        where: { appointmentId: id },
      }),
      // 2. Borramos la cita principal
      prisma.appointment.delete({
        where: { id },
      }),
    ]);
    
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'La cita que intentas eliminar no fue encontrada.' });
    }
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;