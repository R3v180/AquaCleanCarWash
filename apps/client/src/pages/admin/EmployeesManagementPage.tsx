import { useEffect, useState } from 'react';
import {
  Table,
  Title,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Group,
  Avatar,
  Text,
  Flex,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm, zodResolver } from '@mantine/form';
import apiClient from '../../lib/apiClient';
import { createEmployeeSchema } from '@aquaclean/types';

// Definimos un tipo para los datos de los empleados que recibimos de la API
interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
}

export function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    validate: zodResolver(createEmployeeSchema),
    initialValues: {
      name: '',
      email: '',
      role: 'EMPLOYEE',
      bio: '',
      imageUrl: '',
    },
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Employee[]>('/employees');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los empleados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Omitimos workSchedule ya que no lo estamos manejando en este formulario
      const dataToSend = { ...values, workSchedule: {} };
      const response = await apiClient.post<Employee>('/employees', dataToSend);
      setEmployees((current) => [...current, response.data]);
      close();
      form.reset();
    } catch (err) {
      console.error('Error al crear el empleado:', err);
      // Aquí podrías añadir un feedback de error al usuario
    }
  };

  if (loading) return <p>Cargando empleados...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <Modal opened={opened} onClose={close} title="Añadir Nuevo Empleado" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Nombre Completo" placeholder="Ej: Juan Pérez" {...form.getInputProps('name')} withAsterisk />
          <TextInput label="Email" type="email" placeholder="ej: juan.perez@email.com" {...form.getInputProps('email')} withAsterisk mt="md" />
          <Select
            label="Rol en el sistema"
            data={[
              { value: 'EMPLOYEE', label: 'Empleado' },
              { value: 'ADMIN', label: 'Administrador' },
            ]}
            {...form.getInputProps('role')}
            withAsterisk
            mt="md"
          />
          <Textarea label="Biografía (opcional)" placeholder="Breve descripción para la página pública" {...form.getInputProps('bio')} mt="md" />
          <TextInput label="URL de la Foto (opcional)" placeholder="https://ejemplo.com/foto.jpg" {...form.getInputProps('imageUrl')} mt="md" />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button type="submit">Añadir Empleado</Button>
          </Group>
        </form>
      </Modal>

      <Group justify="space-between">
        <Title order={2}>Gestión de Empleados</Title>
        <Button onClick={open}>Añadir Nuevo Empleado</Button>
      </Group>

      <Table mt="md" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Rol</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <Table.Tr key={employee.id}>
                <Table.Td>
                  <Flex align="center" gap="sm">
                    <Avatar src={employee.imageUrl} name={employee.name} radius="xl" />
                    <Text>{employee.name}</Text>
                  </Flex>
                </Table.Td>
                <Table.Td>{employee.email}</Table.Td>
                <Table.Td>{employee.role}</Table.Td>
                <Table.Td>{/* Botones de Editar/Eliminar irán aquí */}</Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={4}>No hay empleados creados.</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}