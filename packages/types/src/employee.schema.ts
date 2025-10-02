import { z } from 'zod';

// Esquema para la creación de un nuevo empleado
export const createEmployeeSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }).min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),

  email: z.string().min(1, { message: 'El email es requerido.' }).email({ message: 'El formato del email no es válido.' }),

  role: z.enum(['ADMIN', 'EMPLOYEE']),

  bio: z.string().optional(),

  // --- LÍNEA CORREGIDA ---
  // Ahora permitimos una URL válida O una cadena de texto vacía.
  // El .optional() final se asegura de que si el campo no se envía, también sea válido.
  imageUrl: z
    .string()
    .url({ message: 'La URL de la imagen no es válida.' })
    .or(z.literal(''))
    .optional(),
  
  workSchedule: z.record(z.string(), z.unknown()).optional(),
});