// File: /apps/client/src/pages/admin/EmployeesManagementPage.tsx (COMPLETO Y CORREGIDO)

import { useEffect, useState } from 'react';
import { Table, Title, Button, Modal, TextInput, Select, Group, Avatar, Text, Flex, Badge, SegmentedControl, Tabs, LoadingOverlay, Stack, Box, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconUserPlus, IconUserCheck, IconUser, IconClock, IconBeach } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';
import { createEmployeeSchema } from '@aquaclean/types';
import { ScheduleEditor, WeeklySchedule } from '../../components/admin/ScheduleEditor';
import { AbsenceCalendar, Absence } from '../../components/admin/AbsenceCalendar';
import { ConflictResolutionModal } from '../../components/admin/ConflictResolutionModal';

export interface Employee {
  id: string; name: string; email: string; role: 'ADMIN' | 'EMPLOYEE';
  status: 'ACTIVE' | 'ARCHIVED'; imageUrl?: string | null; bio?: string | null;
  workSchedule?: WeeklySchedule;
}
interface Conflict { id: string; startTime: string; user: { name: string | null; }; }

export function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [employeeAbsences, setEmployeeAbsences] = useState<Absence[]>([]);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  
  const [conflictingAppointments, setConflictingAppointments] = useState<Conflict[]>([]);
  const [conflictModalOpened, { open: openConflictModal, close: closeConflictModal }] = useDisclosure(false);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const form = useForm({
    validate: zodResolver(createEmployeeSchema),
    initialValues: { name: '', email: '', role: 'EMPLOYEE', bio: '', imageUrl: '', workSchedule: {} as WeeklySchedule },
  });

  const fetchEmployees = async () => {
    try { setLoading(true); const response = await apiClient.get<Employee[]>(`/employees?status=${statusFilter}`); setEmployees(response.data);
    } catch (err) { notifications.show({ title: 'Error', message: 'No se pudieron cargar los empleados.', color: 'red' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [statusFilter]);

  const handleCreate = () => {
    form.reset(); setSelectedEmployee(undefined); setEmployeeAbsences([]); openModal();
  };

  const handleEdit = async (employee: Employee) => {
    setLoading(true); setSelectedEmployee(employee);
    const sanitizedEmployeeData = { ...employee, bio: employee.bio || '', imageUrl: employee.imageUrl || '', workSchedule: employee.workSchedule || {}, };
    form.setValues(sanitizedEmployeeData);
    try {
        const absencesResponse = await apiClient.get<Absence[]>(`/employees/${employee.id}/absences`);
        setEmployeeAbsences(absencesResponse.data); openModal();
    } catch (error) { notifications.show({ title: 'Error', message: 'No se pudieron cargar las ausencias del empleado.', color: 'red' });
    } finally { setLoading(false); }
  };

  const handleFormSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      if (selectedEmployee) { await apiClient.put(`/employees/${selectedEmployee.id}`, values);
        notifications.show({ title: '¡Guardado!', message: 'Los datos del empleado han sido actualizados.', color: 'green' });
      } else { await apiClient.post('/employees', values);
        notifications.show({ title: '¡Creado!', message: 'El nuevo empleado ha sido añadido.', color: 'green' });
      }
      fetchEmployees(); closeModal();
    } catch (err) { notifications.show({ title: 'Error', message: 'No se pudo guardar el empleado.', color: 'red' });
    } finally { setIsSubmitting(false); }
  };

  const handleStatusChange = async (employee: Employee, status: 'ACTIVE' | 'ARCHIVED') => {
    try { await apiClient.put(`/employees/${employee.id}`, { status });
      notifications.show({ title: `Empleado ${status === 'ACTIVE' ? 'Reactivado' : 'Archivado'}`, message: `${employee.name} ha sido actualizado.`, color: status === 'ACTIVE' ? 'teal' : 'orange' });
      fetchEmployees();
    } catch (err) { notifications.show({ title: 'Error', message: 'No se pudo cambiar el estado del empleado.', color: 'red' }); }
  };

  const handleAddAbsence = async (dates: [Date, Date]) => {
      if (!selectedEmployee) return;
      try {
          const newAbsence = await apiClient.post<Absence>(`/employees/${selectedEmployee.id}/absences`, { startDate: dates[0], endDate: dates[1] });
          setEmployeeAbsences([...employeeAbsences, newAbsence.data]);
          notifications.show({ title: 'Ausencia Añadida', message: 'El periodo de ausencia ha sido guardado.', color: 'green' });
      } catch (error: any) { 
          if (error.response && error.response.status === 409) {
              setConflictingAppointments(error.response.data.conflicts || []);
              openConflictModal();
          } else {
              notifications.show({ title: 'Error', message: 'No se pudo guardar la ausencia.', color: 'red' });
          }
      }
  };

  const handleDeleteAbsence = async (absenceId: string) => {
      if (!selectedEmployee) return;
      try {
          await apiClient.delete(`/employees/${selectedEmployee.id}/absences/${absenceId}`);
          setEmployeeAbsences(employeeAbsences.filter(a => a.id !== absenceId));
          notifications.show({ title: 'Ausencia Eliminada', message: 'El periodo de ausencia ha sido eliminado.', color: 'orange' });
      } catch (error) { notifications.show({ title: 'Error', message: 'No se pudo eliminar la ausencia.', color: 'red' }); }
  };
  
  return (
    <div>
      <Modal opened={modalOpened} onClose={closeModal} title={selectedEmployee ? `Editando a ${selectedEmployee.name}` : 'Añadir Nuevo Empleado'} size="xl" centered>
        <LoadingOverlay visible={isSubmitting || loading} />
        <Tabs defaultValue="profile">
          <Tabs.List>
            <Tabs.Tab value="profile" leftSection={<IconUser size={14} />}>Perfil</Tabs.Tab>
            <Tabs.Tab value="schedule" leftSection={<IconClock size={14} />}>Horario Laboral</Tabs.Tab>
            <Tabs.Tab value="absences" leftSection={<IconBeach size={14} />}>Ausencias</Tabs.Tab>
          </Tabs.List>

          <form onSubmit={form.onSubmit(handleFormSubmit)}>
            {/* --- SECCIÓN RESTAURADA --- */}
            <Tabs.Panel value="profile" pt="md">
              <Stack>
                <TextInput label="Nombre Completo" {...form.getInputProps('name')} withAsterisk />
                <TextInput label="Email" type="email" {...form.getInputProps('email')} withAsterisk />
                <Select
                    label="Rol en el sistema"
                    data={[{ value: 'EMPLOYEE', label: 'Empleado' }, { value: 'ADMIN', label: 'Administrador' }]}
                    {...form.getInputProps('role')}
                    withAsterisk
                />
                <TextInput label="URL de la Foto" {...form.getInputProps('imageUrl')} />
                <Textarea label="Biografía" {...form.getInputProps('bio')} /> 
              </Stack>
            </Tabs.Panel>
            {/* --- FIN DE LA SECCIÓN RESTAURADA --- */}
            
            <Tabs.Panel value="schedule" pt="md">
                <ScheduleEditor value={form.values.workSchedule} onChange={(schedule) => form.setFieldValue('workSchedule', schedule)} />
            </Tabs.Panel>

            {selectedEmployee && (
              <Tabs.Panel value="absences" pt="md">
                  <AbsenceCalendar absences={employeeAbsences} onAddAbsence={handleAddAbsence} onDeleteAbsence={handleDeleteAbsence} />
              </Tabs.Panel>
            )}

            <Group justify="flex-end" mt="xl">
                <Button variant="default" onClick={closeModal}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
            </Group>
          </form>
        </Tabs>
      </Modal>

      <ConflictResolutionModal opened={conflictModalOpened} onClose={closeConflictModal} conflicts={conflictingAppointments} />

      <Group justify="space-between" mb="xl">
        <Title order={2}>Gestión de Empleados</Title>
        <Button onClick={handleCreate} leftSection={<IconUserPlus size={14} />}>Añadir Empleado</Button>
      </Group>

      <SegmentedControl value={statusFilter} onChange={setStatusFilter} data={[{ label: 'Activos', value: 'ACTIVE' }, { label: 'Archivados', value: 'ARCHIVED' }]} mb="md" />

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr><Table.Th>Nombre</Table.Th><Table.Th>Rol</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Acciones</Table.Th></Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee) => (
            <Table.Tr key={employee.id}>
              <Table.Td><Group><Avatar src={employee.imageUrl || undefined} name={employee.name} radius="xl" /><Box><Text>{employee.name}</Text><Text size="xs" c="dimmed">{employee.email}</Text></Box></Group></Table.Td>
              <Table.Td>{employee.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</Table.Td>
              <Table.Td><Badge color={employee.status === 'ACTIVE' ? 'green' : 'gray'}>{employee.status === 'ACTIVE' ? 'Activo' : 'Archivado'}</Badge></Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button variant="light" size="xs" onClick={() => handleEdit(employee)}>Editar</Button>
                  {employee.status === 'ACTIVE' ? (
                     <Button variant="light" color="orange" size="xs" onClick={() => handleStatusChange(employee, 'ARCHIVED')} leftSection={<IconArchive size={14} />}>Archivar</Button>
                  ) : (
                     <Button variant="light" color="teal" size="xs" onClick={() => handleStatusChange(employee, 'ACTIVE')} leftSection={<IconUserCheck size={14} />}>Reactivar</Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}