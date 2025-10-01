// File: /apps/client/src/lib/apiClient.ts

import axios from 'axios';

// Creamos una instancia de Axios con una configuración base.
// Todas las llamadas que hagamos usando 'apiClient' partirán de esta URL.
const apiClient = axios.create({
  // La URL base de nuestra API de backend.
  // Para un proyecto en producción, esto vendría de una variable de entorno,
  // pero para el desarrollo local, esta configuración es perfecta.
  baseURL: 'http://localhost:3001/api',

  // Opcional: un tiempo de espera de 10 segundos para las peticiones.
  timeout: 10000,

  // Opcional: encabezados por defecto que se enviarán con cada petición.
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;