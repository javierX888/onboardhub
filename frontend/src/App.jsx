import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import EmpresasList from './pages/admin/EmpresasList';
import EmpresaForm from './pages/admin/EmpresaForm';
import UsuariosList from './pages/admin/UsuariosList';
import PlantillasList from './pages/admin/PlantillasList';
import PlantillaForm from './pages/admin/PlantillaForm';
import MobileDashboard from './pages/employee/MobileDashboard';

function AdminLayout({ children }) {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Rocket size={24} style={{ marginRight: '8px' }} />
          OnBoardHub
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/empresas" className={isActive('/admin/empresas')}>Empresas</Link>
          <Link to="/admin/usuarios" className={isActive('/admin/usuarios')}>Usuarios</Link>
          <Link to="/admin/plantillas" className={isActive('/admin/plantillas')}>Plantillas</Link>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/employee" replace />} />
        
        {/* Rutas App Móvil (Empleado) - PRIORIDAD PRESENTACIÓN */}
        <Route path="/employee" element={<MobileDashboard />} />
        
        {/* Rutas de Administrador */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="empresas" element={<EmpresasList />} />
              <Route path="empresas/new" element={<EmpresaForm />} />
              <Route path="empresas/:id/edit" element={<EmpresaForm />} />
              <Route path="usuarios" element={<UsuariosList />} />
              <Route path="plantillas" element={<PlantillasList />} />
              <Route path="plantillas/new" element={<PlantillaForm />} />
              <Route path="plantillas/:id/edit" element={<PlantillaForm />} />
            </Routes>
          </AdminLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;

