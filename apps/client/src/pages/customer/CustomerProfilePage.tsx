// File: /apps/client/src/pages/customer/CustomerProfilePage.tsx (NUEVO ARCHIVO)

import { useEffect } from 'react';
import { Title, Paper, TextInput, Button, Stack, PasswordInput, Group, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import apiClient from '../../lib/apiClient';

// Esquema para la actualización de datos personales
const profileSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
});

// Esquema para el cambio de contraseña
const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Debes introducir tu contraseña actual.' }),
    newPassword: z.string().min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden.',
    path: ['confirmPassword'],
  });

interface CustomerInfo {
    name?: string;
    email?: string;
}

export function CustomerProfilePage() {
    
  const profileForm = useForm({
    validate: zodResolver(profileSchema),
    initialValues: { name: '' },
  });

  const passwordForm = useForm({
    validate: zodResolver(passwordSchema),
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // Cargar datos iniciales del usuario desde localStorage
  useEffect(() => {
    const customerInfoStr = localStorage.getItem('customerInfo');
    if (customerInfoStr) {
      const customer: CustomerInfo = JSON.parse(customerInfoStr);
      profileForm.setValues({ name: customer.name || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileSubmit = async (values: typeof profileForm.values) => {
    try {
      const response = await apiClient.put('/me/profile', values);
      
      // Actualizamos la información en localStorage para que se refleje en la app
      localStorage.setItem('customerInfo', JSON.stringify(response.data));

      notifications.show({
        title: '¡Perfil Actualizado!',
        message: 'Tu nombre ha sido cambiado correctamente.',
        color: 'green',
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error al actualizar',
        message: err.response?.data?.message || 'No se pudo guardar tu perfil.',
        color: 'red',
      });
    }
  };

  const handlePasswordSubmit = async (values: typeof passwordForm.values) => {
    try {
      // No enviamos confirmPassword a la API
      const { confirmPassword, ...payload } = values;
      await apiClient.post('/me/change-password', payload);
      notifications.show({
        title: '¡Contraseña Cambiada!',
        message: 'Tu contraseña ha sido actualizada. La próxima vez que inicies sesión, usa la nueva.',
        color: 'green',
      });
      passwordForm.reset(); // Limpiamos el formulario tras el éxito
    } catch (err: any) {
      notifications.show({
        title: 'Error al cambiar la contraseña',
        message: err.response?.data?.message || 'No se pudo actualizar tu contraseña.',
        color: 'red',
      });
    }
  };

  return (
    <div>
      <Title order={2} mb="xl">Mi Perfil</Title>

      <Paper withBorder shadow="md" p="lg" component="form" onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
        <Title order={4}>Datos Personales</Title>
        <Text c="dimmed" size="sm" mb="lg">Actualiza tu información de contacto.</Text>
        <Stack>
          <TextInput
            label="Nombre Completo"
            placeholder="Tu nombre y apellido"
            {...profileForm.getInputProps('name')}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={profileForm.submitting}>Guardar Cambios</Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder shadow="md" p="lg" mt="xl" component="form" onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
        <Title order={4}>Cambiar Contraseña</Title>
        <Text c="dimmed" size="sm" mb="lg">Elige una contraseña segura y no la compartas.</Text>
        <Stack>
          <PasswordInput
            label="Contraseña Actual"
            {...passwordForm.getInputProps('currentPassword')}
            required
          />
          <PasswordInput
            label="Nueva Contraseña"
            {...passwordForm.getInputProps('newPassword')}
            required
          />
          <PasswordInput
            label="Confirmar Nueva Contraseña"
            {...passwordForm.getInputProps('confirmPassword')}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={passwordForm.submitting}>Cambiar Contraseña</Button>
          </Group>
        </Stack>
      </Paper>
    </div>
  );
}