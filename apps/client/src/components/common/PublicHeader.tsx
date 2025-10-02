// File: /apps/client/src/components/common/PublicHeader.tsx (ACTUALIZADO)

import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Group, Button, Image } from '@mantine/core'; // <-- 1. Image AÑADIDO
import classes from './PublicHeader.module.css';

export function PublicHeader() {
  const navigate = useNavigate();

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        {/* 2. Logo como Imagen */}
        <Image
          src="/logo.png" // <-- Vite sirve automáticamente desde la carpeta 'public'
          alt="Logo de AquaClean Car Wash"
          h={40} // Altura de la imagen
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
        </Group>

        {/* Botón de Reserva */}
        <Group>
          <Button onClick={() => navigate('/services')}>Reservar Cita</Button>
        </Group>
      </Container>
    </header>
  );
}