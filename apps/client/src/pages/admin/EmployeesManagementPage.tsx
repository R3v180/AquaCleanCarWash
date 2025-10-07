// File: /apps/client/src/pages/admin/EmployeesManagementPage.tsx (ACTUALIZADO CON REACTIVAR)

import { useEffect, useState } from 'react';
import { Table, Title, Button, Modal, TextInput, Select, Group, Avatar, Text, Flex, Badge, SegmentedControl } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconUserPlus, IconUserCheck } from '@tabler/icons-react'; // IconUserCheck añadido
import apiClient from '../../lib/apiClient';
import { createEmployeeSchema } from '@aquaclean/types';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  status: 'ACTIVE' | 'ARCHIVED';
  imageUrl?: string;
}

export function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const form = useForm({
    validate: zodResolver(createEmployeeSchema),
    initialValues: { name: '', email: '', role: 'EMPLOYEE', bio: '', imageUrl: '' },
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Employee[]>(`/employees?status=${statusFilter}`);
      setEmployees(response.data);
    } catch (err) {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar los empleados.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter]);

  const handleCreate = () => {
    form.reset();
    setSelectedEmployee(undefined);
    openModal();
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.setValues(employee);
    openModal();
  };

  const handleArchive = async (employee: Employee) => {
    try {
      await apiClient.put(`/employees/${employee.id}`, { status: 'ARCHIVED' });
      notifications.show({ title: 'Empleado Archivado', message: `${employee.name} ha sido archivado correctamente.`, color: 'orange' });
      fetchEmployees();
    } catch (err) {
      notifications.show({ title: 'Error', message: 'No se pudo archivar al empleado.', color: 'red' });
    }
  };

  // --- FUNCIÓN AÑADIDA ---
  const handleReactivate = async (employee: Employee) => {
    try {
      await apiClient.put(`/employees/${employee.id}`, { status: 'ACTIVE' });
      notifications.show({ title: 'Empleado Reactivado', message: `${employee.name} está activo de nuevo.`, color: 'teal' });
      fetchEmployees();
    } catch (err) {
      notifications.show({ title: 'Error', message: 'No se pudo reactivar al empleado.', color: 'red' });
    }
  };
  // --- FIN DE LA FUNCIÓN ---


  const handleFormSubmit = async (values: typeof form.values) => {
    try {
      if (selectedEmployee) {
        await apiClient.put(`/employees/${selectedEmployee.id}`, values);
        notifications.show({ title: '¡Guardado!', message: 'Los datos del empleado han sido actualizados.', color: 'green' });
      } else {
        await apiClient.post('/employees', values);
        notifications.show({ title: '¡Creado!', message: 'El nuevo empleado ha sido añadido.', color: 'green' });
      }
      fetchEmployees();
      closeModal();
    } catch (err) {
      notifications.show({ title: 'Error', message: 'No se pudo guardar el empleado.', color: 'red' });
    }
  };
  
  return (
    <div>
      <Modal opened={modalOpened} onClose={closeModal} title={selectedEmployee ? 'Editar Empleado' : 'Añadir Nuevo Empleado'} centered>
        <form onSubmit={form.onSubmit(handleFormSubmit)}>
          <TextInput label="Nombre Completo" {...form.getInputProps('name')} withAsterisk />
          <TextInput label="Email" type="email" {...form.getInputProps('email')} withAsterisk mt="md" />
          <Select
            label="Rol en el sistema"
            data={[{ value: 'EMPLOYEE', label: 'Empleado' }, { value: 'ADMIN', label: 'Administrador' }]}
            {...form.getInputProps('role')}
            withAsterisk mt="md"
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={closeModal}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </Group>
        </form>
      </Modal>

      <Group justify="space-between" mb="xl">
        <Title order={2}>Gestión de Empleados</Title>
        <Button onClick={handleCreate} leftSection={<IconUserPlus size={14} />}>Añadir Empleado</Button>
      </Group>

      <SegmentedControl
        value={statusFilter}
        onChange={setStatusFilter}
        data={[
          { label: 'Activos', value: 'ACTIVE' },
          { label: 'Archivados', value: 'ARCHIVED' },
        ]}
        mb="md"
      />

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Rol</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee) => (
            <Table.Tr key={employee.id}>
              <Table.Td>
                <Flex align="center" gap="sm">
                  <Avatar src={employee.imageUrl} name={employee.name} radius="xl" />
                  <div>
                    <Text>{employee.name}</Text>
                    <Text size="xs" c="dimmed">{employee.email}</Text>
                  </div>
                </Flex>
              </Table.Td>
              <Table.Td>{employee.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</Table.Td>
              <Table.Td>
                <Badge color={employee.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {employee.status === 'ACTIVE' ? 'Activo' : 'Archivado'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button variant="light" size="xs" onClick={() => handleEdit(employee)}>Editar Perfil</Button>
                  {/* --- LÓGICA MODIFICADA --- */}
                  {employee.status === 'ACTIVE' ? (
                     <Button variant="light" color="orange" size="xs" onClick={() => handleArchive(employee)} leftSection={<IconArchive size={14} />}>Archivar</Button>
                  ) : (
                     <Button variant="light" color="teal" size="xs" onClick={() => handleReactivate(employee)} leftSection={<IconUserCheck size={14} />}>Reactivar</Button>
                  )}
                  {/* --- FIN DE LA MODIFICACIÓN --- */}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}