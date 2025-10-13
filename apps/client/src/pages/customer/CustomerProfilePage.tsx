// ====== [36] apps/client/src/pages/customer/CustomerProfilePage.tsx ======
// File: /apps/client/src/pages/customer/CustomerProfilePage.tsx (CON GESTIÓN DE TELÉFONO)

import { useEffect } from 'react';
import { Title, Paper, TextInput, Button, Stack, PasswordInput, Group, Text, Input } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import apiClient from '../../lib/apiClient';

// --- ESQUEMA DE PERFIL ACTUALIZADO ---
const profileSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  phone: z.string().min(10, { message: 'Introduce un número de teléfono válido.' }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Debes introducir tu contraseña actual.' }),
    newPassword: z.string().min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden.',
    path: ['confirmPassword'],
  });

// --- INTERFAZ ACTUALIZADA ---
interface CustomerInfo {
    name?: string;
    email?: string;
    phone?: string;
}

export function CustomerProfilePage() {
    
  const profileForm = useForm({
    validate: zodResolver(profileSchema),
    initialValues: { name: '', phone: '' },
  });

  const passwordForm = useForm({
    validate: zodResolver(passwordSchema),
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    const customerInfoStr = localStorage.getItem('customerInfo');
    if (customerInfoStr) {
      const customer: CustomerInfo = JSON.parse(customerInfoStr);
      profileForm.setValues({ 
        name: customer.name || '',
        phone: customer.phone || '', // <-- LÍNEA AÑADIDA
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileSubmit = async (values: typeof profileForm.values) => {
    try {
      const response = await apiClient.put('/me/profile', values);
      
      localStorage.setItem('customerInfo', JSON.stringify(response.data));

      notifications.show({
        title: '¡Perfil Actualizado!',
        message: 'Tus datos han sido guardados correctamente.',
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
      const { confirmPassword, ...payload } = values;
      await apiClient.post('/me/change-password', payload);
      notifications.show({
        title: '¡Contraseña Cambiada!',
        message: 'Tu contraseña ha sido actualizada. La próxima vez que inicies sesión, usa la nueva.',
        color: 'green',
      });
      passwordForm.reset();
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
          {/* --- CAMPO DE TELÉFONO AÑADIDO --- */}
          <Input.Wrapper label="Teléfono" withAsterisk error={profileForm.errors.phone}>
              <PhoneInput 
                defaultCountry="es" 
                value={profileForm.values.phone} 
                onChange={(phone) => profileForm.setFieldValue('phone', phone)} 
              />
          </Input.Wrapper>
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