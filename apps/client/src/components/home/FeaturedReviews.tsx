// File: /apps/client/src/components/home/FeaturedReviews.tsx (NUEVO ARCHIVO)

import { useEffect, useState } from 'react';
import { Container, Title, Text, SimpleGrid, Paper, Rating, Blockquote, Loader, Center, Alert } from '@mantine/core';
import { IconMessageCircle2 } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

// Interfaz para los datos que esperamos de la API pública
interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
}

export function FeaturedReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await apiClient.get<PublicReview[]>('/reviews');
        setReviews(response.data);
      } catch (err) {
        console.error('Error fetching public reviews:', err);
        setError('No se pudieron cargar las valoraciones en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <Center style={{ height: 200 }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert color="orange" title="Opiniones no disponibles">
          {error}
        </Alert>
      </Container>
    );
  }

  if (reviews.length === 0) {
    // No mostramos nada si no hay reseñas que mostrar
    return null;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} ta="center" mb="xs">
        La Opinión de Nuestros Clientes
      </Title>
      <Text c="dimmed" ta="center" mb="xl">
        Descubre por qué nuestros clientes confían en nosotros para el cuidado de sus vehículos.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {reviews.map((review) => (
          <Paper withBorder radius="md" p="lg" key={review.id}>
            <Rating value={review.rating} readOnly />
            <Blockquote
              color="blue"
              cite={`– ${review.customerName || 'Cliente Anónimo'}`}
              icon={<IconMessageCircle2 size={24} />}
              mt="sm"
            >
              {review.comment || '¡Un servicio excelente!'}
            </Blockquote>
          </Paper>
        ))}
      </SimpleGrid>
    </Container>
  );
}