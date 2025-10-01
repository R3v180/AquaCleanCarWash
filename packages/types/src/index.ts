// File: /packages/types/src/index.ts (ACTUALIZADO)

// Exportamos los esquemas desde su nueva ubicación local
export * from './service.schema';
export * from './employee.schema'; // <-- LÍNEA AÑADIDA

// Exportamos las interfaces de tipos
export * from './service';

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: 'ADMIN' | 'CUSTOMER';
}