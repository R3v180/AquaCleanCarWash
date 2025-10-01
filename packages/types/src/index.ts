// File: /packages/types/src/index.ts - v1.0

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: 'ADMIN' | 'CUSTOMER';
}