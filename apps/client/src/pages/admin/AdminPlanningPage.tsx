// File: /apps/client/src/pages/admin/AdminPlanningPage.tsx (CÓDIGO CORRECTO FINAL)

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventDropArg } from '@fullcalendar/core'; // Esta línea ahora funcionará
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Alert } from '@mantine/core';
import apiClient from '../../lib/apiClient';

interface Resource {
  id: string;
  title: string;
}

export function AdminPlanningPage() {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchData();
  }, []);

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      const { event } = dropInfo;
      console.log(`Intentando mover cita ${event.id} a ${event.start} - ${event.end}`);

      const updateData = {
        start: event.start,
        end: event.end,
      };

      await apiClient.put(`/admin/appointments/${event.id}`, updateData);

      console.log('¡Cita reagendada con éxito!');

    } catch (err) {
      console.error('Error al reagendar la cita:', err);
      alert('No se pudo guardar el cambio. La cita volverá a su posición original.');
      dropInfo.revert();
    }
  };

  if (error) {
    return (
      <Alert title="Error" color="red" variant="light">
        {error}
      </Alert>
    );
  }

  return (
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
      />
    </div>
  );
}