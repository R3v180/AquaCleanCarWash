// ====== [28] apps/client/src/pages/admin/BusinessSettingsPage.tsx ======
// File: /apps/client/src/pages/admin/BusinessSettingsPage.tsx (VERSIÓN COMPLETA Y CORRECTA)

import { useState, useEffect } from 'react';
import { Title, Text, Paper, LoadingOverlay, Alert, Select, Button, Group, Stack, Divider, SimpleGrid, TextInput, ActionIcon, List, ThemeIcon, Tabs, PasswordInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCalendar, IconClock, IconTrash, IconSettings, IconMail, IconBrandWhatsapp } from '@tabler/icons-react';
import { DatePicker, TimeInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useDisclosure } from '@mantine/hooks';
import apiClient from '../../lib/apiClient';
import { ScheduleEditor, WeeklySchedule } from '../../components/admin/ScheduleEditor';
import { ConflictResolutionModal } from '../../components/admin/ConflictResolutionModal';


interface Service { id: string; name: string; duration: number; }
interface DateOverride { id: string; date: string; reason?: string | null; openTime?: string | null; closeTime?: string | null; }
interface Conflict { id: string; startTime: string; user: { name: string | null; }; }

interface SettingsData {
  settings: {
    defaultServiceId: string | null;
    weeklySchedule: WeeklySchedule;
    defaultService: Service | null;
    emailHost?: string | null; emailPort?: string | null; emailUser?: string | null;
    emailPass?: string | null; emailFrom?: string | null;
    twilioSid?: string | null; twilioAuthToken?: string | null; twilioPhoneNumber?: string | null;
  };
  allServices: Service[];
}

