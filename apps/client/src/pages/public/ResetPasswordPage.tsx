// File: /apps/client/src/pages/public/ResetPasswordPage.tsx (NUEVO ARCHIVO)

import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import {
  Container,
  Title,
  Paper,
  PasswordInput,
  Button,
  Text,
  LoadingOverlay,
  Stack,
  Alert,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

// Esquema de validación para el formulario
const resetPasswordSchema = z.object({
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm({
    validate: zodResolver(resetPasswordSchema),
    initialValues: { password: '', confirmPassword: '' },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) return; // Doble seguridad

    try {
      const { confirmPassword, ...payload } = values;
      await apiClient.post('/customer/reset-password', {
        ...payload,
        token,
      });

      notifications.show({
        title: '¡Éxito!',
        message: 'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con la nueva.',
        color: 'green',
      });

      navigate('/login');

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'No se pudo restablecer la contraseña.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  // Si no hay token en la URL, mostramos un error
  if (!token) {
    return (
      <Container size="sm" my={40}>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Enlace no válido" color="red">
          El enlace para restablecer la contraseña parece ser incorrecto o ha expirado. Por favor,{' '}
          <Anchor component={Link} to="/forgot-password">solicita uno nuevo</Anchor>.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center">Elige una Nueva Contraseña</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Asegúrate de que sea segura y fácil de recordar.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={form.submitting} />
        <Stack>
          <PasswordInput
            label="Nueva Contraseña"
            placeholder="Mínimo 8 caracteres"
            required
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirmar Nueva Contraseña"
            placeholder="Repite la contraseña"
            required
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="md" type="submit">
            Guardar Nueva Contraseña
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}