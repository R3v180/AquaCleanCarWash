// File: /apps/client/src/pages/admin/ReviewsManagementPage.tsx (NUEVO ARCHIVO)

import { useEffect, useState } from 'react';
import { Title, Table, Group, Badge, ActionIcon, SegmentedControl, Text, LoadingOverlay, Alert } from '@mantine/core';
import { IconCheck, IconEyeOff } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import apiClient from '../../lib/apiClient';

// Definimos los tipos de datos que esperamos de la API
type ReviewStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  employeeName: string;
  customerName: string | null;
  serviceName: string;
}

const statusColors: Record<ReviewStatus, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  HIDDEN: 'gray',
};

export function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('PENDING');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Review[]>('/reviews/admin');
      setReviews(response.data);
    } catch (err) {
      setError('No se pudieron cargar las valoraciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      await apiClient.put(`/reviews/admin/${reviewId}`, { status: newStatus });
      notifications.show({
        title: 'Estado actualizado',
        message: `La valoración ha sido marcada como ${newStatus === 'APPROVED' ? 'Aprobada' : 'Oculta'}.`,
        color: 'blue',
      });
      // Actualizamos el estado localmente para una respuesta instantánea en la UI
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId ? { ...review, status: newStatus } : review
        )
      );
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado de la valoración.',
        color: 'red',
      });
    }
  };

  const filteredReviews = reviews.filter(review => review.status === statusFilter);

  return (
    <div>
      <Title order={2} mb="xl">
        Gestión de Valoraciones
      </Title>

      <SegmentedControl
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as ReviewStatus)}
        data={[
          { label: 'Pendientes', value: 'PENDING' },
          { label: 'Aprobadas', value: 'APPROVED' },
          { label: 'Ocultas', value: 'HIDDEN' },
        ]}
        mb="lg"
      />

      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        {error && <Alert color="red" title="Error">{error}</Alert>}
        
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Puntuación</Table.Th>
              <Table.Th>Comentario</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <Table.Tr key={review.id}>
                  <Table.Td>{review.customerName || 'N/A'}</Table.Td>
                  <Table.Td>{'⭐'.repeat(review.rating)}</Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={3}>{review.comment || 'Sin comentario.'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColors[review.status]}>{review.status}</Badge>
                  </Table.Td>
                  <Table.Td>{dayjs(review.createdAt).format('DD/MM/YYYY')}</Table.Td>
                  <Table.Td>
                    {review.status === 'PENDING' && (
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handleUpdateStatus(review.id, 'APPROVED')}
                          title="Aprobar"
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="gray"
                          onClick={() => handleUpdateStatus(review.id, 'HIDDEN')}
                          title="Ocultar"
                        >
                          <IconEyeOff size={16} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="lg">
                    No hay valoraciones en esta categoría.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}