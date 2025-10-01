// File: /apps/client/src/pages/admin/ServicesManagementPage.tsx (CORREGIDO)

import { useEffect, useState } from 'react';
import { Table, Title, Button, Modal, TextInput, Textarea, NumberInput, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm, zodResolver } from '@mantine/form';
import apiClient from '../../lib/apiClient';
import type { Service } from '@aquaclean/types';
// CORRECCIÓN: Importamos el esquema a través del paquete de tipos compartidos
import { createServiceSchema } from '@aquaclean/types';

export function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    validate: zodResolver(createServiceSchema),
    initialValues: {
      name: '',
      description: '',
      duration: 0,
      prices: { standard: 0 },
      category: '',
    },
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Service[]>('/services');
      setServices(response.data);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los servicios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await apiClient.post<Service>('/services', values);
      setServices((currentServices) => [...currentServices, response.data]);
      close();
      form.reset();
    } catch (err) {
      console.error('Error al crear el servicio:', err);
    }
  };

  if (loading) return <p>Cargando servicios...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <Modal opened={opened} onClose={close} title="Crear Nuevo Servicio" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Nombre del Servicio" placeholder="Ej: Lavado Premium" {...form.getInputProps('name')} withAsterisk />
          <Textarea label="Descripción" placeholder="Descripción detallada del servicio" {...form.getInputProps('description')} withAsterisk mt="md" />
          <NumberInput label="Duración (minutos)" placeholder="Ej: 60" {...form.getInputProps('duration')} withAsterisk mt="md" />
          <TextInput label="Categoría" placeholder="Ej: Detallado Interior" {...form.getInputProps('category')} withAsterisk mt="md" />
          <NumberInput label="Precio Estándar" placeholder="Ej: 50" {...form.getInputProps('prices.standard')} withAsterisk mt="md" />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button type="submit">Crear Servicio</Button>
          </Group>
        </form>
      </Modal>

      <Group justify="space-between">
        <Title order={2}>Gestión de Servicios</Title>
        <Button onClick={open}>Crear Nuevo Servicio</Button>
      </Group>

      <Table mt="md" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Categoría</Table.Th>
            <Table.Th>Duración (min)</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {services.length > 0 ? (
            services.map((service) => (
              <Table.Tr key={service.id}>
                <Table.Td>{service.name}</Table.Td>
                <Table.Td>{service.category}</Table.Td>
                <Table.Td>{service.duration}</Table.Td>
                <Table.Td>{/* Botones de Editar/Eliminar irán aquí */}</Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={4}>No hay servicios creados.</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}