// File: /apps/client/src/pages/public/CheckEmailPage.tsx (NUEVO ARCHIVO)

import { useLocation, Link } from 'react-router-dom';
import { Container, Title, Text, Paper, ThemeIcon, Center } from '@mantine/core';
import { IconMailCheck } from '@tabler/icons-react';

export function CheckEmailPage() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <Container size="sm" my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Center>
          <ThemeIcon size={80} radius={80} variant="light">
            <IconMailCheck size={50} />
          </ThemeIcon>
        </Center>

        <Title ta="center" mt="xl">
          Revisa tu bandeja de entrada
        </Title>
        <Text c="dimmed" size="lg" ta="center" mt="md">
          Hemos enviado un enlace de activación a
        </Text>
        <Text ta="center" size="lg" fw={700}>
          {email || 'tu correo electrónico'}
        </Text>
        <Text c="dimmed" ta="center" mt="md">
          Haz clic en el enlace para completar tu registro. Si no lo encuentras, revisa tu carpeta de spam.
        </Text>
        <Text c="dimmed" size="sm" ta="center" mt="xl">
          ¿Ya has activado tu cuenta? <Link to="/login">Inicia sesión aquí</Link>.
        </Text>
      </Paper>
    </Container>
  );
}