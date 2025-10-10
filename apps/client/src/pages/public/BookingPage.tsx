// ====== [31] apps/client/src/pages/public/BookingPage.tsx ======
// File: /apps/client/src/pages/public/BookingPage.tsx (JSX RESTAURADO Y COMPLETO)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Stepper, Group, Button, TextInput, LoadingOverlay, Text, Alert, Select, Input } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { BookingDateTimePicker } from '../../components/booking/BookingDateTimePicker';
import apiClient from '../../lib/apiClient';

import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const customerInfoSchema = z.object({
  customerName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  customerEmail: z.string().email({ message: 'Introduce un email válido.' }),
  customerPhone: z.string().min(10, { message: 'Introduce un número de teléfono válido.' }),
});

interface Employee { id: string; name: string; }
interface Settings { defaultService: { duration: number; id: string; }; }

export function BookingPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>('any');
  const [serviceInfo, setServiceInfo] = useState<{ duration: number; id: string } | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [employeesRes, settingsRes] = await Promise.all([
          apiClient.get<Employee[]>('/employees/public'),
          apiClient.get<{ settings: Settings }>('/admin/settings'),
        ]);
        const employeeOptions = employeesRes.data.map(emp => ({ value: emp.id, label: emp.name }));
        setEmployees([ { value: 'any', label: 'Cualquier Profesional' }, ...employeeOptions ]);
        if (settingsRes.data.settings.defaultService) {
          setServiceInfo(settingsRes.data.settings.defaultService);
        } else {
          throw new Error('No hay un servicio por defecto configurado.');
        }
      } catch (err) {
        setError('No se pudo cargar la configuración de la reserva. Por favor, inténtalo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const form = useForm({
    validate: zodResolver(customerInfoSchema),
    initialValues: { customerName: '', customerEmail: '', customerPhone: '' },
  });

  const handleDateTimeChange = (dateTime: Date | null) => {
    setSelectedDateTime(dateTime);
    if (dateTime) { setActiveStep(1); }
  };

  const handleBookingSubmit = async (values: typeof form.values) => {
    if (!serviceInfo?.id || !selectedDateTime) {
      setError('Faltan datos para completar la reserva.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...values,
        serviceId: serviceInfo.id,
        startTime: selectedDateTime.toISOString(),
        ...(selectedEmployeeId && selectedEmployeeId !== 'any' && { employeeId: selectedEmployeeId }),
      };
      await apiClient.post('/bookings', payload);
      setActiveStep(2);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'No se pudo completar la reserva.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error && activeStep < 2) {
    return (
      <Container size="sm" py="xl">
        <Alert title="Error Crítico" color="red" variant="light">{error}</Alert>
        <Button onClick={() => navigate('/')} mt="md">Volver a Inicio</Button>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <LoadingOverlay visible={loading} />
      <Title order={2} ta="center" mb="xl">Realizar una Reserva</Title>

      <Stepper active={activeStep} onStepClick={setActiveStep}>
        {/* --- JSX DEL PASO 1 RESTAURADO --- */}
        <Stepper.Step label="Paso 1" description="Elige Profesional y Hora">
          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
            <Select
              label="Elige un profesional"
              placeholder="Selecciona tu profesional de preferencia"
              data={employees}
              value={selectedEmployeeId}
              onChange={setSelectedEmployeeId}
              mb="xl"
            />
            {serviceInfo && (
              <BookingDateTimePicker
                key={selectedEmployeeId}
                serviceDuration={serviceInfo.duration}
                onDateTimeChange={handleDateTimeChange}
                employeeId={selectedEmployeeId}
              />
            )}
          </Paper>
        </Stepper.Step>

        <Stepper.Step label="Paso 2" description="Tus Datos">
          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md" component="form" onSubmit={form.onSubmit(handleBookingSubmit)}>
            <LoadingOverlay visible={loading && activeStep === 1} />
            <Title order={4} mb="lg">Completa tu información</Title>
            <TextInput label="Nombre Completo" {...form.getInputProps('customerName')} withAsterisk />
            <TextInput label="Email" type="email" {...form.getInputProps('customerEmail')} withAsterisk mt="md" />
            
            <Input.Wrapper
              label="Teléfono"
              withAsterisk
              mt="md"
              error={form.errors.customerPhone}
            >
              <PhoneInput
                defaultCountry="es"
                value={form.values.customerPhone}
                onChange={(phone) => form.setFieldValue('customerPhone', phone)}
              />
            </Input.Wrapper>
            
            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={() => setActiveStep(0)}>Volver</Button>
              <Button type="submit">Confirmar Reserva</Button>
            </Group>
          </Paper>
        </Stepper.Step>
        
        {/* --- JSX DEL PASO 3 RESTAURADO --- */}
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