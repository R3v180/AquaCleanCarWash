// File: /apps/client/src/pages/public/ForgotPasswordPage.tsx (CORREGIDO)

import { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  TextInput,
  Button,
  Text,
  LoadingOverlay,
  Stack,
  Anchor,
  Center,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMailCheck } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Introduce un email válido.' }),
});

export function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm({
    validate: zodResolver(forgotPasswordSchema),
    initialValues: { email: '' },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await apiClient.post('/customer/forgot-password', values);
      setSubmittedEmail(values.email);
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo procesar tu solicitud. Inténtalo de nuevo más tarde.',
        color: 'red',
      });
    }
  };

  if (submittedEmail) {
    return (
      <Container size="sm" my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Center>
            {/* --- LÍNEA CORREGIDA --- */}
            <ThemeIcon size={80} radius={80} variant="light">
              <IconMailCheck size={50} />
            </ThemeIcon>
          </Center>
          <Title ta="center" mt="xl">Revisa tu email</Title>
          <Text c="dimmed" size="lg" ta="center" mt="md">
            Si una cuenta con el email{' '}
            <Text component="span" fw={700}>{submittedEmail}</Text>{' '}
            existe, hemos enviado un enlace para restablecer la contraseña.
          </Text>
          <Center mt="xl">
            <Button component={Link} to="/login">Volver a Inicio de Sesión</Button>
          </Center>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center">Restablecer Contraseña</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Introduce tu email y te enviaremos un enlace para recuperarla.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={form.submitting} />
        <Stack>
          <TextInput
            label="Email"
            placeholder="tu@email.com"
            required
            {...form.getInputProps('email')}
          />
          <Button fullWidth mt="md" type="submit">
            Enviar Enlace de Recuperación
          </Button>
        </Stack>
      </Paper>
      <Text ta="center" mt="md">
        <Anchor component={Link} to="/login" c="dimmed" size="xs">
          Volver a Inicio de Sesión
        </Anchor>
      </Text>
    </Container>
  );
}