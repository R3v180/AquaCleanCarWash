// ====== [26] apps/client/src/main.tsx ======
// File: /apps/client/src/main.tsx (CON REGISTRO DEL SERVICE WORKER)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useRegisterSW } from 'virtual:pwa-register/react'; // --- IMPORTACIÓN AÑADIDA ---
import App from './App';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

// --- COMPONENTE WRAPPER AÑADIDO ---
function Main() {
  // Este hook se encarga de registrar el Service Worker y manejar las actualizaciones.
  useRegisterSW({
    onNeedRefresh() {
      // Opcional: podrías mostrar una notificación para que el usuario recargue
      console.log('Nueva versión disponible. Recarga la página para actualizar.');
    },
    onOfflineReady() {
      // Opcional: informa al usuario que la app ya puede funcionar sin conexión
      console.log('La aplicación está lista para funcionar sin conexión.');
    },
  });

  return <App />;
}
// --- FIN DEL COMPONENTE WRAPPER ---


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <Notifications />
      <BrowserRouter>
        {/* --- USAMOS EL NUEVO COMPONENTE --- */}
        <Main />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);