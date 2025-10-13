// ====== [19] apps/client/src/components/common/PublicHeader.tsx ======
// File: /apps/client/src/components/common/PublicHeader.tsx (CON MENÚ HAMBURGUESA)

import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Group, Button, Image, Burger, Drawer, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './PublicHeader.module.css';

export function PublicHeader() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);

  // Función para cerrar el drawer al hacer clic en un enlace
  const handleLinkClick = (path: string) => {
    navigate(path);
    close();
  };

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Logo de AquaClean Car Wash"
          h={40}
          fit="contain"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        {/* Navegación para Escritorio */}
        <Group gap={5} visibleFrom="xs">
          <NavLink to="/" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`} end>
            Inicio
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>
            Servicios
          </NavLink>
          <NavLink to="/team" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>
            Nuestro Equipo
          </NavLink>
        </Group>
        
        {/* Botón de Reservar (Escritorio) */}
        <Button onClick={() => navigate('/booking')} visibleFrom="xs">Reservar Cita</Button>

        {/* Menú de Hamburguesa (Móvil) */}
        <Burger opened={opened} onClick={open} hiddenFrom="xs" size="sm" />
      </Container>
      
      {/* Panel Lateral Desplegable (Drawer) para Móvil */}
      <Drawer opened={opened} onClose={close} title="Menú" padding="xl" size="sm">
        <Stack gap="lg">
          <NavLink
            to="/"
            className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`}
            onClick={close}
            end
          >
            Inicio
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`}
            onClick={close}
          >
            Servicios
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`}
            onClick={close}
          >
            Nuestro Equipo
          </NavLink>
          <Button onClick={() => handleLinkClick('/booking')} size="lg" mt="md">
            Reservar Cita
          </Button>
        </Stack>
      </Drawer>
    </header>
  );
}