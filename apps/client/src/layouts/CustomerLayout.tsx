// File: /apps/client/src/layouts/CustomerLayout.tsx (CON ENLACE A PERFIL)

import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AppShell, Burger, Group, Title, Button, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
// --- IMPORTACIONES MODIFICADAS ---
import { IconLogout, IconCalendarPlus, IconHome, IconUserCircle } from '@tabler/icons-react';

export function CustomerLayout() {
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();

  const authToken = localStorage.getItem('customerAuthToken');

  const handleLogout = () => {
    localStorage.removeItem('customerAuthToken');
    localStorage.removeItem('customerInfo');
    notifications.show({
      title: 'Sesión cerrada',
      message: 'Has cerrado sesión correctamente.',
      color: 'blue',
    });
    navigate('/');
  };

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  // Estilos para los NavLink
  const linkStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 15px',
    borderRadius: 'var(--mantine-radius-md)',
    textDecoration: 'none',
    color: 'var(--mantine-color-text)',
    fontWeight: 500,
    fontSize: 'var(--mantine-font-size-sm)',
  };

  const activeLinkStyles: React.CSSProperties = {
    backgroundColor: 'var(--mantine-color-blue-light)',
    color: 'var(--mantine-color-blue-light-color)',
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>Mi Cuenta de AquaClean</Title>
          </Group>

          <Group visibleFrom="sm">
            <Button
              leftSection={<IconCalendarPlus size={16} />}
              onClick={() => navigate('/booking')}
            >
              Reservar Cita
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={14} />}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Group>

        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
         <NavLink
            to="/dashboard"
            end
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            <IconHome size={18} style={{ marginRight: '10px' }} />
            Resumen
         </NavLink>
         <NavLink
            to="/dashboard/appointments"
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            <IconCalendarPlus size={18} style={{ marginRight: '10px' }} />
            Mis Citas
         </NavLink>
         
         {/* --- ENLACE AÑADIDO --- */}
         <NavLink
            to="/dashboard/profile"
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            <IconUserCircle size={18} style={{ marginRight: '10px' }} />
            Mi Perfil
         </NavLink>
         {/* --- FIN DEL ENLACE AÑADIDO --- */}

         <Divider my="md" />
         <NavLink
            to="/"
            style={linkStyles}
         >
            <IconHome size={18} style={{ marginRight: '10px' }} />
            Página de Inicio
         </NavLink>

         <div style={{ marginTop: 'auto' }}>
            <Button
                fullWidth
                leftSection={<IconCalendarPlus size={16} />}
                onClick={() => navigate('/booking')}
                hiddenFrom="sm"
            >
                Reservar Cita
            </Button>
            <Button
                variant="light"
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={handleLogout}
                hiddenFrom="sm"
                mt="md"
                fullWidth
            >
                Cerrar Sesión
            </Button>
         </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}