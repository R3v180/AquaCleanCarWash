// File: /apps/client/src/components/common/PublicHeader.tsx (ACTUALIZADO)

import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Group, Button, Image } from '@mantine/core';
import classes from './PublicHeader.module.css';

export function PublicHeader() {
  const navigate = useNavigate();

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        {/* Logo como Imagen */}
        <Image
          src="/logo.png"
          alt="Logo de AquaClean Car Wash"
          h={40}
          fit="contain"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        {/* Enlaces de Navegación */}
        <Group gap={5} visibleFrom="xs">
          <NavLink to="/" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`} end>
            Inicio
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>
            Servicios
          </NavLink>
          {/* --- LÍNEA AÑADIDA --- */}
          <NavLink to="/team" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>
            Nuestro Equipo
          </NavLink>
        </Group>

        {/* Botón de Reserva */}
        <Group>
          <Button onClick={() => navigate('/services')}>Reservar Cita</Button>
        </Group>
      </Container>
    </header>
  );
}