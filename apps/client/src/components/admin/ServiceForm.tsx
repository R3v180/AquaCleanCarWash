// File: /apps/client/src/components/admin/ServiceForm.tsx (CORREGIDO)

import { useEffect } from 'react';
import { TextInput, Textarea, NumberInput, Button, Group, Stack, Switch } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { createServiceSchema } from '@aquaclean/types';
import type { Service } from '@aquaclean/types';

interface ServiceFormProps {
  initialData?: Partial<Service>; 
  onSuccess: (service: Partial<Service>) => void; // Aceptamos un servicio parcial
  onClose: () => void;
  isSubmitting: boolean;
}

export function ServiceForm({ initialData, onSuccess, onClose, isSubmitting }: ServiceFormProps) {
  
  const form = useForm({
    validate: zodResolver(createServiceSchema),
    initialValues: {
      name: '',
      description: '',
      duration: 60,
      prices: { standard: 50 },
      category: 'General',
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.setValues(initialData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // --- LÓGICA CORREGIDA ---
  const handleSubmit = (values: typeof form.values) => {
    // Fusionamos los datos iniciales (que contienen el ID) con los nuevos valores del formulario.
    // Esto asegura que al editar, no perdamos el ID del servicio.
    const finalData = { ...initialData, ...values };
    onSuccess(finalData); 
  };
  // --- FIN DE LA CORRECCIÓN ---

  const isEditMode = Boolean(initialData?.id);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Nombre del Servicio" {...form.getInputProps('name')} withAsterisk />
        <Textarea label="Descripción" {...form.getInputProps('description')} withAsterisk />
        <NumberInput label="Duración (minutos)" {...form.getInputProps('duration')} withAsterisk />
        <NumberInput label="Precio Estándar (€)" {...form.getInputProps('prices.standard')} withAsterisk />
        <TextInput label="Categoría" {...form.getInputProps('category')} withAsterisk />
        <Switch 
          label="Servicio Activo"
          description="Si está inactivo, no se podrá seleccionar para nuevas reservas."
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />
        
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? 'Guardar Cambios' : 'Crear Servicio'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}