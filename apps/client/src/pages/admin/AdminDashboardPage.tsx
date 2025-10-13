// File: /apps/client/src/pages/admin/AdminDashboardPage.tsx (CON CORRECCIÓN DE TIPO)

import { useEffect, useState } from 'react';
import { Title, Text, SimpleGrid, Paper, Group, ThemeIcon, LoadingOverlay, Alert } from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import { IconCalendar, IconCash, IconUserPlus, IconUserExclamation } from '@tabler/icons-react';
import apiClient from '../../lib/apiClient';

interface KpiData {
  appointmentsToday: number;
  potentialRevenueToday: number;
  newCustomersThisMonth: number;
  noShowRateThisMonth: number;
}
interface BookingsChartData {
  date: string;
  Citas: number;
}
interface PopularServiceChartData {
  name: string;
  count: number;
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
  const [bookingsChartData, setBookingsChartData] = useState<BookingsChartData[]>([]);
  const [popularServicesData, setPopularServicesData] = useState<{ name: string; value: number; color: string; }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisResponse, bookingsChartResponse, popularServicesResponse] = await Promise.all([
          apiClient.get<KpiData>('/admin/dashboard/kpis'),
          apiClient.get<BookingsChartData[]>('/admin/dashboard/charts/bookings-over-time'),
          apiClient.get<PopularServiceChartData[]>('/admin/dashboard/charts/popular-services')
        ]);
        
        setKpis(kpisResponse.data);
        setBookingsChartData(bookingsChartResponse.data);
        
        const colors = ['blue.6', 'grape.6', 'teal.6', 'orange.6', 'indigo.6'];
        const transformedData = popularServicesResponse.data.map((item, index) => ({
          name: item.name,
          value: item.count,
          // --- LÍNEA CORREGIDA ---
          // Añadimos un color por defecto para satisfacer la estrictez de TypeScript
          color: colors[index % colors.length] ?? 'gray.6',
        }));
        setPopularServicesData(transformedData);

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

        {!loading && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} mt="xl">
                {bookingsChartData.length > 0 && (
                    <Paper withBorder p="md" radius="md">
                        <Title order={5} mb="md">Citas en los Últimos 7 Días</Title>
                        <BarChart
                        h={300}
                        data={bookingsChartData}
                        dataKey="date"
                        series={[{ name: 'Citas', color: 'blue.6' }]}
                        tickLine="y"
                        yAxisProps={{ width: 30 }}
                        />
                    </Paper>
                )}

                {popularServicesData.length > 0 && (
                    <Paper withBorder p="md" radius="md">
                        <Title order={5} mb="md">Top 5 Servicios Completados</Title>
                        <DonutChart 
                            h={300} 
                            data={popularServicesData} 
                            tooltipDataSource="segment"
                            chartLabel={`${popularServicesData.reduce((acc, item) => acc + item.value, 0)} Total`}
                        />
                    </Paper>
                )}
            </SimpleGrid>
        )}
      </div>
    </div>
  );
}