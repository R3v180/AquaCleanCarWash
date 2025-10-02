import { Outlet, Navigate } from 'react-router-dom';

export function AdminLayout() {
  // Leemos el token de autenticación desde localStorage.
  // Esta es la forma más simple de persistir la sesión en el navegador.
  const authToken = localStorage.getItem('authToken');

  // Si no hay token, no permitimos el acceso y redirigimos al login.
  // 'replace' evita que el usuario pueda volver atrás en el historial del navegador.
  if (!authToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si hay un token, mostramos el contenido protegido del panel de administración.
  return (
    <div>
      <header style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
        <h2>Panel de Administración de AquaClean</h2>
        {/* Más adelante aquí podríamos añadir un botón de "Cerrar Sesión" */}
      </header>
      <main style={{ padding: '1rem' }}>
        <Outlet /> {/* Aquí se renderiza el contenido (Dashboard, Servicios, etc.) */}
      </main>
    </div>
  );
}