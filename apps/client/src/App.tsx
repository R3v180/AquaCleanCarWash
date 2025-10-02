// File: /apps/client/src/App.tsx (ACTUALIZADO)

import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/public/HomePage';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout'; // <-- 1. IMPORTAMOS EL NUEVO LAYOUT
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ServicesManagementPage } from './pages/admin/ServicesManagementPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { EmployeesManagementPage } from './pages/admin/EmployeesManagementPage';
import { ServicesPage } from './pages/public/ServicesPage';
import { BookingPage } from './pages/public/BookingPage';
import { AdminPlanningPage } from './pages/admin/AdminPlanningPage';

function App() {
  return (
    <Routes>
      {/* 2. ENVOLVEMOS LAS RUTAS PÚBLICAS CON EL LAYOUT */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/booking" element={<BookingPage />} />
      </Route>

      {/* Ruta de Login para Admin (sin layout) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Rutas de Administración Protegidas (usan su propio layout) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="services" element={<ServicesManagementPage />} />
        <Route path="employees" element={<EmployeesManagementPage />} />
        <Route path="planning" element={<AdminPlanningPage />} />
      </Route>
    </Routes>
  );
}

export default App;