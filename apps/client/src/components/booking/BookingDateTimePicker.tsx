import { useState, useEffect } from 'react';
import { DatePicker } from '@mantine/dates';
import { SimpleGrid, Button, Text, Loader, Center, Stack, Title } from '@mantine/core';
import dayjs from 'dayjs';
import apiClient from '../../lib/apiClient';

// Definimos las propiedades que este componente necesitará
interface BookingDateTimePickerProps {
  serviceDuration: number;
  onDateTimeChange: (dateTime: Date | null) => void;
}

export function BookingDateTimePicker({ serviceDuration, onDateTimeChange }: BookingDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Este efecto se dispara cada vez que el usuario elige una nueva fecha en el calendario
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      setSelectedSlot(null); // Reseteamos la hora seleccionada al cambiar de día

      try {
        const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
        const response = await apiClient.get<string[]>('/availability', {
          params: {
            date: formattedDate,
            duration: serviceDuration,
          },
        });
        setAvailableSlots(response.data);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setError('No se pudo cargar la disponibilidad para este día.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, serviceDuration]);

  // Esta función se llama cuando el usuario hace clic en un botón de hora
  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    if (selectedDate) {
      // Usamos parseInt con una base de 10 para asegurar que la conversión es correcta y siempre devuelve un número.
      // Añadimos un valor por defecto de 0 por si acaso, lo que satisface a TypeScript.
      const hours = parseInt(slot.split(':')[0] ?? '0', 10);
      const minutes = parseInt(slot.split(':')[1] ?? '0', 10);

      const finalDateTime = dayjs(selectedDate).hour(hours).minute(minutes).toDate();
      onDateTimeChange(finalDateTime); // Informamos al componente padre de la fecha y hora completas
    }
  };

  return (
    <Stack>
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        minDate={new Date()} // No se pueden elegir días pasados
      />

      <Stack mt="lg">
        <Title order={4}>Selecciona una hora</Title>
        {loading && <Center><Loader /></Center>}
        {error && <Text c="red">{error}</Text>}
        
        {!loading && !error && availableSlots.length === 0 && (
          <Text c="dimmed">No hay huecos disponibles para este día.</Text>
        )}

        {!loading && !error && availableSlots.length > 0 && (
          <SimpleGrid cols={{ base: 3, sm: 4 }}>
            {availableSlots.map((slot) => (
              <Button
                key={slot}
                variant={selectedSlot === slot ? 'filled' : 'outline'}
                onClick={() => handleSlotSelect(slot)}
              >
                {slot}
              </Button>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
}