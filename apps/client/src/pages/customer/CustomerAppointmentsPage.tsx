// File: /apps/client/src/pages/customer/CustomerAppointmentsPage.tsx (NUEVO ARCHIVO)

import { useEffect, useState } from 'react';
import { Title, Text, Tabs, Stack, Card, Group, Badge, Button, LoadingOverlay, Alert } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import apiClient from '../../lib/apiClient';

dayjs.locale('es');

// Definimos los tipos de datos que esperamos de nuestra nueva API
interface AppointmentService {
  service: { name: string; duration: number };
}
interface Appointment {
  id: string;
  startTime: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  services: AppointmentService[];
  employee: { name: string };
}

const statusConfig = {
    CONFIRMED: { label: 'Confirmada', color: 'blue' },
    COMPLETED: { label: 'Completada', color: 'green' },
    CANCELLED: { label: 'Cancelada', color: 'gray' },
    NO_SHOW: { label: 'No Presentado', color: 'orange' },
};

function AppointmentCard({ appointment }: { appointment: Appointment }) {
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
                    <Button variant="outline" color="red" size="xs">Cancelar Cita</Button>
                )}
                {appointment.status === 'COMPLETED' && (
                    <Button variant="light" size="xs">Reservar de Nuevo</Button>
                )}
            </Group>
        </Card>
    );
}


export function CustomerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await apiClient.get<Appointment[]>('/me/appointments');
        setAppointments(response.data);
      } catch (err) {
        setError('No se pudieron cargar tus citas.');
      } finally {
        setLoading(false);
      }
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
    <div>
      <Title order={2} mb="xl">Mis Citas</Title>
      
      <div style={{ position: 'relative' }}>
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
                            upcomingAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)
                        ) : (
                            <Text c="dimmed">No tienes ninguna cita programada.</Text>
                        )}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="history" pt="lg">
                    <Stack>
                        {pastAppointments.length > 0 ? (
                             pastAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)
                        ) : (
                            <Text c="dimmed">Aún no tienes un historial de citas.</Text>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        )}
      </div>
    </div>
  );
}