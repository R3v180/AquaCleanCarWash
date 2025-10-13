// File: /apps/server/src/api/adminAppointments.routes.ts (PASANDO NÚMERO DE TELÉFONO)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { Prisma, AppointmentStatus } from '@prisma/client';
import { notificationService } from '../lib/notificationService';

const router = Router();

const createAppointmentAdminSchema = z.object({
  customerName: z.string().min(1), customerEmail: z.string().email(),
  serviceId: z.string().cuid(), employeeId: z.string().cuid(),
  startTime: z.coerce.date(),
});

const updateAppointmentAdminSchema = createAppointmentAdminSchema.partial().extend({
  status: z.nativeEnum(AppointmentStatus).optional(),
});

const updateAppointmentDndSchema = z.object({ start: z.coerce.date(), end: z.coerce.date() });


router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        services: { include: { service: { select: { id: true, name: true } } } },
        employee: { select: { color: true } },
      },
    });

    const events = appointments.map((appointment) => {
      const service = appointment.services[0]?.service;
      const customerName = appointment.user?.name || (appointment.guestName as string | undefined);
      const customerEmail = appointment.user?.email || (appointment.guestEmail as string | undefined);
      const isAvailable = appointment.status === AppointmentStatus.AVAILABLE;
      const title = isAvailable ? 'Disponible' : `${service?.name || 'Servicio'} - ${customerName || 'Cliente'}`;
      const color = isAvailable ? '#40c057' : (appointment.employee?.color || '#868e96');
      return {
        id: appointment.id, title, start: appointment.startTime, end: appointment.endTime,
        resourceId: appointment.employeeId, backgroundColor: color, borderColor: color,
        extendedProps: {
          appointmentId: appointment.id, customerName, customerEmail,
          serviceId: service?.id, employeeId: appointment.employeeId,
          start: appointment.startTime, status: appointment.status,
        }
      };
    });
    res.status(200).json(events);
  } catch (error) { 
    console.error('Error fetching admin appointments:', error);
    res.status(500).json({ message: 'Error interno del servidor.' }); 
  }
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createAppointmentAdminSchema.parse(req.body);
    const service = await prisma.service.findUnique({ where: { id: validatedData.serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado.' });
    const availableSlot = await prisma.appointment.findFirst({
        where: { startTime: validatedData.startTime, employeeId: validatedData.employeeId, status: AppointmentStatus.AVAILABLE }
    });
    if (!availableSlot) return res.status(409).json({ message: 'El hueco ya no está disponible.' });
    const customer = await prisma.user.upsert({
        where: { email: validatedData.customerEmail },
        update: { name: validatedData.customerName },
        create: { email: validatedData.customerEmail, name: validatedData.customerName, role: 'CUSTOMER' },
    });
    const updatedAppointment = await prisma.appointment.update({
        where: { id: availableSlot.id },
        data: { status: AppointmentStatus.CONFIRMED, userId: customer.id }
    });
    res.status(201).json(updatedAppointment);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointmentBeforeUpdate = await prisma.appointment.findUnique({ 
        where: { id },
        include: { user: true } // Incluimos el user para tener acceso a su teléfono
    });

    if (!appointmentBeforeUpdate) {
      return res.status(404).json({ message: 'La cita no fue encontrada.' });
    }

    if (req.body.start && req.body.end) {
      const { start, end } = updateAppointmentDndSchema.parse(req.body);
      const updated = await prisma.appointment.update({ where: { id }, data: { startTime: start, endTime: end } });
      return res.status(200).json(updated);
    }

    const validatedData = updateAppointmentAdminSchema.parse(req.body);
    const { customerName, customerEmail, serviceId, employeeId, startTime, status } = validatedData;
    const updateData: Prisma.AppointmentUpdateInput = {};

    if (startTime) updateData.startTime = startTime;
    if (employeeId) updateData.employee = { connect: { id: employeeId } };
    if (serviceId) updateData.services = { deleteMany: {}, create: { serviceId } };
    if (status) updateData.status = status;
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

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { user: true, employee: true, services: { include: { service: true } } },
    });

    if (
      updatedAppointment.status === AppointmentStatus.COMPLETED &&
      appointmentBeforeUpdate.status !== AppointmentStatus.COMPLETED
    ) {
      console.log(`[+] TRIGGER: La cita ${id} ha cambiado a COMPLETED. Enviando solicitud de valoración.`);
      
      const notificationUser = updatedAppointment.user || {
        name: updatedAppointment.guestName,
        email: updatedAppointment.guestEmail,
      };
      
      // --- LÓGICA CORREGIDA ---
      // Buscamos el teléfono del invitado o del usuario registrado
      // NOTA: El teléfono del usuario registrado no existe aún en el schema. Por ahora, nos basamos en el 'guestPhone'.
      const customerPhone = updatedAppointment.guestPhone; 
      
      if (notificationUser.email && customerPhone) {
        const tempAppointmentDetails = { ...updatedAppointment, user: notificationUser };
        notificationService.sendReviewRequest(tempAppointmentDetails as any, customerPhone);
      } else {
        console.warn(`No se pudo enviar solicitud de valoración para la cita ${id}: falta email o teléfono.`);
      }
    }

    res.status(200).json(updatedAppointment);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });
    console.error(`Error al actualizar la cita:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.AVAILABLE, userId: null, guestName: null, guestEmail: null, guestPhone: null }
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'La cita no fue encontrada.' });
    }
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;