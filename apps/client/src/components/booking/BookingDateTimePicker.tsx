// File: /apps/client/src/components/booking/BookingDateTimePicker.tsx (ACTUALIZADO)

import { useState, useEffect } from 'react';
import { DatePicker } from '@mantine/dates';
import { SimpleGrid, Button, Text, Loader, Center, Stack, Title } from '@mantine/core';
import dayjs from 'dayjs';
import apiClient from '../../lib/apiClient';

interface BookingDateTimePickerProps {
  serviceDuration: number;
  onDateTimeChange: (dateTime: Date | null) => void;
  // --- LÍNEA AÑADIDA ---
  employeeId?: string | null; 
}

export function BookingDateTimePicker({ serviceDuration, onDateTimeChange, employeeId }: BookingDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LÓGICA MODIFICADA ---
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      onDateTimeChange(null); // Reseteamos la fecha seleccionada al cambiar de día/empleado

      try {
        const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
        const response = await apiClient.get<string[]>('/availability', {
          params: {
            date: formattedDate,
            // Si hay un employeeId y no es 'any', lo enviamos. Si no, no lo incluimos.
            ...(employeeId && employeeId !== 'any' && { employeeId }),
          },
        });
        setAvailableSlots(response.data);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setError('No se pudo cargar la disponibilidad.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  // El useEffect ahora también depende de employeeId
  }, [selectedDate, employeeId, onDateTimeChange]);
  // --- FIN DE LA MODIFICACIÓN ---


  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    if (selectedDate) {
      const hours = parseInt(slot.split(':')[0] ?? '0', 10);
      const minutes = parseInt(slot.split(':')[1] ?? '0', 10);
      const finalDateTime = dayjs(selectedDate).hour(hours).minute(minutes).toDate();
      onDateTimeChange(finalDateTime);
    }
  };

  return (
    <Stack>
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        minDate={new Date()}
        weekendDays={[0]}
      />

      <Stack mt="lg">
        <Title order={4}>Selecciona una hora</Title>
        {loading && <Center><Loader /></Center>}
        {error && <Text c="red">{error}</Text>}
        
        {!loading && !error && availableSlots.length === 0 && (
          <Text c="dimmed">No hay huecos disponibles para esta selección.</Text>
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