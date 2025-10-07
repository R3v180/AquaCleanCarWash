// File: /apps/client/src/pages/admin/BusinessSettingsPage.tsx (CORRECCIÓN FINAL DE ZONA HORARIA)

import { useState, useEffect } from 'react';
import { Title, Text, Paper, LoadingOverlay, Alert, Select, Button, Group, Stack, Divider, SimpleGrid, TextInput, ActionIcon, List, ThemeIcon } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCalendar, IconClock, IconTrash } from '@tabler/icons-react';
import { DatePicker, TimeInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useDisclosure } from '@mantine/hooks';
import apiClient from '../../lib/apiClient';
import { ScheduleEditor, WeeklySchedule } from '../../components/admin/ScheduleEditor';
import { ConflictResolutionModal } from '../../components/admin/ConflictResolutionModal';


// --- Tipos de datos ---
const settingsSchema = z.object({
  defaultServiceId: z.string().min(1, 'Debes seleccionar un servicio por defecto.'),
  weeklySchedule: z.record(z.string(), z.unknown()).optional(),
});
interface Service { id: string; name: string; duration: number; }
interface SettingsData { settings: { defaultServiceId: string | null; weeklySchedule: WeeklySchedule; defaultService: Service | null; }; allServices: Service[];}
interface DateOverride { id: string; date: string; reason?: string | null; openTime?: string | null; closeTime?: string | null; }
interface Conflict { id: string; startTime: string; user: { name: string | null; }; }


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
    initialValues: { defaultServiceId: '', weeklySchedule: {} as WeeklySchedule },
    validate: zodResolver(settingsSchema),
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
        message: 'La configuración general del negocio se ha actualizado correctamente.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar la configuración general. Inténtalo de nuevo.',
        color: 'red',
      });
    }
  };
  
  const handleAddOverride = async () => {
    if (!selectedDate) return;
    try {
      // --- LÍNEA CORREGIDA ---
      // Enviamos la fecha como un string 'YYYY-MM-DD' para evitar problemas de zona horaria.
      await apiClient.post('/admin/overrides', {
        date: dayjs(selectedDate).format('YYYY-MM-DD'),
        reason: overrideReason,
        openTime: overrideOpenTime || null,
        closeTime: overrideCloseTime || null,
      });
      notifications.show({ title: 'Configuración de Fecha Guardada', message: 'El horario especial o cierre ha sido guardado.', color: 'green' });
      // Resetear formulario
      setSelectedDate(null);
      setOverrideReason('');
      setOverrideOpenTime('');
      setOverrideCloseTime('');
      fetchAllSettings(); // Recargar todo
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
      fetchAllSettings(); // Recargar
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

        <Stack>
          <Title order={4}>Configuración de Reservas</Title>
          <Select label="Servicio por Defecto para las Reservas" description="Este es el único servicio que se ofrecerá a los clientes al reservar." data={allServices} disabled={loading} withAsterisk {...form.getInputProps('defaultServiceId')} />
          
          <Divider my="xl" label="Horario de Apertura del Negocio" />
          <Title order={4}>Horario Semanal Estándar</Title>
          <Text c="dimmed" size="sm" mb="md">Define las horas de apertura y cierre para cada día. Esto establecerá el marco general en el que los empleados pueden trabajar.</Text>
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

          <Group justify="flex-end" mt="xl">
            <Button type="submit" disabled={loading}>Guardar Cambios Generales</Button>
          </Group>
        </Stack>
      </Paper>
    </>
  );
}