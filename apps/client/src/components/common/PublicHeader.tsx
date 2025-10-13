// ====== [19] apps/client/src/components/common/PublicHeader.tsx ======
// File: /apps/client/src/components/common/PublicHeader.tsx (CON LÓGICA DE DRAWER CORREGIDA Y COMPLETADA)

import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Group, Button, Image, Burger, Drawer, Stack, Menu, Text, Avatar, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDashboard, IconLogout, IconUserCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import classes from './PublicHeader.module.css';

interface CustomerInfo {
  name?: string;
  email?: string;
}

export function PublicHeader() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

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
    window.addEventListener('storage', updateCustomerState);
    return () => {
      window.removeEventListener('storage', updateCustomerState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerAuthToken');
    localStorage.removeItem('customerInfo');
    setCustomer(null);
    notifications.show({
      title: 'Sesión cerrada',
      message: 'Has cerrado sesión correctamente.',
      color: 'blue',
    });
    navigate('/');
    close(); // Cerramos el drawer si estuviera abierto
  };

  // --- FUNCIÓN CLAVE MEJORADA ---
  // Esta función ahora se usará para TODOS los clics de navegación en el drawer.
  const handleLinkClick = (path: string) => {
    navigate(path);
    close();
  };

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Image src="/logo.png" alt="Logo" h={40} fit="contain" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />

        <Group gap={5} visibleFrom="xs">
          <NavLink to="/" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`} end>Inicio</NavLink>
          <NavLink to="/services" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>Servicios</NavLink>
          <NavLink to="/team" className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}>Nuestro Equipo</NavLink>
        </Group>
        
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

        <Burger opened={opened} onClick={open} hiddenFrom="xs" size="sm" />
      </Container>
      
      {/* --- LÓGICA DEL DRAWER (MENÚ MÓVIL) COMPLETAMENTE REFACTORIZADA --- */}
      <Drawer opened={opened} onClose={close} title="Menú" padding="xl" size="sm">
        <Stack gap="lg">
          <NavLink to="/" className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`} onClick={() => handleLinkClick('/')} end>Inicio</NavLink>
          <NavLink to="/services" className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`} onClick={() => handleLinkClick('/services')}>Servicios</NavLink>
          <NavLink to="/team" className={({ isActive }) => `${classes.drawerLink} ${isActive ? classes.drawerLinkActive : ''}`} onClick={() => handleLinkClick('/team')}>Nuestro Equipo</NavLink>
          
          <Divider my="sm" />

          {customer ? (
            <>
              <Button
                leftSection={<IconDashboard size={18} />}
                variant="light"
                onClick={() => handleLinkClick('/dashboard')}
                size="lg"
              >
                Mi Panel
              </Button>
              <Button
                color="red"
                variant="light"
                leftSection={<IconLogout size={18} />}
                onClick={handleLogout}
                size="lg"
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button
                leftSection={<IconUserCircle size={18} />}
                variant="light"
                onClick={() => handleLinkClick('/login')}
                size="lg"
              >
                Iniciar Sesión
              </Button>
              <Button onClick={() => handleLinkClick('/booking')} size="lg" mt="md">
                Reservar Cita
              </Button>
            </>
          )}

        </Stack>
      </Drawer>
    </header>
  );
}