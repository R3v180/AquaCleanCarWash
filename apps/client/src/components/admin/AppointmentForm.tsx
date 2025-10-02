// File: /apps/client/src/components/admin/AppointmentForm.tsx (ACTUALIZADO)

import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { TextInput, Select, Button, Group, Stack, LoadingOverlay, Modal, Text } from '@mantine/core'; // Modal, Text añadidos
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks'; // useDisclosure añadido
import apiClient from '../../lib/apiClient';
import type { Service } from '@aquaclean/types';

interface Employee {
  id: string;
  name: string;
}

interface AppointmentFormProps {
  initialData?: any;
  onSuccess: () => void;
  onClose: () => void;
}

export function AppointmentForm({ initialData, onSuccess, onClose }: AppointmentFormProps) {
  const [services, setServices] = useState<{ value: string; label: string }[]>([]);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para el modal de confirmación de anulación
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      customerName: '',
      customerEmail: '',
      serviceId: '',
      employeeId: '',
      startTime: null as Date | null,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        customerName: initialData.customerName || '',
        customerEmail: initialData.customerEmail || '',
        serviceId: initialData.serviceId || '',
        employeeId: initialData.employeeId || '',
        startTime: initialData.start ? new Date(initialData.start) : null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [servicesResponse, employeesResponse] = await Promise.all([
          apiClient.get<Service[]>('/services'),
          apiClient.get<Employee[]>('/employees'),
        ]);
        setServices(servicesResponse.data.map(s => ({ value: s.id, label: s.name })));
        setEmployees(employeesResponse.data.map(e => ({ value: e.id, label: e.name })));
      } catch (error) { console.error("Error fetching data for form", error); }
      finally { setLoadingData(false); }
    };
    fetchData();
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      if (initialData?.type === 'edit') {
        await apiClient.put(`/admin/appointments/${initialData.appointmentId}`, values);
        notifications.show({ title: 'Cita Actualizada', message: 'Los cambios en la cita han sido guardados.', color: 'blue' });
      } else {
        await apiClient.post('/admin/appointments', values);
        notifications.show({ title: 'Cita Creada', message: 'La nueva cita ha sido guardada en el calendario.', color: 'green' });
      }
      onSuccess();
    } catch (error) {
      notifications.show({ title: 'Error al Guardar', message: 'No se pudo guardar la cita. Inténtalo de nuevo.', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- LÓGICA DE ANULACIÓN ---
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/appointments/${initialData.appointmentId}`);
      notifications.show({
        title: 'Cita Anulada',
        message: 'La cita ha sido eliminada del calendario.',
        color: 'orange',
      });
      onSuccess(); // Reutilizamos onSuccess para cerrar modal y refrescar
    } catch (error) {
      notifications.show({ title: 'Error al Anular', message: 'No se pudo anular la cita.', color: 'red' });
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <>
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Confirmar Anulación" centered>
        <Text>¿Estás seguro de que quieres anular esta cita? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDeleteModal}>Cancelar</Button>
          <Button color="red" onClick={handleDelete} loading={isSubmitting}>Anular Cita</Button>
        </Group>
      </Modal>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={loadingData} />
        <Stack>
          <TextInput label="Nombre del Cliente" {...form.getInputProps('customerName')} required />
          <TextInput type="email" label="Email del Cliente" {...form.getInputProps('customerEmail')} required />
          <DateTimePicker label="Fecha y Hora de la Cita" {...form.getInputProps('startTime')} valueFormat="DD/MM/YYYY HH:mm" required />
          <Select label="Servicio" data={services} {...form.getInputProps('serviceId')} searchable required />
          <Select label="Empleado Asignado" data={employees} {...form.getInputProps('employeeId')} required />
          
          <Group justify="space-between" mt="md">
            {/* El botón de anular solo aparece en modo edición */}
            {initialData?.type === 'edit' ? (
              <Button variant="outline" color="red" onClick={openDeleteModal} disabled={isSubmitting}>
                Anular Cita
              </Button>
            ) : <div />} {/* Placeholder para mantener el espacio */}
            
            <Group>
              <Button variant="default" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Guardar Cambios
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </>
  );
}