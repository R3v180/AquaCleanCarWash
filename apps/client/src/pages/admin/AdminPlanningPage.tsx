// File: /apps/client/src/pages/admin/AdminPlanningPage.tsx (ACTUALIZADO)

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventDropArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Alert, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import apiClient from '../../lib/apiClient';
import { AppointmentForm } from '../../components/admin/AppointmentForm';

interface Resource {
  id: string;
  title: string;
}

export function AdminPlanningPage() {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [modalData, setModalData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [appointmentsResponse, employeesResponse] = await Promise.all([
        apiClient.get('/admin/appointments'),
        apiClient.get('/employees'),
      ]);

      setEvents(appointmentsResponse.data);

      const employeeResources = employeesResponse.data.map((emp: { id: string; name: string }) => ({
        id: emp.id,
        title: emp.name,
      }));
      setResources(employeeResources);
    } catch (err) {
      console.error('Error fetching data for planning:', err);
      setError('No se pudieron cargar los datos del planning. Inténtalo de nuevo más tarde.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      const { event } = dropInfo;
      const updateData = { start: event.start, end: event.end };
      await apiClient.put(`/admin/appointments/${event.id}`, updateData);
    } catch (err) {
      console.error('Error al reagendar la cita:', err);
      dropInfo.revert();
    }
  };

  const handleDateClick = (arg: any) => {
    setModalData({ type: 'new', start: arg.date, employeeId: arg.resource?.id });
    open();
  };

  // --- LÓGICA CORREGIDA ---
  // Ahora, arg.event.extendedProps viene lleno de datos desde nuestra API mejorada.
  // Al hacer spread (...), pasamos todos esos datos al modal.
  const handleEventClick = (arg: EventClickArg) => {
    setModalData({
      type: 'edit',
      ...arg.event.extendedProps,
    });
    open();
  };
  
  const handleFormSuccess = () => {
    close();
    fetchData();
  };

  if (error) {
    return <Alert title="Error" color="red" variant="light">{error}</Alert>;
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title={modalData?.type === 'new' ? 'Crear Nueva Cita' : 'Editar Cita'} centered>
        <AppointmentForm
          initialData={modalData}
          onSuccess={handleFormSuccess}
          onClose={close}
        />
      </Modal>

      <div style={{ height: 'calc(100vh - 60px - 32px)' }}>
        <FullCalendar
          plugins={[resourceTimelinePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="resourceTimelineWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,dayGridMonth',
          }}
          locale="es"
          editable={true}
          events={events}
          resources={resources}
          resourceAreaHeaderContent="Empleados"
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          slotMinWidth={50}
          height="100%"
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
        />
      </div>
    </>
  );
}