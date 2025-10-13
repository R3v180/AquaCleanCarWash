// File: /apps/client/src/pages/customer/CustomerDashboardPage.tsx (CON RESUMEN DINÁMICO)

import { Title, Text, Paper, LoadingOverlay, Alert, Button, Group, Stack, ThemeIcon } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { IconCalendar, IconClock, IconUser, IconArrowRight } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

// Interfaces para tipar los datos que esperamos de la API
interface AppointmentService {
  service: { name: string; };
}
interface Appointment {
  id: string;
  startTime: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  services: AppointmentService[];
  employee: { name: string; };
}
interface CustomerInfo {
  name?: string;
}

function InfoLine({ icon: Icon, text }: { icon: React.ElementType, text: string }) {
    return (
        <Group>
            <ThemeIcon variant="light" size="lg">
                <Icon size={20} />
            </ThemeIcon>
            <Text>{text}</Text>
        </Group>
    );
}

export function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  
  // --- ESTADOS AÑADIDOS ---
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Recuperamos la información del usuario del localStorage (sin cambios)
    const customerInfoStr = localStorage.getItem('customerInfo');
    if (customerInfoStr) {
      setCustomer(JSON.parse(customerInfoStr));
    }

    // --- LÓGICA DE DATOS AÑADIDA ---
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Appointment[]>('/me/appointments');
        const allAppointments = response.data;
        
        // Buscamos la próxima cita confirmada
        const nextUpcomingAppointment = allAppointments
          .filter(appt => appt.status === 'CONFIRMED' && dayjs(appt.startTime).isAfter(dayjs()))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]; // Ordenamos y cogemos la primera

        setUpcomingAppointment(nextUpcomingAppointment || null);
      } catch (err) {
        setError('No se pudo cargar el resumen de tus citas.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div>
      <Title order={2} mb="sm">
        Bienvenido de nuevo, {customer?.name || 'Cliente'}
      </Title>
      <Text c="dimmed" mb="xl">
        Desde aquí puedes gestionar tus citas y tu información personal.
      </Text>

      <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} />
          {error && <Alert color="red" title="Error">{error}</Alert>}
          
          {!loading && !error && (
              upcomingAppointment ? (
                  // --- VISTA SI HAY PRÓXIMA CITA ---
                  <Paper withBorder p="lg" shadow="sm">
                      <Title order={4}>Tu Próxima Cita</Title>
                      <Stack mt="lg" gap="md">
                          <InfoLine icon={IconCalendar} text={dayjs(upcomingAppointment.startTime).format('dddd, D [de] MMMM')} />
                          <InfoLine icon={IconClock} text={`${dayjs(upcomingAppointment.startTime).format('HH:mm')}h - ${upcomingAppointment.services[0]?.service.name || 'Servicio'}`} />
                          <InfoLine icon={IconUser} text={`Con ${upcomingAppointment.employee.name}`} />
                      </Stack>
                      <Group justify="flex-end" mt="xl">
                          <Button 
                              variant="light" 
                              rightSection={<IconArrowRight size={14} />}
                              onClick={() => navigate('/dashboard/appointments')}
                          >
                              Gestionar mis Citas
                          </Button>
                      </Group>
                  </Paper>
              ) : (
                  // --- VISTA SI NO HAY PRÓXIMA CITA ---
                  <Paper withBorder p="lg" shadow="sm">
                      <Title order={4}>Resumen Rápido</Title>
                      <Text mt="sm">No tienes ninguna cita programada.</Text>
                      <Group justify="flex-end" mt="xl">
                          <Button 
                              onClick={() => navigate('/booking')} 
                              size="md"
                          >
                              Reservar una Cita
                          </Button>
                      </Group>
                  </Paper>
              )
          )}
      </div>
    </div>
  );
}