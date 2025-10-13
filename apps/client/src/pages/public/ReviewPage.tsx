// File: /apps/client/src/pages/public/ReviewPage.tsx (CON LLAMADA A API REAL)

import { useSearchParams } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Container, Title, Text, Paper, Rating, Textarea, Button, Stack, Group, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import apiClient from '../../lib/apiClient';

const reviewSchema = z.object({
  rating: z.number().min(1, { message: 'Por favor, selecciona al menos una estrella.' }),
  comment: z.string().optional(),
});

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm({
    validate: zodResolver(reviewSchema),
    initialValues: {
      rating: 0,
      comment: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // --- CÓDIGO ACTUALIZADO: AHORA SE HACE LA LLAMADA REAL A LA API ---
      await apiClient.post('/reviews', { ...values, token });
      
      notifications.show({
        title: '¡Gracias por tu valoración!',
        message: 'Tu opinión nos ayuda a mejorar cada día.',
        color: 'green',
      });
      setSubmissionStatus('success');
    } catch (err: any) {
      notifications.show({
        title: 'Error al enviar la valoración',
        message: err.response?.data?.message || 'Ha ocurrido un error. Inténtalo de nuevo.',
        color: 'red',
      });
      setSubmissionStatus('error');
    }
  };

  if (!token) {
    return (
      <Container size="sm" my={40}>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Enlace no válido" color="red">
          El enlace para dejar la valoración parece ser incorrecto o ha expirado.
        </Alert>
      </Container>
    );
  }
  
  if (submissionStatus === 'success') {
    return (
      <Container size="sm" my={40}>
         <Paper withBorder shadow="md" p={30} radius="md" ta="center">
            <Title order={3}>¡Valoración enviada!</Title>
            <Text mt="md">Muchas gracias por tu tiempo. Tu feedback es muy valioso para nosotros.</Text>
         </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" my={40}>
      <Title ta="center">Valora tu experiencia</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Tu opinión es muy importante para nosotros.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group justify="center">
             <Rating size="xl" {...form.getInputProps('rating')} />
          </Group>
          {form.errors.rating && <Text c="red" size="xs" ta="center">{form.errors.rating}</Text>}

          <Textarea
            label="Tu comentario (opcional)"
            placeholder="¿Qué te ha parecido el servicio? ¿Hay algo que podamos mejorar?"
            autosize
            minRows={4}
            {...form.getInputProps('comment')}
          />
          <Button type="submit" mt="md" loading={form.submitting}>
            Enviar mi valoración
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}