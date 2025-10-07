// File: /apps/client/src/pages/admin/BusinessSettingsPage.tsx (CORRECCIÓN FINAL)

import { useState, useEffect } from 'react';
import { Title, Text, Paper, LoadingOverlay, Alert, Select, Button, Group, Stack, Divider, SimpleGrid, TextInput, ActionIcon, List, ThemeIcon } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCalendar, IconTrash } from '@tabler/icons-react';
// --- LÍNEA MODIFICADA ---
import { DatePicker } from '@mantine/dates'; // Cambiamos Calendar por DatePicker
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
interface BusinessClosure { id: string; date: string; reason?: string | null; }
interface Conflict { id: string; startTime: string; user: { name: string | null; }; }


export function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<{ value: string; label: string }[]>([]);
  const [closures, setClosures] = useState<BusinessClosure[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [closureReason, setClosureReason] = useState('');
  const [conflictingAppointments, setConflictingAppointments] = useState<Conflict[]>([]);
  const [conflictModalOpened, { open: openConflictModal, close: closeConflictModal }] = useDisclosure(false);

  const form = useForm({
    initialValues: { defaultServiceId: '', weeklySchedule: {} as WeeklySchedule },
    validate: zodResolver(settingsSchema),
  });

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const [settingsResponse, closuresResponse] = await Promise.all([
        apiClient.get<SettingsData>('/admin/settings'),
        apiClient.get<BusinessClosure[]>('/admin/closures'),
      ]);
      const { settings, allServices } = settingsResponse.data;
      form.setValues({
        defaultServiceId: settings.defaultServiceId || '',
        weeklySchedule: settings.weeklySchedule || {},
      });
      setAllServices(allServices.map(s => ({ value: s.id, label: `${s.name} (${s.duration} min)` })));
      setClosures(closuresResponse.data);
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

  const handleAddClosure = async () => {
    if (!selectedDate) return;
    try {
      await apiClient.post('/admin/closures', {
        date: selectedDate,
        reason: closureReason,
      });
      notifications.show({ title: 'Día de Cierre Añadido', message: 'El día se ha bloqueado correctamente.', color: 'green' });
      setSelectedDate(null);
      setClosureReason('');
      fetchAllSettings(); 
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setConflictingAppointments(err.response.data.conflicts || []);
        openConflictModal();
      } else {
        notifications.show({ title: 'Error', message: 'No se pudo añadir el día de cierre.', color: 'red' });
      }
    }
  };

  const handleDeleteClosure = async (closureId: string) => {
    try {
      await apiClient.delete(`/admin/closures/${closureId}`);
      notifications.show({ title: 'Día de Cierre Eliminado', message: 'El día vuelve a estar disponible.', color: 'orange' });
      fetchAllSettings();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar el día de cierre.', color: 'red' });
    }
  };

  const closureDates = closures.map(c => dayjs(c.date).format('YYYY-MM-DD'));

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
          <Title order={4}>Horario Semanal</Title>
          <Text c="dimmed" size="sm" mb="md">Define las horas de apertura y cierre para cada día. Esto establecerá el marco general en el que los empleados pueden trabajar.</Text>
          <ScheduleEditor value={form.values.weeklySchedule} onChange={(schedule) => form.setFieldValue('weeklySchedule', schedule)} />
          
          <Divider my="xl" label="Días de Cierre y Festivos" />
          <Title order={4}>Calendario de Cierres</Title>
          <Text c="dimmed" size="sm" mb="md">Selecciona los días específicos en los que el negocio permanecerá cerrado. Los clientes no podrán reservar en estas fechas.</Text>
          
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack>
              {/* --- COMPONENTE CORREGIDO --- */}
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                renderDay={(date) => {
                  const day = date.getDate();
                  const isClosed = closureDates.includes(dayjs(date).format('YYYY-MM-DD'));
                  return (
                    <div style={{ position: 'relative' }}>
                      {day}
                      {isClosed && <div style={{ position: 'absolute', top: -2, right: 0, width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-5)' }} />}
                    </div>
                  );
                }}
              />
              {selectedDate && (
                <Paper withBorder p="sm" mt="md">
                  <Text size="sm" fw={500}>Añadir cierre para: {dayjs(selectedDate).format('DD/MM/YYYY')}</Text>
                  <TextInput label="Razón (opcional)" placeholder="Ej: Festivo Nacional" value={closureReason} onChange={(e) => setClosureReason(e.currentTarget.value)} mt="xs" />
                  <Button onClick={handleAddClosure} fullWidth mt="md">Confirmar Cierre</Button>
                </Paper>
              )}
            </Stack>
            <Stack>
              <Title order={5}>Días Cerrados Programados</Title>
              {closures.length > 0 ? (
                <List spacing="sm" size="sm">
                  {closures.map(closure => (
                    <List.Item
                      key={closure.id}
                      icon={<ThemeIcon color="red" size={24} radius="xl"><IconCalendar size="1rem" /></ThemeIcon>}
                    >
                      <Group justify="space-between">
                        <Text>{dayjs(closure.date).format('DD/MM/YYYY')} - <Text span c="dimmed">{closure.reason || 'Cerrado'}</Text></Text>
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteClosure(closure.id)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text c="dimmed" size="sm">No hay días de cierre programados.</Text>
              )}
            </Stack>
          </SimpleGrid>

          <Group justify="flex-end" mt="xl">
            <Button type="submit" disabled={loading}>Guardar Cambios</Button>
          </Group>
        </Stack>
      </Paper>
    </>
  );
}