// File: /apps/client/src/pages/public/RegisterPage.tsx (ADAPTADO A VERIFICACIÓN DE EMAIL)

import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Text,
  LoadingOverlay,
  Stack,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import apiClient from '../../lib/apiClient';

const registerSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    email: z.string().email({ message: 'Introduce un email válido.' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });


export function RegisterPage() {
  const navigate = useNavigate();

  const form = useForm({
    validate: zodResolver(registerSchema),
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // --- LÓGICA DE SUBMIT COMPLETAMENTE REESCRITA ---
  const handleSubmit = async (values: typeof form.values) => {
    try {
      const { confirmPassword, ...payload } = values;
      await apiClient.post('/customer/register', payload);

      notifications.show({
        title: '¡Ya casi está!',
        message: 'Hemos enviado un enlace de activación a tu correo electrónico.',
        color: 'blue',
      });

      // Redirigimos a una página informativa pasando el email del usuario
      navigate('/check-your-email', { state: { email: values.email } });

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ha ocurrido un error inesperado.';
      notifications.show({
        title: 'Error en el registro',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Crea tu Cuenta</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        ¿Ya tienes una?{' '}
        <Anchor component={Link} to="/login" size="sm">
          Inicia sesión aquí
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={form.submitting} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack gap="md">
          <TextInput
            label="Nombre Completo"
            placeholder="Tu nombre y apellido"
            required
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Email"
            placeholder="tu@email.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            required
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirmar Contraseña"
            placeholder="Repite la contraseña"
            required
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="xl" type="submit">
            Crear Cuenta
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}