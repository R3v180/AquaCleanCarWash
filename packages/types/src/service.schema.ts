// File: /packages/types/src/service.schema.ts (ACTUALIZADO)

import { z } from 'zod';

// Definimos el esquema de validación para la creación/edición de un servicio.
export const createServiceSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }).min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),

  description: z.string().min(1, { message: 'La descripción es requerida.' }).min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),

  duration: z.coerce.number()
    .int({ message: 'La duración debe ser un número entero.' })
    .positive({ message: 'La duración debe ser un número positivo.' }),

  prices: z.record(z.string(), z.number()).refine(obj => Object.keys(obj).length > 0, {
    message: 'Se requiere al menos un precio.',
  }),
  
  category: z.string().min(1, { message: 'La categoría es requerida.' }),

  // --- LÍNEA AÑADIDA ---
  isActive: z.boolean().optional(),

  isAddon: z.boolean().optional(),
  isGiftable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});