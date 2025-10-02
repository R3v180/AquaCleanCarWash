// File: /apps/client/src/pages/public/ServicesPage.tsx (ACTUALIZADO)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- LÍNEA AÑADIDA
import {
  Container,
  Title,
  Text,
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
  const navigate = useNavigate(); // <-- LÍNEA AÑADIDA

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

  // --- FUNCIÓN AÑADIDA ---
  // Esta función se ejecutará cuando el cliente haga clic en "Reservar Ahora".
  // Navegará a la página de booking, pasando los datos del servicio en la URL.
  const handleReserveClick = (service: Service) => {
    navigate(`/booking?serviceId=${service.id}&duration=${service.duration}`);
  };
  // --- FIN DE LA FUNCIÓN AÑADIDA ---

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

            {/* --- LÍNEA MODIFICADA --- */}
            <Button
              color="blue"
              fullWidth
              mt="md"
              radius="md"
              onClick={() => handleReserveClick(service)} // <-- Se añade el evento onClick
            >
              Reservar Ahora
            </Button>
            {/* --- FIN DE LA MODIFICACIÓN --- */}
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}