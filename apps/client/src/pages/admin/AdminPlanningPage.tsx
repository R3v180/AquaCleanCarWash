// ====== [27] apps/client/src/pages/admin/AdminPlanningPage.tsx ======
// File: /apps/client/src/pages/admin/AdminPlanningPage.tsx (CORRECCIÓN FINAL DE ZONA HORARIA)

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventDropArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Alert, Modal, LoadingOverlay, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import apiClient from '../../lib/apiClient';
import { AppointmentForm } from '../../components/admin/AppointmentForm';

interface BusinessHour {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}
interface Resource {
  id: string;
  title: string;
  businessHours?: BusinessHour[];
}
interface ViewConfig {
  minTime: string;
  maxTime: string;
}
const dayMapping: { [key: string]: number } = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export function AdminPlanningPage() {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [modalData, setModalData] = useState<any>(null);
  const [viewConfig, setViewConfig] = useState<ViewConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsResponse, employeesResponse] = await Promise.all([
        apiClient.get('/admin/appointments'),
        apiClient.get('/employees'),
      ]);

      setEvents(appointmentsResponse.data);

      let minTime = '24:00';
      let maxTime = '00:00';

      const employeeResources = employeesResponse.data.map((emp: any) => {
        const businessHours: BusinessHour[] = [];
        if (emp.workSchedule) {
          for (const day in emp.workSchedule) {
            const shifts = emp.workSchedule[day];
            if (shifts && shifts.length > 0) {
              shifts.forEach((shift: { start: string, end: string }) => {
                if (dayMapping[day] !== undefined) {
                  businessHours.push({
                    daysOfWeek: [dayMapping[day]],
                    startTime: shift.start,
                    endTime: shift.end,
                  });
                }
                if (shift.start < minTime) minTime = shift.start;
                if (shift.end > maxTime) maxTime = shift.end;
              });
            }
          }
        }
        return { id: emp.id, title: emp.name, businessHours };
      });
      
      setResources(employeeResources);
      setViewConfig({
          minTime: minTime === '24:00' ? '08:00' : minTime,
          maxTime: maxTime === '00:00' ? '20:00' : maxTime
      });

    } catch (err) {
      console.error('Error fetching data for planning:', err);
      setError('No se pudieron cargar los datos del planning.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      const { event, newResource } = dropInfo;
      const newEmployeeId = newResource ? newResource.id : event._def.resourceIds?.[0];
      
      const updateData = {
        start: event.start,
        end: event.end,
        employeeId: newEmployeeId
      };

      await apiClient.put(`/admin/appointments/${event.id}`, updateData);
      fetchData();
    } catch (err) {
      console.error('Error al reagendar la cita:', err);
      dropInfo.revert();
    }
  };

  const handleDateClick = (arg: any) => {
    setModalData({ type: 'new', start: arg.date, employeeId: arg.resource?.id });
    open();
  };
  
  const handleEventClick = (arg: EventClickArg) => {
    setModalData({ type: 'edit', ...arg.event.extendedProps });
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
        <AppointmentForm initialData={modalData} onSuccess={handleFormSuccess} onClose={close} />
      </Modal>

      <Box style={{ height: 'calc(100vh - 60px - 32px)', position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        {!loading && viewConfig && (
          <FullCalendar
            plugins={[resourceTimeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="resourceTimeGridDay"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth',
            }}
            locale="es"
            editable={true}
            events={events}
            resources={resources}
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            height="100%"
            eventDrop={handleEventDrop}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            // --- LÍNEA ELIMINADA ---
            // timeZone="UTC" // <-- ¡ESTA ES LA LÍNEA QUE CAUSABA EL PROBLEMA!
            slotMinTime={viewConfig.minTime}
            slotMaxTime={viewConfig.maxTime}
            businessHours={true}
            allDaySlot={false}
          />
        )}
      </Box>
    </>
  );
}