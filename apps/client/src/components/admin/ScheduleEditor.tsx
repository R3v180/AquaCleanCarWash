// File: /apps/client/src/components/admin/ScheduleEditor.tsx (CORREGIDO)

import { Button, Group, ActionIcon, Stack, Text, Box } from '@mantine/core';
import { TimeInput } from '@mantine/dates'; // <-- IMPORTACIÓN CORREGIDA
import { IconPlus, IconTrash } from '@tabler/icons-react';

type Shift = { start: string; end: string };
export type WeeklySchedule = {
  [key: string]: Shift[];
};

interface ScheduleEditorProps {
  value: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: { [key: string]: string } = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  
  const handleTimeChange = (day: string, shiftIndex: number, field: 'start' | 'end', time: string) => {
    const newSchedule = { ...value };
    if (newSchedule[day]?.[shiftIndex]) {
      newSchedule[day]![shiftIndex]![field] = time;
      onChange(newSchedule);
    }
  };

  const addShift = (day: string) => {
    const newSchedule = { ...value };
    if (!newSchedule[day]) {
      newSchedule[day] = [];
    }
    newSchedule[day]!.push({ start: '09:00', end: '17:00' });
    onChange(newSchedule);
  };

  const removeShift = (day: string, shiftIndex: number) => {
    const newSchedule = { ...value };
    newSchedule[day]?.splice(shiftIndex, 1);
    onChange(newSchedule);
  };

  return (
    <Stack gap="xl">
      {DAYS_OF_WEEK.map((day) => (
        <Box key={day}>
          <Text fw={500} tt="capitalize">{DAY_LABELS[day]}</Text>
          <Stack gap="xs" mt="xs">
            {value[day]?.map((shift, index) => (
              <Group key={index} grow>
                <TimeInput
                  label="Inicio"
                  value={shift.start}
                  // --- LÍNEA CORREGIDA ---
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(day, index, 'start', e.currentTarget.value)}
                />
                <TimeInput
                  label="Fin"
                  value={shift.end}
                  // --- LÍNEA CORREGIDA ---
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(day, index, 'end', e.currentTarget.value)}
                />
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={() => removeShift(day, index)}
                  style={{ marginTop: 25 }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
             <Button
                leftSection={<IconPlus size={14} />}
                variant="light"
                onClick={() => addShift(day)}
                fullWidth
             >
                Añadir Turno
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}