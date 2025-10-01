// File: /apps/client/src/layouts/AdminLayout.tsx
import { Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div>
      <header style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
        <h2>Panel de Administración de AquaClean</h2>
        {/* Aquí iría la navegación del panel (sidebar, etc.) */}
      </header>
      <main style={{ padding: '1rem' }}>
        <Outlet /> {/* Aquí se renderizará el contenido de cada página de admin */}
      </main>
    </div>
  );
}