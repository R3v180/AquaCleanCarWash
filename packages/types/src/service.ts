// File: /packages/types/src/service.ts

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // en minutos
  prices: Record<string, number>;
  category: string;
  isAddon: boolean;
  isGiftable: boolean;
  isFeatured: boolean;
}