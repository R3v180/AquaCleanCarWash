import { useState } from 'react';
import { Container, Title, Text, Paper } from '@mantine/core';
import { BookingDateTimePicker } from '../../components/booking/BookingDateTimePicker';

export function BookingPage() {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  // Esta es la duración del servicio que estamos probando.
  // Más adelante, este valor vendrá del servicio que el cliente haya seleccionado.
  const MOCK_SERVICE_DURATION = 60; // 60 minutos

  return (
    <Container size="sm" py="xl">
      <Title order={2} ta="center">
        Realizar una Reserva
      </Title>
      
      <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
        <Title order={3} mb="lg">Paso 1: Elige Fecha y Hora</Title>
        <BookingDateTimePicker
          serviceDuration={MOCK_SERVICE_DURATION}
          onDateTimeChange={setSelectedDateTime}
        />
      </Paper>

      {/* Esta sección es solo para depurar y ver que todo funciona */}
      <Paper withBorder p="md" mt="xl" radius="md" style={{ backgroundColor: '#f0f0f0' }}>
        <Text fw={700}>Valor seleccionado (para depuración):</Text>
        <Text>
          {selectedDateTime ? selectedDateTime.toLocaleString('es-ES') : 'Ninguna fecha y hora seleccionada'}
        </Text>
      </Paper>
    </Container>
  );
}