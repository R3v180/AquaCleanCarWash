// File: /apps/client/src/pages/public/RegisterPage.tsx (VERSIÓN COMPLETA)

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

// Esquema de validación para el formulario de registro
const registerSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    email: z.string().email({ message: 'Introduce un email válido.' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'], // Indica qué campo mostrará el error
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

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // No enviamos confirmPassword a la API
      const { confirmPassword, ...payload } = values;
      const response = await apiClient.post('/customer/register', payload);

      // El backend ya nos devuelve el token, así que iniciamos sesión directamente
      localStorage.setItem('customerAuthToken', response.data.token);
      localStorage.setItem('customerInfo', JSON.stringify(response.data.user));

      notifications.show({
        title: `¡Bienvenido, ${response.data.user.name}!`,
        message: 'Tu cuenta ha sido creada con éxito.',
        color: 'green',
      });

      // Redirigimos al panel de cliente
      navigate('/dashboard');

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