// File: /apps/client/src/components/common/PublicHeader.tsx (CON LÓGICA DE AUTENTICACIÓN)

import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Group, Button, Image, Burger, Drawer, Stack, Menu, Text, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDashboard, IconLogout } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import classes from './PublicHeader.module.css';

interface CustomerInfo {
  name?: string;
  email?: string;
}

export function PublicHeader() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);

  // --- LÓGICA AÑADIDA ---
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  // Este efecto se ejecutará al cargar y cada vez que cambie el localStorage
  useEffect(() => {
    const updateCustomerState = () => {
      const token = localStorage.getItem('customerAuthToken');
      const info = localStorage.getItem('customerInfo');
      if (token && info) {
        setCustomer(JSON.parse(info));
      } else {
        setCustomer(null);
      }
    };

    updateCustomerState();

    // Escuchamos cambios en el storage para actualizar la cabecera en tiempo real
    // (si el login/logout ocurre en otra pestaña)
    window.addEventListener('storage', updateCustomerState);
    return () => {
      window.removeEventListener('storage', updateCustomerState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerAuthToken');
    localStorage.removeItem('customerInfo');
    setCustomer(null); // Actualizamos el estado local
    notifications.show({
      title: 'Sesión cerrada',
      message: 'Has cerrado sesión correctamente.',
      color: 'blue',
    });
    navigate('/');
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
    close();
  };
  // --- FIN DE LA LÓGICA AÑADIDA ---

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Image src="/logo.png" alt="Logo" h={40} fit="contain" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />

        <Group gap={5} visibleFrom="xs">
          <NavLink to="/" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`} end>Inicio</NavLink>
          <NavLink to="/services" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>Servicios</NavLink>
          <NavLink to="/team" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>Nuestro Equipo</NavLink>
        </Group>
        
        {/* --- RENDERIZADO CONDICIONAL DEL BOTÓN --- */}
        <Group visibleFrom="xs">
          {customer ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="outline">
                  <Group>
                    <Avatar size="sm" color="blue" radius="xl">{customer.name?.charAt(0)}</Avatar>
                    <Text size="sm">{customer.name}</Text>
                  </Group>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Mi Cuenta</Menu.Label>
                <Menu.Item leftSection={<IconDashboard size={14} />} onClick={() => navigate('/dashboard')}>
                  Mi Panel
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                  Cerrar Sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Group>
                <Button variant="default" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
                <Button onClick={() => navigate('/booking')}>Reservar Cita</Button>
            </Group>
          )}
        </Group>
        {/* --- FIN DEL RENDERIZADO CONDICIONAL --- */}

        <Burger opened={opened} onClick={open} hiddenFrom="xs" size="sm" />
      </Container>
      
      <Drawer opened={opened} onClose={close} title="Menú" padding="xl" size="sm">
        <Stack gap="lg">
          <NavLink to="/" className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`} onClick={close} end>Inicio</NavLink>
          <NavLink to="/services" className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`} onClick={close}>Servicios</NavLink>
          <NavLink to="/team" className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`} onClick={close}>Nuestro Equipo</NavLink>
          <Button onClick={() => handleLinkClick('/booking')} size="lg" mt="md">Reservar Cita</Button>
          {/* Aquí podríamos añadir también la lógica de login/logout para móvil */}
        </Stack>
      </Drawer>
    </header>
  );
}