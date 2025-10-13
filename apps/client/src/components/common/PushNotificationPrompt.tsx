// File: /apps/client/src/components/common/PushNotificationPrompt.tsx (CORREGIDO)

import { useEffect, useState } from 'react';
import { Alert, Button, Group, Text, Loader } from '@mantine/core';
import { IconBellRinging, IconX } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

// Función auxiliar estándar para convertir la VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscriptionStatus = () => {
      // 1. Comprobar si el navegador es compatible y si el usuario está logueado
      const isPushSupported = 'PushManager' in window;
      const isLoggedIn = !!localStorage.getItem('customerAuthToken');
      if (!isPushSupported || !isLoggedIn) {
        return;
      }

      // 2. Comprobar si ya hemos preguntado en esta sesión
      const hasDismissed = sessionStorage.getItem('pushPromptDismissed');
      if (hasDismissed) {
        return;
      }

      // 3. Comprobar el estado actual del permiso
      if (Notification.permission === 'default') {
        setShowPrompt(true);
      }
    };

    // Esperamos un poco para no ser intrusivos al cargar la página
    const timer = setTimeout(checkSubscriptionStatus, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('pushPromptDismissed', 'true');
    setShowPrompt(false);
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      // Pedimos permiso al usuario
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('El permiso para las notificaciones no fue concedido.');
      }

      // Obtenemos el service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Obtenemos la VAPID key del backend
      const vapidKeyResponse = await apiClient.get<{ publicKey: string }>('/push/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(vapidKeyResponse.data.publicKey);

      // Creamos la suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Enviamos la suscripción al backend para guardarla
      await apiClient.post('/push/subscribe', subscription);
      
      setShowPrompt(false);

    } catch (err) {
      console.error('Error al suscribirse a las notificaciones push:', err);
      setError('No se pudo activar las notificaciones. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsSubscribing(false);
    }
  };


  if (!showPrompt) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 1000 }}>
      <Alert
        icon={<IconBellRinging size={24} />}
        title="¡No te pierdas tus citas!"
        color="blue"
        withCloseButton
        onClose={handleDismiss}
        closeButtonLabel="Descartar" // <-- LÍNEA CORREGIDA
      >
        <Text size="sm">
          Activa las notificaciones para recibir recordatorios gratuitos de tus próximas citas directamente en tu dispositivo.
        </Text>
        {error && <Text color="red" size="xs" mt="sm">{error}</Text>}
        <Group justify="flex-end" mt="md">
          <Button variant="outline" size="xs" onClick={handleDismiss}>
            Más tarde
          </Button>
          <Button
            variant="filled"
            size="xs"
            onClick={handleSubscribe}
            loading={isSubscribing}
          >
            Activar Notificaciones
          </Button>
        </Group>
      </Alert>
    </div>
  );
}