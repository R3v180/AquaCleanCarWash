// File: /apps/client/src/App.tsx (CON RUTA PARA CHECK EMAIL)

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
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { ReviewPage } from './pages/public/ReviewPage';
import { ReviewsManagementPage } from './pages/admin/ReviewsManagementPage';
import { CustomerAppointmentsPage } from './pages/customer/CustomerAppointmentsPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';

// --- IMPORTACIÓN AÑADIDA ---
import { CheckEmailPage } from './pages/public/CheckEmailPage';


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
        <Route path="/review" element={<ReviewPage />} />

        {/* --- RUTA AÑADIDA --- */}
        <Route path="/check-your-email" element={<CheckEmailPage />} />
      </Route>

      {/* Rutas Protegidas para Clientes */}
      <Route path="/dashboard" element={<CustomerLayout />}>
        <Route index element={<CustomerDashboardPage />} />
        <Route path="appointments" element={<CustomerAppointmentsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
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
        <Route path="reviews" element={<ReviewsManagementPage />} />
      </Route>
    </Routes>
  );
}

export default App;