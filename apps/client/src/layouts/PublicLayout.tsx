// File: /apps/client/src/layouts/PublicLayout.tsx (ACTUALIZADO)

import { Outlet } from 'react-router-dom';
import { AppShell, Container } from '@mantine/core';

// Importamos los componentes que acabamos de crear
import { PublicHeader } from '../components/common/PublicHeader';
import { PublicFooter } from '../components/common/PublicFooter';

export function PublicLayout() {
  // Simplificamos el AppShell ya que no necesitamos la barra lateral (navbar)
  // que sí usamos en el panel de admin.
  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <PublicHeader />
      </AppShell.Header>

      <AppShell.Main>
        {/* Usamos un Container para centrar y limitar el ancho del contenido de cada página */}
        <Container size="lg" py="xl">
          <Outlet />
        </Container>
      </AppShell.Main>
      
      {/* El footer se renderiza aquí, después del contenido principal */}
      <PublicFooter />
    </AppShell>
  );
}