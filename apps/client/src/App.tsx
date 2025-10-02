import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/public/HomePage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ServicesManagementPage } from './pages/admin/ServicesManagementPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { EmployeesManagementPage } from './pages/admin/EmployeesManagementPage';
import { ServicesPage } from './pages/public/ServicesPage'; // <-- LÍNEA AÑADIDA

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/services" element={<ServicesPage />} /> {/* <-- LÍNEA AÑADIDA */}

      {/* Ruta de Login para Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Rutas de Administración Protegidas */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="services" element={<ServicesManagementPage />} />
        <Route path="employees" element={<EmployeesManagementPage />} />
      </Route>
    </Routes>
  );
}

export default App;