export function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<{ value: string; label: string }[]>([]);
  
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideOpenTime, setOverrideOpenTime] = useState('');
  const [overrideCloseTime, setOverrideCloseTime] = useState('');

  const [conflictingAppointments, setConflictingAppointments] = useState<Conflict[]>([]);
  const [conflictModalOpened, { open: openConflictModal, close: closeConflictModal }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      defaultServiceId: '',
      weeklySchedule: {} as WeeklySchedule,
      emailHost: '', emailPort: '', emailUser: '', emailPass: '', emailFrom: '',
      twilioSid: '', twilioAuthToken: '', twilioPhoneNumber: '',
    },
  });

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const [settingsResponse, overridesResponse] = await Promise.all([
        apiClient.get<SettingsData>('/admin/settings'),
        apiClient.get<DateOverride[]>('/admin/overrides'),
      ]);
      const { settings, allServices } = settingsResponse.data;
      
      form.setValues({
        defaultServiceId: settings.defaultServiceId || '',
        weeklySchedule: settings.weeklySchedule || {},
        emailHost: settings.emailHost || '',
        emailPort: settings.emailPort || '',
        emailUser: settings.emailUser || '',
        emailPass: settings.emailPass || '',
        emailFrom: settings.emailFrom || '',
        twilioSid: settings.twilioSid || '',
        twilioAuthToken: settings.twilioAuthToken || '',
        twilioPhoneNumber: settings.twilioPhoneNumber || '',
      });

      setAllServices(allServices.map(s => ({ value: s.id, label: `${s.name} (${s.duration} min)` })));
      setOverrides(overridesResponse.data);
    } catch (err) {
      setError('No se pudo cargar la configuración del negocio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllSettings(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await apiClient.put('/admin/settings', values);
      notifications.show({
        title: '¡Guardado!',
        message: 'La configuración del negocio se ha actualizado correctamente.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar la configuración. Inténtalo de nuevo.',
        color: 'red',
      });
    }
  };
  
  const handleAddOverride = async () => {
    if (!selectedDate) return;
    try {
      await apiClient.post('/admin/overrides', {
        date: dayjs(selectedDate).format('YYYY-MM-DD'),
        reason: overrideReason,
        openTime: overrideOpenTime || null,
        closeTime: overrideCloseTime || null,
      });
      notifications.show({ title: 'Configuración de Fecha Guardada', message: 'El horario especial o cierre ha sido guardado.', color: 'green' });
      setSelectedDate(null);
      setOverrideReason('');
      setOverrideOpenTime('');
      setOverrideCloseTime('');
      fetchAllSettings();
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setConflictingAppointments(err.response.data.conflicts || []);
        openConflictModal();
      } else {
        const errorMsg = err.response?.data?.message || 'No se pudo guardar la configuración de la fecha.';
        notifications.show({ title: 'Error', message: errorMsg, color: 'red' });
      }
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    try {
      await apiClient.delete(`/admin/overrides/${overrideId}`);
      notifications.show({ title: 'Configuración Eliminada', message: 'La fecha vuelve a su horario normal.', color: 'orange' });
      fetchAllSettings();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar la configuración.', color: 'red' });
    }
  };

  const overrideDates = overrides.map(o => dayjs(o.date).format('YYYY-MM-DD'));

  return (
    <>
      <ConflictResolutionModal opened={conflictModalOpened} onClose={closeConflictModal} conflicts={conflictingAppointments} />
      
      <Paper component="form" onSubmit={form.onSubmit(handleSubmit)} shadow="md" p="xl" withBorder pos="relative">
        <LoadingOverlay visible={loading} />
        <Title order={2}>Ajustes del Negocio</Title>
        <Text c="dimmed" mt="sm" mb="xl">Configura aquí las opciones principales de la aplicación.</Text>

        {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Carga" color="red" mb="xl">{error}</Alert>}

        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general" leftSection={<IconSettings size={14} />}>General y Horarios</Tabs.Tab>
            <Tabs.Tab value="email" leftSection={<IconMail size={14} />}>Email (SMTP)</Tabs.Tab>
            <Tabs.Tab value="whatsapp" leftSection={<IconBrandWhatsapp size={14} />}>WhatsApp (Twilio)</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="xl">
            <Stack>
              <Title order={4}>Configuración de Reservas</Title>
              <Select label="Servicio por Defecto para las Reservas" description="Este es el único servicio que se ofrecerá a los clientes al reservar." data={allServices} disabled={loading} withAsterisk {...form.getInputProps('defaultServiceId')} />
              
              <Divider my="xl" label="Horario de Apertura del Negocio" />
              <Title order={4}>Horario Semanal Estándar</Title>
              <ScheduleEditor value={form.values.weeklySchedule} onChange={(schedule) => form.setFieldValue('weeklySchedule', schedule)} />
              
              <Divider my="xl" label="Horarios Especiales y Días de Cierre" />
              <Title order={4}>Anulaciones por Fecha</Title>
              <Text c="dimmed" size="sm" mb="md">
                Selecciona un día para definir un horario especial o marcarlo como cerrado. Esta configuración anulará el horario semanal estándar solo para esa fecha.
              </Text>
              
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Stack>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    renderDay={(date) => {
                      const day = date.getDate();
                      const isOverridden = overrideDates.includes(dayjs(date).format('YYYY-MM-DD'));
                      return (
                        <div style={{ position: 'relative' }}>
                          {day}
                          {isOverridden && <div style={{ position: 'absolute', top: -2, right: 0, width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-5)' }} />}
                        </div>
                      );
                    }}
                  />
                  {selectedDate && (
                    <Paper withBorder p="sm" mt="md">
                      <Text size="sm" fw={500}>Configuración para: {dayjs(selectedDate).format('DD/MM/YYYY')}</Text>
                      <TextInput label="Razón (opcional)" placeholder="Ej: Festivo, Evento" value={overrideReason} onChange={(e) => setOverrideReason(e.currentTarget.value)} mt="xs" />
                      <Text size="xs" c="dimmed" mt="md">Deja las horas en blanco para un cierre de día completo.</Text>
                      <Group grow>
                        <TimeInput label="Nueva Apertura" value={overrideOpenTime} onChange={(e) => setOverrideOpenTime(e.currentTarget.value)} />
                        <TimeInput label="Nuevo Cierre" value={overrideCloseTime} onChange={(e) => setOverrideCloseTime(e.currentTarget.value)} />
                      </Group>
                      <Button onClick={handleAddOverride} fullWidth mt="md">Guardar Configuración de Fecha</Button>
                    </Paper>
                  )}
                </Stack>
                <Stack>
                  <Title order={5}>Fechas con Configuración Especial</Title>
                  {overrides.length > 0 ? (
                    <List spacing="sm" size="sm">
                      {overrides.map(override => (
                        <List.Item
                          key={override.id}
                          icon={
                            <ThemeIcon color={override.openTime ? 'blue' : 'red'} size={24} radius="xl">
                              {override.openTime ? <IconClock size="1rem" /> : <IconCalendar size="1rem" />}
                            </ThemeIcon>
                          }
                        >
                          <Group justify="space-between">
                            <div>
                              <Text>{dayjs(override.date).format('DD/MM/YYYY')}</Text>
                              <Text size="xs" c="dimmed">
                                {override.openTime ? `Horario: ${override.openTime} - ${override.closeTime}` : 'Cerrado todo el día'}
                                {override.reason && ` (${override.reason})`}
                              </Text>
                            </div>
                            <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteOverride(override.id)}>
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </List.Item>
                      ))}
                    </List>
                  ) : (
                    <Text c="dimmed" size="sm">No hay configuraciones especiales programadas.</Text>
                  )}
                </Stack>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>
          
          <Tabs.Panel value="email" pt="xl">
            <Stack>
              <Title order={4}>Configuración de Email (SMTP)</Title>
              <Text c="dimmed" size="sm">Introduce aquí los datos de tu proveedor de email para enviar notificaciones (ej: Google Workspace, Namecheap, etc.).</Text>
              <TextInput label="Servidor (Host)" placeholder="smtp.ejemplo.com" {...form.getInputProps('emailHost')} />
              <TextInput label="Puerto" placeholder="465" {...form.getInputProps('emailPort')} />
              <TextInput label="Usuario" placeholder="tu@email.com" {...form.getInputProps('emailUser')} />
              <PasswordInput label="Contraseña" placeholder="••••••••" {...form.getInputProps('emailPass')} />
              <TextInput label="Email 'De'" placeholder="Nombre Negocio <tu@email.com>" description="El nombre y email que verán tus clientes." {...form.getInputProps('emailFrom')} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="whatsapp" pt="xl">
            <Stack>
              <Title order={4}>Configuración de WhatsApp (Twilio)</Title>
              <Text c="dimmed" size="sm">Introduce aquí tus credenciales de Twilio para enviar recordatorios por WhatsApp.</Text>
              <TextInput label="Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" {...form.getInputProps('twilioSid')} />
              <PasswordInput label="Auth Token" placeholder="••••••••" {...form.getInputProps('twilioAuthToken')} />
              <TextInput label="Número de Teléfono de Twilio" placeholder="+14155238886" {...form.getInputProps('twilioPhoneNumber')} />
            </Stack>
          </Tabs.Panel>
        </Tabs>
        
        <Group justify="flex-end" mt="xl">
          <Button type="submit" disabled={loading} size="md">Guardar todos los Ajustes</Button>
        </Group>
      </Paper>
    </>
  );
}