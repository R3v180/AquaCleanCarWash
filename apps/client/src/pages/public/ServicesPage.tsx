import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Button,
  SimpleGrid,
  Group,
  Badge,
} from '@mantine/core';
import apiClient from '../../lib/apiClient';
import type { Service } from '@aquaclean/types';

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Service[]>('/services');
        setServices(response.data);
      } catch (err) {
        setError('No se pudieron cargar los servicios. Por favor, inténtalo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <Container><Text>Cargando servicios...</Text></Container>;
  }

  if (error) {
    return <Container><Text c="red">{error}</Text></Container>;
  }

  return (
    <Container py="xl">
      <Title order={2} ta="center" mb="lg">
        Nuestros Servicios
      </Title>
      <Text ta="center" c="dimmed" mb="xl">
        Elige el tratamiento perfecto para tu vehículo. Ofrecemos desde lavados rápidos hasta detallados completos con la máxima calidad.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {services.map((service) => (
          <Card shadow="sm" padding="lg" radius="md" withBorder key={service.id}>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>{service.name}</Text>
              <Badge color="pink">{service.category}</Badge>
            </Group>

            <Text size="sm" c="dimmed" style={{ minHeight: 60 }}>
              {service.description.substring(0, 100)}...
            </Text>
            
            <Text size="sm" c="dimmed" mt="sm">
              Duración estimada: {service.duration} min.
            </Text>

            <Button color="blue" fullWidth mt="md" radius="md">
              Reservar Ahora
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}