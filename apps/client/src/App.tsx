// File: /apps/client/src/App.tsx (ACTUALIZADO)

import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/public/HomePage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ServicesManagementPage } from './pages/admin/ServicesManagementPage'; // <-- IMPORTAR

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<HomePage />} />

      {/* Rutas de Administración */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="services" element={<ServicesManagementPage />} /> {/* <-- RUTA AÑADIDA */}
      </Route>
    </Routes>
  );
}

export default App;