// File: /packages/types/src/service.ts (ACTUALIZADO)

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // en minutos
  // --- LÍNEA MODIFICADA ---
  prices: {
    standard: number;
    // Podemos añadir más tipos de precios en el futuro si es necesario
    [key: string]: number; 
  };
  // --- FIN DE LA MODIFICACIÓN ---
  category: string;
  isActive: boolean;
  isAddon: boolean;
  isGiftable: boolean;
  isFeatured: boolean;
}