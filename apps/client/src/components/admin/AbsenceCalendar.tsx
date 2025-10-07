// File: /apps/client/src/components/admin/AbsenceCalendar.tsx (CORRECCIÓN FINAL-FINAL)

import { useState } from 'react';
// --- LÍNEA MODIFICADA ---
import { DatePickerInput } from '@mantine/dates'; 
import { Button, Group, Text, Paper, ActionIcon, Stack, Divider, Title } from '@mantine/core';
// --- FIN DE LA MODIFICACIÓN ---
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';

export interface Absence {
  id: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
}

interface AbsenceCalendarProps {
  absences: Absence[];
  onAddAbsence: (dates: [Date, Date]) => void;
  onDeleteAbsence: (absenceId: string) => void;
}

export function AbsenceCalendar({ absences, onAddAbsence, onDeleteAbsence }: AbsenceCalendarProps) {
  const [value, setValue] = useState<[Date | null, Date | null]>([null, null]);

  const handleAddAbsence = () => {
    if (value[0] && value[1]) {
      const sortedDates: [Date, Date] = [
        dayjs(value[0]).startOf('day').toDate(),
        dayjs(value[1]).endOf('day').toDate()
      ].sort((a, b) => a.getTime() - b.getTime()) as [Date, Date];
      
      onAddAbsence(sortedDates);
      setValue([null, null]);
    }
  };

  return (
    <Stack>
      <Title order={4}>Seleccionar Rango de Fechas</Title>
      
      {/* --- COMPONENTE CORREGIDO --- */}
      <DatePickerInput
        type="range"
        label="Selecciona un rango de días"
        placeholder="Desde... hasta..."
        value={value}
        onChange={setValue}
        minDate={new Date()}
        clearable // Añadimos la opción de limpiar la selección
      />
      {/* --- FIN DE LA CORRECCIÓN --- */}

      <Button
        onClick={handleAddAbsence}
        disabled={!value[0] || !value[1]}
      >
        Añadir Ausencia Programada
      </Button>

      <Divider my="md" label="Ausencias Programadas" />

      <Stack>
        {absences.length > 0 ? (
          absences.map((absence) => (
            <Paper withBorder p="xs" key={absence.id}>
              <Group justify="space-between">
                <Text size="sm">
                  Del {dayjs(absence.startDate).format('DD/MM/YYYY')} al {dayjs(absence.endDate).format('DD/MM/YYYY')}
                </Text>
                <ActionIcon color="red" variant="light" onClick={() => onDeleteAbsence(absence.id)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))
        ) : (
          <Text c="dimmed" ta="center" size="sm">
            Este empleado no tiene ausencias programadas.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}