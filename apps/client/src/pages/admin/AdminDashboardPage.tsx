// File: /apps/client/src/pages/admin/AdminDashboardPage.tsx (CON GRÁFICO DE BARRAS)

import { useEffect, useState } from 'react';
import { Title, Text, SimpleGrid, Paper, Group, ThemeIcon, LoadingOverlay, Alert } from '@mantine/core';
import { BarChart } from '@mantine/charts'; // <-- 1. IMPORTAMOS EL GRÁFICO
import { IconCalendar, IconCash, IconUserPlus, IconUserExclamation } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

interface KpiData {
  appointmentsToday: number;
  potentialRevenueToday: number;
  newCustomersThisMonth: number;
  noShowRateThisMonth: number;
}

// Interfaz para los datos del gráfico
interface ChartData {
  date: string;
  Citas: number;
}

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  color: string;
}

function StatsCard({ icon, title, value, description, color }: StatsCardProps) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{title}</Text>
        <ThemeIcon color={color} variant="light" size={38} radius="md">{icon}</ThemeIcon>
      </Group>
      <Group align="flex-end" gap="xs" mt={25}>
        <Text fz={38} fw={800} lh={1}>{value}</Text>
      </Group>
      <Text fz="sm" c="dimmed" mt={7}>{description}</Text>
    </Paper>
  );
}


export function AdminDashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]); // <-- 2. NUEVO ESTADO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 3. LLAMADAS EN PARALELO ---
        const [kpisResponse, chartResponse] = await Promise.all([
          apiClient.get<KpiData>('/admin/dashboard/kpis'),
          apiClient.get<ChartData[]>('/admin/dashboard/charts/bookings-over-time')
        ]);
        setKpis(kpisResponse.data);
        setChartData(chartResponse.data);
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <Title order={2} mb="xl">Dashboard Principal</Title>
      
      {error && <Alert color="red" title="Error">{error}</Alert>}
      
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        {kpis && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
            <StatsCard icon={<IconCalendar size={24} />} title="Citas para Hoy" value={kpis.appointmentsToday.toString()} description="Citas con estado 'Confirmada'" color="blue" />
            <StatsCard icon={<IconCash size={24} />} title="Ingresos Potenciales Hoy" value={`${kpis.potentialRevenueToday.toFixed(2)}€`} description="Suma del precio de los servicios de hoy" color="green" />
            <StatsCard icon={<IconUserPlus size={24} />} title="Nuevos Clientes" value={kpis.newCustomersThisMonth.toString()} description="Clientes registrados este mes" color="teal" />
            <StatsCard icon={<IconUserExclamation size={24} />} title="Tasa de No-Shows" value={`${kpis.noShowRateThisMonth.toFixed(1)}%`} description="Porcentaje de ausencias este mes" color="orange" />
          </SimpleGrid>
        )}

        {/* --- 4. RENDERIZADO DEL GRÁFICO --- */}
        {!loading && chartData.length > 0 && (
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="md">Citas en los Últimos 7 Días</Title>
            <BarChart
              h={300}
              data={chartData}
              dataKey="date"
              series={[{ name: 'Citas', color: 'blue.6' }]}
              tickLine="y"
              yAxisProps={{ width: 30 }}
            />
          </Paper>
        )}
      </div>
    </div>
  );
}