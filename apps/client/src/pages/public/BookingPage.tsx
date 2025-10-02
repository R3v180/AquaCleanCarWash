// File: /apps/client/src/pages/public/BookingPage.tsx (ACTUALIZADO)

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Title, Paper, Stepper, Group, Button, TextInput, LoadingOverlay, Text, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { BookingDateTimePicker } from '../../components/booking/BookingDateTimePicker';
import apiClient from '../../lib/apiClient';

// Esquema de validación para el formulario del cliente en el frontend.
// Debería coincidir con el esquema del backend.
const customerInfoSchema = z.object({
  customerName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  customerEmail: z.string().email({ message: 'Introduce un email válido.' }),
  customerPhone: z.string().min(9, { message: 'Introduce un número de teléfono válido.' }),
  vehicleMake: z.string().min(2, { message: 'La marca es requerida.' }),
  vehicleModel: z.string().min(1, { message: 'El modelo es requerido.' }),
});

export function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Datos que vienen de la página de servicios
  const serviceId = searchParams.get('serviceId');
  const serviceDuration = searchParams.get('duration');

  const [activeStep, setActiveStep] = useState(0);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    validate: zodResolver(customerInfoSchema),
    initialValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      vehicleMake: '',
      vehicleModel: '',
    },
  });

  // Si no tenemos los datos del servicio, no podemos continuar.
  // Esto podría pasar si el usuario navega a /booking directamente.
  useEffect(() => {
    if (!serviceId || !serviceDuration) {
      setError('No se ha seleccionado ningún servicio. Por favor, vuelve a la página de servicios y elige uno.');
    }
  }, [serviceId, serviceDuration]);


  const handleDateTimeChange = (dateTime: Date | null) => {
    setSelectedDateTime(dateTime);
    if (dateTime) {
      setActiveStep(1); // Avanzamos al siguiente paso
    }
  };

  const handleBookingSubmit = async (values: typeof form.values) => {
    if (!serviceId || !selectedDateTime) {
      setError('Faltan datos para completar la reserva. Inténtalo de nuevo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...values,
        serviceId,
        startTime: selectedDateTime.toISOString(),
        // El empleado se asignará en el backend o en un paso futuro.
        // Por ahora, usamos el empleado de prueba del seed.
        // OJO: Este ID debe existir en tu base de datos (creado por el seed.ts).
        employeeId: 'cmg9is1e70002z69d1pgjua97', // <-- Hardcodeado temporalmente
      };

      await apiClient.post('/bookings', payload);

      // Si todo va bien, pasamos al paso final de confirmación
      setActiveStep(2);

    } catch (err: any) {
      console.error('Error al crear la reserva:', err);
      const errorMessage = err.response?.data?.message || 'No se pudo completar la reserva. Inténtalo de nuevo más tarde.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error && activeStep < 2) {
    return (
      <Container size="sm" py="xl">
        <Alert title="Error" color="red" variant="light">
          {error}
        </Alert>
        <Button onClick={() => navigate('/services')} mt="md">
          Volver a Servicios
        </Button>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} ta="center" mb="xl">
        Realizar una Reserva
      </Title>

      <Stepper active={activeStep} onStepClick={setActiveStep}>
        <Stepper.Step label="Paso 1" description="Elige Fecha y Hora">
          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
            <BookingDateTimePicker
              serviceDuration={Number(serviceDuration)}
              onDateTimeChange={handleDateTimeChange}
            />
          </Paper>
        </Stepper.Step>

        <Stepper.Step label="Paso 2" description="Tus Datos">
          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md" component="form" onSubmit={form.onSubmit(handleBookingSubmit)}>
            <LoadingOverlay visible={loading} />
            <Title order={4} mb="lg">Completa tu información</Title>
            <TextInput label="Nombre Completo" placeholder="Tu nombre" {...form.getInputProps('customerName')} withAsterisk />
            <TextInput label="Email" type="email" placeholder="tu@email.com" {...form.getInputProps('customerEmail')} withAsterisk mt="md" />
            <TextInput label="Teléfono" type="tel" placeholder="600 123 456" {...form.getInputProps('customerPhone')} withAsterisk mt="md" />
            <TextInput label="Marca del Vehículo" placeholder="Ej: Toyota" {...form.getInputProps('vehicleMake')} withAsterisk mt="md" />
            <TextInput label="Modelo del Vehículo" placeholder="Ej: Corolla" {...form.getInputProps('vehicleModel')} withAsterisk mt="md" />
            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={() => setActiveStep(0)}>Volver</Button>
              <Button type="submit">Confirmar Reserva</Button>
            </Group>
          </Paper>
        </Stepper.Step>

        <Stepper.Step label="Paso 3" description="Confirmación">
           <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
             <Title order={3} ta="center">¡Reserva Confirmada!</Title>
             <Text ta="center" mt="md">
               Gracias por tu reserva. Hemos enviado un email de confirmación a <strong>{form.values.customerEmail}</strong> con todos los detalles de tu cita.
             </Text>
             <Text ta="center" mt="sm">
                Fecha de la cita: <strong>{selectedDateTime?.toLocaleString('es-ES')}</strong>
             </Text>
             <Group justify="center" mt="xl">
                <Button onClick={() => navigate('/')}>Ir a la Página de Inicio</Button>
             </Group>
           </Paper>
        </Stepper.Step>
      </Stepper>
    </Container>
  );
}