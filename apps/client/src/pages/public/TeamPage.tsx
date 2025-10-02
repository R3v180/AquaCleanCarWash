// File: /apps/client/src/pages/public/TeamPage.tsx (NUEVO ARCHIVO)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Avatar,
  Button,
  Loader,
  Center,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

// Definimos un tipo local para los datos que esperamos de la API.
// Esto nos da autocompletado y seguridad de tipos.
interface TeamMember {
  id: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  bio?: string;
  imageUrl?: string;
}

export function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await apiClient.get<TeamMember[]>('/employees');
        // Por ahora, mostramos a todos. En el futuro, podríamos filtrar por rol.
        setTeam(response.data);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('No se pudo cargar la información del equipo. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) {
    return <Center style={{ height: 300 }}><Loader /></Center>;
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  return (
    <Container py="xl">
      <Title order={2} ta="center">
        Conoce a Nuestro Equipo
      </Title>
      <Text c="dimmed" ta="center" mt="sm" mb="xl">
        Profesionales apasionados por el cuidado de tu vehículo, listos para ofrecerte el mejor servicio.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {team.map((member) => (
          <Card key={member.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Center>
              <Avatar src={member.imageUrl} size={120} radius="xl" alt={member.name} />
            </Center>
            <Text ta="center" fw={500} fz="lg" mt="md">
              {member.name}
            </Text>
            <Text ta="center" c="dimmed" fz="sm">
              {member.role === 'ADMIN' ? 'Gerente de Operaciones' : 'Especialista en Detallado'}
            </Text>
            <Text ta="center" fz="sm" mt="sm" style={{ minHeight: 60 }}>
              {member.bio || 'Comprometido con la excelencia y la satisfacción del cliente.'}
            </Text>
            <Button
              variant="light"
              fullWidth
              mt="md"
              radius="md"
              onClick={() => navigate('/services')}
            >
              Ver Servicios
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}