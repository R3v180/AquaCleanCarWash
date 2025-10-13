// File: /apps/client/src/layouts/AdminLayout.tsx (AÑADIENDO ENLACE A RESEÑAS)

import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export function AdminLayout() {
  const [opened, { toggle }] = useDisclosure();

  const authToken = localStorage.getItem('authToken');

  if (!authToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // Estilos para los NavLink
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
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
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
            end
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
         <NavLink 
            to="/admin/settings" 
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Ajustes del Negocio
         </NavLink>

         {/* --- ENLACE AÑADIDO --- */}
         <NavLink 
            to="/admin/reviews" 
            style={({ isActive }) => ({ ...linkStyles, ...(isActive ? activeLinkStyles : {}) })}
         >
            Valoraciones
         </NavLink>
         {/* --- FIN DEL ENLACE AÑADIDO --- */}

      </AppShell.Navbar>
      
      <AppShell.Main>
        <Outlet /> 
      </AppShell.Main>
    </AppShell>
  );
}