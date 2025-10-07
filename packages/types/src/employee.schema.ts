// File: /packages/types/src/employee.schema.ts (ACTUALIZADO)

import { z } from 'zod';

// Esquema para la creación/edición de un nuevo empleado
export const createEmployeeSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }).min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),

  email: z.string().min(1, { message: 'El email es requerido.' }).email({ message: 'El formato del email no es válido.' }),

  role: z.enum(['ADMIN', 'EMPLOYEE']),

  bio: z.string().optional(),

  imageUrl: z
    .string()
    .url({ message: 'La URL de la imagen no es válida.' })
    .or(z.literal(''))
    .optional(),
  
  // --- LÍNEA AÑADIDA ---
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  
  workSchedule: z.record(z.string(), z.unknown()).optional(),
});