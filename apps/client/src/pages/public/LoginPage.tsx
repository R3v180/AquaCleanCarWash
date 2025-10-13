// File: /apps/client/src/pages/public/LoginPage.tsx (CORREGIDO)

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

// Esquema de validación del formulario (debe coincidir con el del backend)
const loginSchema = z.object({
  email: z.string().email({ message: 'Introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

export function LoginPage() {
  const navigate = useNavigate();

  const form = useForm({
    validate: zodResolver(loginSchema),
    initialValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await apiClient.post('/customer/login', values);
      
      localStorage.setItem('customerAuthToken', response.data.token);
      localStorage.setItem('customerInfo', JSON.stringify(response.data.user));

      notifications.show({
        title: `¡Bienvenido de nuevo, ${response.data.user.name}!`,
        message: 'Has iniciado sesión correctamente.',
        color: 'green',
      });
      
      navigate('/dashboard');

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ha ocurrido un error inesperado.';
      notifications.show({
        title: 'Error al iniciar sesión',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Accede a tu Cuenta</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        ¿Aún no tienes una?{' '}
        <Anchor component={Link} to="/register" size="sm">
          Crea una cuenta aquí
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={form.onSubmit(handleSubmit)}>
        {/* --- LÍNEA CORREGIDA --- */}
        <LoadingOverlay visible={form.submitting} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="tu@email.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña"
            required
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit">
            Iniciar Sesión
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}