// File: /apps/client/src/lib/apiClient.ts

import axios from 'axios';

// Declara el objeto window para que TypeScript no se queje
declare global {
  interface Window {
    runtimeConfig?: {
      VITE_API_BASE_URL?: string;
    };
  }
}

const baseURL = window.runtimeConfig?.VITE_API_BASE_URL?.startsWith('http')
  ? window.runtimeConfig.VITE_API_BASE_URL
  : 'http://localhost:3001/api';

console.log('API Base URL en uso:', baseURL);

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;