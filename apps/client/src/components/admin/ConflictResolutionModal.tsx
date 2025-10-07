// File: /apps/client/src/components/admin/ConflictResolutionModal.tsx (NUEVO ARCHIVO)

import { Modal, Text, Alert, List, ThemeIcon, Button, Group } from '@mantine/core';
import { IconAlertTriangle, IconCalendarEvent } from '@tabler/icons-react';
import dayjs from 'dayjs';

// Definimos un tipo para las citas en conflicto que recibiremos de la API
interface Conflict {
  id: string;
  startTime: string;
  user: {
    name: string | null;
  };
}

interface ConflictResolutionModalProps {
  opened: boolean;
  onClose: () => void;
  conflicts: Conflict[];
}

export function ConflictResolutionModal({ opened, onClose, conflicts }: ConflictResolutionModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Conflicto de Citas"
      centered
      size="lg"
    >
      <Alert
        variant="light"
        color="orange"
        title="Acción Requerida"
        icon={<IconAlertTriangle />}
        mb="md"
      >
        No se puede programar la ausencia porque entra en conflicto con las siguientes {conflicts.length} citas ya existentes. Debes cancelarlas o reasignarlas manualmente antes de poder registrar la ausencia.
      </Alert>

      <Text fw={500} mb="xs">Citas en conflicto:</Text>
      <List
        spacing="xs"
        size="sm"
        center
        icon={
          <ThemeIcon color="orange" size={24} radius="xl">
            <IconCalendarEvent size={16} />
          </ThemeIcon>
        }
      >
        {conflicts.map((conflict) => (
          <List.Item key={conflict.id}>
            {dayjs(conflict.startTime).format('DD/MM/YYYY [a las] HH:mm')} - Cliente: <strong>{conflict.user.name || 'N/A'}</strong>
          </List.Item>
        ))}
      </List>
      
      <Group justify="flex-end" mt="xl">
        <Button variant="outline" onClick={onClose}>
          Entendido
        </Button>
      </Group>

    </Modal>
  );
}