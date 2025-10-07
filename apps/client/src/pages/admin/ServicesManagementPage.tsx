// File: /apps/client/src/pages/admin/ServicesManagementPage.tsx (RECONSTRUIDO)

import { useEffect, useState } from 'react';
import { Table, Title, Button, Group, Modal, ActionIcon, Switch, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';
import type { Service } from '@aquaclean/types';
import { ServiceForm } from '../../components/admin/ServiceForm';

export function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Partial<Service> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Service[]>('/services');
      setServices(response.data);
    } catch (err) {
      setError('No se pudieron cargar los servicios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = () => {
    setSelectedService(undefined);
    openModal();
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    openModal();
  };
  
  const handleDeleteConfirm = (service: Service) => {
    setSelectedService(service);
    openDeleteModal();
  };

  const handleFormSuccess = () => {
    fetchServices(); // Recargamos la lista de servicios
    closeModal();
    setIsSubmitting(false);
  };
  
  const handleToggleActive = async (service: Service) => {
    try {
      const updatedService = { ...service, isActive: !service.isActive };
      await apiClient.put(`/services/${service.id}`, { isActive: updatedService.isActive });
      setServices(services.map(s => s.id === service.id ? updatedService : s));
      notifications.show({ title: 'Estado Cambiado', message: `El servicio "${service.name}" ha sido actualizado.`, color: 'blue' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'No se pudo cambiar el estado del servicio.', color: 'red' });
    }
  };

  const handleFormSubmit = async (serviceData: Partial<Service>) => {
    setIsSubmitting(true);
    try {
      if (serviceData.id) { // Modo Edición
        const response = await apiClient.put<Service>(`/services/${serviceData.id}`, serviceData);
        notifications.show({ title: '¡Actualizado!', message: 'El servicio ha sido guardado correctamente.', color: 'green' });
      } else { // Modo Creación
        const response = await apiClient.post<Service>('/services', serviceData);
        notifications.show({ title: '¡Creado!', message: 'El nuevo servicio ha sido añadido.', color: 'green' });
      }
      handleFormSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage = err.response?.data?.message || 'Ocurrió un error al guardar el servicio.';
      notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
    }
  };
  
  const handleDeleteService = async () => {
    if (!selectedService?.id) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/services/${selectedService.id}`);
      notifications.show({ title: '¡Eliminado!', message: 'El servicio ha sido eliminado.', color: 'orange' });
      fetchServices();
      closeDeleteModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'No se pudo eliminar el servicio.';
      notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) return <p>Cargando servicios...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      {/* Modal para Crear/Editar */}
      <Modal opened={modalOpened} onClose={closeModal} title={selectedService?.id ? 'Editar Servicio' : 'Crear Nuevo Servicio'} centered>
        <ServiceForm 
          initialData={selectedService}
          onSuccess={handleFormSubmit}
          onClose={closeModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Modal de confirmación para Eliminar */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Confirmar Eliminación" centered>
        <Text>¿Estás seguro de que quieres eliminar el servicio "{selectedService?.name}"? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDeleteModal}>Cancelar</Button>
          <Button color="red" onClick={handleDeleteService} loading={isSubmitting}>Eliminar Servicio</Button>
        </Group>
      </Modal>

      <Group justify="space-between" mb="xl">
        <Title order={2}>Gestión de Servicios</Title>
        <Button onClick={handleCreate}>Crear Nuevo Servicio</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Duración</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {services.map((service) => (
            <Table.Tr key={service.id}>
              <Table.Td>{service.name}</Table.Td>
              <Table.Td>{service.duration} min</Table.Td>
              <Table.Td>
                <Switch 
                  checked={service.isActive} 
                  onChange={() => handleToggleActive(service)}
                  label={service.isActive ? 'Activo' : 'Inactivo'}
                />
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon variant="light" onClick={() => handleEdit(service)}>
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon variant="light" color="red" onClick={() => handleDeleteConfirm(service)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}