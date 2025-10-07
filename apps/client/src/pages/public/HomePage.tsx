// File: /apps/client/src/pages/public/HomePage.tsx (ACTUALIZADO)

import { Title, Text, Button, Container, SimpleGrid, ThemeIcon, Stack } from '@mantine/core';
import { IconTruck, IconCertificate, IconCalendarStats } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import classes from './HomePage.module.css';

function Feature({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <Stack align="center" ta="center">
      <ThemeIcon variant="light" size={60} radius="md">
        <Icon size={30} />
      </ThemeIcon>
      <Text fw={700} fz="lg" mt="sm">{title}</Text>
      <Text c="dimmed" fz="sm">{description}</Text>
    </Stack>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className={classes.hero}>
        <div className={classes.overlay} />
        <Container className={classes.heroContent} size="lg">
          <Title className={classes.heroTitle}>La Excelencia en Cada Detalle</Title>
          <Text className={classes.heroDescription} c="white" size="xl" mt="xl">
            Tu vehículo merece el mejor cuidado. Descubre nuestros servicios de detallado premium y devuélvele el brillo que se merece.
          </Text>
          <Button
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            size="xl"
            radius="xl"
            className={classes.heroButton}
            // --- LÍNEA MODIFICADA ---
            onClick={() => navigate('/booking')}
          >
            Reservar Ahora
          </Button>
        </Container>
      </div>

      <Container py="xl" mt="xl">
        <Title order={2} ta="center" mb="xl">
          ¿Por Qué Elegir AquaClean?
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
          <Feature
            icon={IconCertificate}
            title="Productos de Alta Calidad"
            description="Utilizamos solo los mejores productos del mercado, seguros para tu coche y para el medio ambiente."
          />
          <Feature
            icon={IconTruck}
            title="Atención al Detalle"
            description="Nuestros técnicos especializados tratan cada vehículo como si fuera propio, garantizando un acabado impecable."
          />
          <Feature
            icon={IconCalendarStats}
            title="Reservas Fáciles 24/7"
            description="Elige tu servicio y reserva tu cita en menos de 2 minutos con nuestro sistema de reservas online."
          />
        </SimpleGrid>
      </Container>
      
      <Container py="xl" ta="center">
         <Title order={3}>¿Listo para que tu coche luzca como nuevo?</Title>
         <Text c="dimmed" mt="sm" mb="lg">
           No esperes más. Encuentra el servicio perfecto y agenda tu cita hoy mismo.
         </Text>
         {/* --- LÍNEA MODIFICADA --- */}
         <Button size="lg" onClick={() => navigate('/booking')}>
           Reservar Mi Cita Ahora
         </Button>
      </Container>
    </>
  );
}