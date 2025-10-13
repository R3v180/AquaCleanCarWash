// File: /apps/client/src/pages/customer/CustomerAppointmentsPage.tsx (CON LÓGICA "RESERVAR DE NUEVO")

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTACIÓN AÑADIDA
import { Title, Text, Tabs, Stack, Card, Group, Badge, Button, LoadingOverlay, Alert, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import apiClient from '../../lib/apiClient';

dayjs.locale('es');

// --- INTERFACES ACTUALIZADAS ---
interface AppointmentService {
  service: { 
    id: string; // ID añadido
    name: string; 
    duration: number;
  };
}
interface Appointment {
  id: string;
  startTime: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  services: AppointmentService[];
  employee: { 
    id: string; // ID añadido
    name: string;
  };
}
// --- FIN DE LA ACTUALIZACIÓN DE INTERFACES ---

const statusConfig = {
    CONFIRMED: { label: 'Confirmada', color: 'blue' },
    COMPLETED: { label: 'Completada', color: 'green' },
    CANCELLED: { label: 'Cancelada', color: 'gray' },
    NO_SHOW: { label: 'No Presentado', color: 'orange' },
};

// --- COMPONENTE AppointmentCard MODIFICADO ---
function AppointmentCard({ appointment, onCancel, onBookAgain }: { 
  appointment: Appointment; 
  onCancel: (id: string) => void;
  onBookAgain: (appointment: Appointment) => void; // Prop añadida
}) {
    const config = statusConfig[appointment.status] || { label: 'Desconocido', color: 'gray' };
    const service = appointment.services[0]?.service;
    const isPast = dayjs(appointment.startTime).isBefore(dayjs());

    return (
        <Card withBorder radius="md">
            <Group justify="space-between">
                <Stack gap="xs">
                    <Text fw={500}>{service?.name || 'Servicio'}</Text>
                    <Text size="sm" c="dimmed">{dayjs(appointment.startTime).format('dddd, D [de] MMMM [de] YYYY')}</Text>
                    <Text size="sm" c="dimmed">Hora: {dayjs(appointment.startTime).format('HH:mm')}h</Text>
                </Stack>
                <Badge color={config.color} variant="light">{config.label}</Badge>
            </Group>
            <Group justify="flex-end" mt="md">
                {appointment.status === 'CONFIRMED' && !isPast && (
                    <Button variant="outline" color="red" size="xs" onClick={() => onCancel(appointment.id)}>
                        Cancelar Cita
                    </Button>
                )}
                {appointment.status === 'COMPLETED' && (
                    <Button 
                      variant="light" 
                      size="xs" 
                      onClick={() => onBookAgain(appointment)} // onClick añadido
                    >
                      Reservar de Nuevo
                    </Button>
                )}
            </Group>
        </Card>
    );
}


export function CustomerAppointmentsPage() {
  const navigate = useNavigate(); // <-- HOOK AÑADIDO
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCancelModal = (id: string) => {
    setAppointmentToCancel(id);
    openModal();
  };

  // --- FUNCIÓN AÑADIDA ---
  const handleBookAgain = (appointment: Appointment) => {
    const service = appointment.services[0]?.service;
    const employee = appointment.employee;

    if (service?.id && employee?.id) {
        // Navegamos a la página de reserva pasando los IDs como parámetros
        navigate(`/booking?serviceId=${service.id}&employeeId=${employee.id}`);
    } else {
        // Si por alguna razón faltan datos, notificamos y llevamos a la página de reserva normal
        notifications.show({
            title: 'Faltan datos',
            message: 'Redirigiendo a la página de reserva general.',
            color: 'orange',
        });
        navigate('/booking');
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post(`/me/appointments/${appointmentToCancel}/cancel`);
      setAppointments(currentAppointments =>
        currentAppointments.map(appt =>
          appt.id === appointmentToCancel ? { ...appt, status: 'CANCELLED' } : appt
        )
      );
      notifications.show({
        title: 'Cita Cancelada', message: 'Tu cita ha sido cancelada correctamente.', color: 'orange',
      });
      closeModal();
    } catch (err: any) {
      notifications.show({
        title: 'Error', message: err.response?.data?.message || 'No se pudo cancelar la cita.', color: 'red',
      });
    } finally {
      setIsSubmitting(false);
      setAppointmentToCancel(null);
    }
  };


  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await apiClient.get<Appointment[]>('/me/appointments');
        setAppointments(response.data);
      } catch (err) { setError('No se pudieron cargar tus citas.'); }
      finally { setLoading(false); }
    };
    fetchAppointments();
  }, []);

  const now = dayjs();
  const upcomingAppointments = appointments.filter(
    (appt) => appt.status === 'CONFIRMED' && dayjs(appt.startTime).isAfter(now)
  );
  const pastAppointments = appointments.filter(
    (appt) => appt.status !== 'CONFIRMED' || dayjs(appt.startTime).isBefore(now)
  );

  return (
    <>
      <Modal opened={modalOpened} onClose={() => !isSubmitting && closeModal()} title="Confirmar Cancelación" centered>
        <Text>¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeModal} disabled={isSubmitting}>No, mantener cita</Button>
          <Button color="red" onClick={handleConfirmCancel} loading={isSubmitting}>Sí, cancelar</Button>
        </Group>
      </Modal>

      <div>
        <Title order={2} mb="xl">Mis Citas</Title>
        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} />
          {error && <Alert color="red" title="Error">{error}</Alert>}
          {!loading && !error && (
            <Tabs defaultValue="upcoming">
              <Tabs.List>
                <Tabs.Tab value="upcoming">Próximas Citas ({upcomingAppointments.length})</Tabs.Tab>
                <Tabs.Tab value="history">Historial ({pastAppointments.length})</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="upcoming" pt="lg">
                <Stack>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} onCancel={openCancelModal} onBookAgain={handleBookAgain} />)
                  ) : (<Text c="dimmed">No tienes ninguna cita programada.</Text>)}
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="history" pt="lg">
                <Stack>
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} onCancel={openCancelModal} onBookAgain={handleBookAgain} />)
                  ) : (<Text c="dimmed">Aún no tienes un historial de citas.</Text>)}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}