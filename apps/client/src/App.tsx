// File: /apps/client/src/App.tsx (ACTUALIZADO CON RUTAS DE PANEL DE CLIENTE)

import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/public/HomePage';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ServicesManagementPage } from './pages/admin/ServicesManagementPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { EmployeesManagementPage } from './pages/admin/EmployeesManagementPage';
import { ServicesPage } from './pages/public/ServicesPage';
import { BookingPage } from './pages/public/BookingPage';
import { AdminPlanningPage } from './pages/admin/AdminPlanningPage';
import { TeamPage } from './pages/public/TeamPage';
import { BusinessSettingsPage } from './pages/admin/BusinessSettingsPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// --- IMPORTACIONES AÑADIDAS ---
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* --- NUEVO GRUPO DE RUTAS PROTEGIDAS PARA CLIENTES --- */}
      <Route path="/dashboard" element={<CustomerLayout />}>
        <Route index element={<CustomerDashboardPage />} />
        {/* <Route path="appointments" element={<div>Mis Citas (en construcción)</div>} /> */}
      </Route>

      {/* Ruta de Login para Admin (sin layout) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Rutas de Administración Protegidas */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="services" element={<ServicesManagementPage />} />
        <Route path="employees" element={<EmployeesManagementPage />} />
        <Route path="planning" element={<AdminPlanningPage />} />
        <Route path="settings" element={<BusinessSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;