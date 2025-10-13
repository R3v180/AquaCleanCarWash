// File: /apps/client/src/pages/public/BookingPage.tsx (CON LÓGICA DE PRE-SELECCIÓN)

import { useState, useEffect } from 'react';
// --- IMPORTACIÓN AÑADIDA ---
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Title, Paper, Stepper, Group, Button, TextInput, LoadingOverlay, Text, Alert, Select, Input, Checkbox, PasswordInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { BookingDateTimePicker } from '../../components/booking/BookingDateTimePicker';
import apiClient from '../../lib/apiClient';

import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const createBookingSchema = (isCreatingAccount: boolean) => z.object({
  customerName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  customerEmail: z.string().email({ message: 'Introduce un email válido.' }),
  customerPhone: z.string().min(10, { message: 'Introduce un número de teléfono válido.' }),
  createAccount: z.boolean(),
  password: isCreatingAccount
    ? z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    : z.string().optional(),
});

interface Employee { id: string; name: string; }
interface Settings { defaultService: { duration: number; id: string; }; }
interface CustomerInfo { id: string; name: string; email: string; }

export function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // <-- HOOK AÑADIDO
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>('any');
  const [serviceInfo, setServiceInfo] = useState<{ duration: number; id: string } | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  
  const [loggedInCustomer, setLoggedInCustomer] = useState<CustomerInfo | null>(null);
  const [wantsToCreateAccount, setWantsToCreateAccount] = useState(false);
  
  const form = useForm({
    validate: zodResolver(createBookingSchema(wantsToCreateAccount)),
    initialValues: { customerName: '', customerEmail: '', customerPhone: '', createAccount: false, password: '' },
  });

  useEffect(() => {
    const customerInfoStr = localStorage.getItem('customerInfo');
    if (customerInfoStr) {
      const customer = JSON.parse(customerInfoStr);
      setLoggedInCustomer(customer);
      form.setValues({ customerName: customer.name, customerEmail: customer.email });
    }
    
    const fetchInitialData = async () => {
      setError(null);
      try {
        const [employeesRes, settingsRes] = await Promise.all([
          apiClient.get<Employee[]>('/employees/public'),
          apiClient.get<{ settings: Settings }>('/admin/settings'),
        ]);
        const employeeOptions = employeesRes.data.map(emp => ({ value: emp.id, label: emp.name }));
        setEmployees([ { value: 'any', label: 'Cualquier Profesional' }, ...employeeOptions ]);
        
        // --- LÓGICA AÑADIDA PARA PRE-SELECCIÓN ---
        const employeeIdFromUrl = searchParams.get('employeeId');
        if (employeeIdFromUrl) {
          // Verificamos que el empleado de la URL existe en la lista que hemos cargado
          const employeeExists = employeeOptions.some(emp => emp.value === employeeIdFromUrl);
          if (employeeExists) {
            setSelectedEmployeeId(employeeIdFromUrl);
          }
        }
        // --- FIN DE LA LÓGICA AÑADIDA ---

        if (settingsRes.data.settings.defaultService) {
          setServiceInfo(settingsRes.data.settings.defaultService);
        } else { throw new Error('No hay un servicio por defecto configurado.'); }

      } catch (err) {
        setError('No se pudo cargar la configuración de la reserva.');
      } finally { setLoading(false); }
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- El searchParams no necesita ser dependencia, solo se lee al montar

  useEffect(() => {
    setWantsToCreateAccount(form.values.createAccount);
  }, [form.values.createAccount]);

  const handleDateTimeChange = (dateTime: Date | null) => {
    setSelectedDateTime(dateTime);
    if (dateTime) { setActiveStep(1); }
  };

  const handleBookingSubmit = async (values: typeof form.values) => {
    if (!serviceInfo?.id || !selectedDateTime) {
      setError('Faltan datos para completar la reserva.'); return;
    }
    setLoading(true); setError(null);
    try {
      const payload = {
        serviceId: serviceInfo.id,
        startTime: selectedDateTime.toISOString(),
        ...(selectedEmployeeId && selectedEmployeeId !== 'any' && { employeeId: selectedEmployeeId }),
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        createAccount: values.createAccount,
        password: values.password,
      };
      await apiClient.post('/bookings', payload);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo completar la reserva.');
    } finally { setLoading(false); }
  };

  if (error && activeStep < 2) {
    return (
      <Container size="sm" py="xl"><Alert title="Error Crítico" color="red">{error}</Alert></Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} ta="center" mb="xl">Realizar una Reserva</Title>
      <Stepper active={activeStep} onStepClick={setActiveStep}>
        <Stepper.Step label="Paso 1" description="Elige Profesional y Hora">
          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
            <LoadingOverlay visible={loading && !serviceInfo} />
            <Select label="Elige un profesional" data={employees} value={selectedEmployeeId} onChange={setSelectedEmployeeId} mb="xl" />
            {serviceInfo && (
              <BookingDateTimePicker key={selectedEmployeeId} serviceDuration={serviceInfo.duration} onDateTimeChange={handleDateTimeChange} employeeId={selectedEmployeeId} />
            )}
          </Paper>
        </Stepper.Step>

        <Stepper.Step label="Paso 2" description="Tus Datos">
          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md" component="form" onSubmit={form.onSubmit(handleBookingSubmit)}>
            <LoadingOverlay visible={loading && activeStep === 1} />
            <Title order={4} mb="lg">Completa tu información</Title>
            
            <TextInput label="Nombre Completo" {...form.getInputProps('customerName')} withAsterisk readOnly={!!loggedInCustomer} />
            <TextInput label="Email" type="email" {...form.getInputProps('customerEmail')} withAsterisk mt="md" readOnly={!!loggedInCustomer} />
            <Input.Wrapper label="Teléfono" withAsterisk mt="md" error={form.errors.customerPhone}>
              <PhoneInput defaultCountry="es" value={form.values.customerPhone} onChange={(phone) => form.setFieldValue('customerPhone', phone)} />
            </Input.Wrapper>
            
            {!loggedInCustomer && (
              <>
                <Checkbox label="Crear una cuenta para gestionar mis citas" {...form.getInputProps('createAccount', { type: 'checkbox' })} mt="lg" />
                {form.values.createAccount && (
                  <PasswordInput label="Crear Contraseña" placeholder="Mínimo 8 caracteres" {...form.getInputProps('password')} withAsterisk mt="md" />
                )}
              </>
            )}
            
            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={() => setActiveStep(0)}>Volver</Button>
              <Button type="submit">Confirmar Reserva</Button>
            </Group>
          </Paper>
        </Stepper.Step>
        
        <Stepper.Step label="Paso 3" description="Confirmación">
           <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
             <Title order={3} ta="center">¡Reserva Confirmada!</Title>
             <Text ta="center" mt="md">Hemos enviado un email de confirmación a <strong>{form.values.customerEmail}</strong>.</Text>
             <Text ta="center" mt="sm">Fecha de la cita: <strong>{selectedDateTime?.toLocaleString('es-ES')}</strong></Text>
             <Group justify="center" mt="xl"><Button onClick={() => navigate('/')}>Ir a Inicio</Button></Group>
           </Paper>
        </Stepper.Step>
      </Stepper>
    </Container>
  );
}