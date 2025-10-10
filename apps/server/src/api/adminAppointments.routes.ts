// File: /apps/server/src/api/adminAppointments.routes.ts (CORREGIDO Y FUNCIONAL)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma, AppointmentStatus } from '@prisma/client';

const router = Router();

const createAppointmentAdminSchema = z.object({
  customerName: z.string().min(1), customerEmail: z.string().email(),
  serviceId: z.string().cuid(), employeeId: z.string().cuid(),
  startTime: z.coerce.date(),
});
const updateAppointmentAdminSchema = createAppointmentAdminSchema.partial();
const updateAppointmentDndSchema = z.object({ start: z.coerce.date(), end: z.coerce.date() });

// --- RUTA GET CORREGIDA ---
router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        services: { include: { service: { select: { id: true, name: true } } } },
        employee: { select: { color: true } }, // CORRECCIÓN: La sintaxis correcta para seleccionar solo un campo
      },
    });

    const events = appointments.map((appointment) => {
      const service = appointment.services[0]?.service;
      const customer = appointment.user;
      const isAvailable = appointment.status === AppointmentStatus.AVAILABLE;

      const title = isAvailable 
        ? 'Disponible' 
        : `${service?.name || 'Servicio'} - ${customer?.name || 'Cliente'}`;

      const color = isAvailable 
        ? '#40c057' 
        : (appointment.employee?.color || '#868e96');

      return {
        id: appointment.id,
        title: title,
        start: appointment.startTime,
        end: appointment.endTime,
        resourceId: appointment.employeeId,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          appointmentId: appointment.id,
          customerName: customer?.name,
          customerEmail: customer?.email,
          serviceId: service?.id,
          employeeId: appointment.employeeId,
          start: appointment.startTime,
          status: appointment.status,
        }
      };
    });
    res.status(200).json(events);
  } catch (error) { 
    console.error('Error fetching admin appointments:', error);
    res.status(500).json({ message: 'Error interno del servidor.' }); 
  }
});

// --- (El resto de las rutas no cambian y están corregidas) ---
router.post('/', async (req, res) => {
  try {
    const validatedData = createAppointmentAdminSchema.parse(req.body);
    const service = await prisma.service.findUnique({ where: { id: validatedData.serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado.' });
    const endTime = dayjs(validatedData.startTime).add(service.duration, 'minutes').toDate();
    
    // Al crear manualmente, se busca una cita 'AVAILABLE' para sobreescribirla
    const availableSlot = await prisma.appointment.findFirst({
        where: {
            startTime: validatedData.startTime,
            employeeId: validatedData.employeeId,
            status: AppointmentStatus.AVAILABLE,
        }
    });
    
    if (!availableSlot) {
        return res.status(409).json({ message: 'El hueco seleccionado ya no está disponible o no existe.' });
    }

    const customer = await prisma.user.upsert({
        where: { email: validatedData.customerEmail },
        update: { name: validatedData.customerName },
        create: { email: validatedData.customerEmail, name: validatedData.customerName, role: 'CUSTOMER' },
    });

    const updatedAppointment = await prisma.appointment.update({
        where: { id: availableSlot.id },
        data: {
            status: AppointmentStatus.CONFIRMED,
            userId: customer.id,
        }
    });

    res.status(201).json(updatedAppointment);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: 'Datos inválidos.', errors: error.issues });
    console.error('Error creating admin appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

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

// Anular una cita ahora significa volverla al estado AVAILABLE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.AVAILABLE,
        userId: null, // Desvinculamos al cliente
      }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'La cita que intentas anular no fue encontrada.' });
    }
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;