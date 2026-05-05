import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import EmpresasList from './pages/admin/EmpresasList';
import EmpresaForm from './pages/admin/EmpresaForm';
import UsuariosList from './pages/admin/UsuariosList';
import PlantillasList from './pages/admin/PlantillasList';
import PlantillaForm from './pages/admin/PlantillaForm';
import MobileDashboard from './pages/employee/MobileDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AjustesModal from './components/AjustesModal';

function AdminLayout({ children }) {
  const [showSettings, setShowSettings] = React.useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item';
  const { t } = useLanguage();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Rocket size={24} style={{ marginRight: '8px' }} />
          OnBoardHub
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/empresas" className={isActive('/admin/empresas')}>{t('sidebar_empresas')}</Link>
          <Link to="/admin/usuarios" className={isActive('/admin/usuarios')}>{t('sidebar_usuarios')}</Link>
          <Link to="/admin/plantillas" className={isActive('/admin/plantillas')}>{t('sidebar_plantillas')}</Link>
          <button 
            className="nav-item" 
            style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            onClick={() => setShowSettings(true)}
          >
            {t('sidebar_ajustes')}
          </button>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>

      {showSettings && <AjustesModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
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
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

