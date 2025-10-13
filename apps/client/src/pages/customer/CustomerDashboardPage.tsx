// File: /apps/client/src/pages/customer/CustomerDashboardPage.tsx (NUEVO ARCHIVO)

import { Title, Text, Paper } from '@mantine/core';
import { useEffect, useState } from 'react';

interface CustomerInfo {
  name?: string;
}

export function CustomerDashboardPage() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    // Recuperamos la información del usuario del localStorage
    const customerInfoStr = localStorage.getItem('customerInfo');
    if (customerInfoStr) {
      setCustomer(JSON.parse(customerInfoStr));
    }
  }, []);

  return (
    <div>
      <Title order={2} mb="sm">
        Bienvenido de nuevo, {customer?.name || 'Cliente'}
      </Title>
      <Text c="dimmed" mb="xl">
        Desde aquí puedes gestionar tus citas y tu información personal.
      </Text>

      <Paper withBorder p="lg" shadow="sm">
        <Title order={4}>Resumen Rápido</Title>
        <Text mt="sm">
          (Aquí irán las próximas citas y otras notificaciones importantes...)
        </Text>
      </Paper>
    </div>
  );
}