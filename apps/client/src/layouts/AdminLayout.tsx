// File: /apps/client/src/layouts/AdminLayout.tsx (ACTUALIZADO)

import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export function AdminLayout() {
  const [opened, { toggle }] = useDisclosure();

  const authToken = localStorage.getItem('authToken');

  if (!authToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // Estilos para los NavLink de react-router-dom
  const linkStyles = {
    display: 'block',
    padding: '8px 16px',
    borderRadius: '4px',
    textDecoration: 'none',
    color: 'black',
  };

  const activeLinkStyles = {
    backgroundColor: '#e9ecef',
    fontWeight: 500,
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }} // <-- desktop: true eliminado para que se vea en desktop
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={4}>Panel de Administración de AquaClean</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
         <NavLink 
            to="/admin" 
            end // 'end' asegura que solo esté activo en la ruta exacta
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Dashboard
         </NavLink>
         <NavLink 
            to="/admin/planning" 
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Planning
         </NavLink>
         <NavLink 
            to="/admin/services" 
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Servicios
         </NavLink>
         <NavLink 
            to="/admin/employees" 
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Empleados
         </NavLink>
         {/* --- LÍNEA AÑADIDA --- */}
         <NavLink 
            to="/admin/settings" 
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Ajustes del Negocio
         </NavLink>
         {/* --- FIN DE LA LÍNEA AÑADIDA --- */}
      </AppShell.Navbar>
      
      <AppShell.Main>
        <Outlet /> 
      </AppShell.Main>
    </AppShell>
  );
}