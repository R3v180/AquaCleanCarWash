// File: /apps/client/src/pages/admin/BusinessSettingsPage.tsx (VERSIÓN FINAL)

import { useState, useEffect } from 'react';
import { Title, Text, Paper, LoadingOverlay, Alert, Select, Button, Group, Stack, Divider } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';
import { ScheduleEditor, WeeklySchedule } from '../../components/admin/ScheduleEditor';

// --- Esquema de validación para el formulario del frontend ---
const settingsSchema = z.object({
  defaultServiceId: z.string().min(1, 'Debes seleccionar un servicio por defecto.'),
  // Añadimos la validación para el horario
  weeklySchedule: z.record(z.string(), z.unknown()).optional(),
});

// --- Tipos de datos que esperamos de la API ---
interface Service {
  id: string;
  name: string;
  duration: number;
}
interface SettingsData {
  settings: {
    defaultServiceId: string | null;
    weeklySchedule: WeeklySchedule; // Usamos nuestro tipo importado
    defaultService: Service | null;
  };
  allServices: Service[];
}

export function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<{ value: string; label: string }[]>([]);

  // --- Inicialización del formulario con Mantine ---
  const form = useForm({
    initialValues: {
      defaultServiceId: '',
      weeklySchedule: {} as WeeklySchedule, // Inicializamos el horario
    },
    validate: zodResolver(settingsSchema),
  });

  // --- Efecto para cargar los datos iniciales ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<SettingsData>('/admin/settings');
        const { settings, allServices } = response.data;

        // Poblamos el formulario con los datos recibidos
        form.setValues({
          defaultServiceId: settings.defaultServiceId || '',
          // Nos aseguramos de que weeklySchedule sea un objeto para evitar errores
          weeklySchedule: settings.weeklySchedule || {},
        });

        // Transformamos los servicios para el componente Select
        setAllServices(allServices.map(s => ({ value: s.id, label: `${s.name} (${s.duration} min)` })));

      } catch (err) {
        setError('No se pudo cargar la configuración del negocio.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Función para manejar el envío del formulario ---
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

  return (
    <Paper component="form" onSubmit={form.onSubmit(handleSubmit)} shadow="md" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} />

      <Title order={2}>Ajustes del Negocio</Title>
      <Text c="dimmed" mt="sm" mb="xl">
        Configura aquí las opciones principales de la aplicación.
      </Text>

      {error && (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Carga" color="red" mb="xl">
          {error}
        </Alert>
      )}

      <Stack>
        {/* --- SECCIÓN 1: SERVICIO POR DEFECTO --- */}
        <Title order={4}>Configuración de Reservas</Title>
        <Select
          label="Servicio por Defecto para las Reservas"
          description="Este es el único servicio que se ofrecerá a los clientes al reservar."
          data={allServices}
          disabled={loading}
          withAsterisk
          {...form.getInputProps('defaultServiceId')}
        />

        <Divider my="xl" label="Horario de Apertura del Negocio" />

        {/* --- SECCIÓN 2: HORARIO DEL NEGOCIO --- */}
        <Title order={4}>Horario Semanal</Title>
        <Text c="dimmed" size="sm" mb="md">
          Define las horas de apertura y cierre para cada día. Esto establecerá el marco general en el que los empleados pueden trabajar.
        </Text>
        <ScheduleEditor
            value={form.values.weeklySchedule}
            onChange={(schedule) => form.setFieldValue('weeklySchedule', schedule)}
        />


        <Group justify="flex-end" mt="xl">
          <Button type="submit" disabled={loading}>
            Guardar Cambios
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}