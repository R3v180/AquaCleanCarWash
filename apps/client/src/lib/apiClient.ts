// File: /apps/client/src/lib/apiClient.ts (ACTUALIZADO CON INTERCEPTOR DE AUTH)

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR AÑADIDO ---
// Este código se ejecuta en CADA petición que se hace con apiClient
apiClient.interceptors.request.use(
  (config) => {
    // Buscamos el token del cliente. Podríamos añadir lógica para el token de admin también.
    const token = localStorage.getItem('customerAuthToken');
    
    if (token) {
      // Si el token existe, lo añadimos a la cabecera de la petición
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Manejar errores de la configuración de la petición
    return Promise.reject(error);
  }
);

export default apiClient;