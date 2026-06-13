import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Rocket, Settings, LogOut, Smartphone } from 'lucide-react';
import CompaniesList from './pages/admin/CompaniesList';
import CompanyForm from './pages/admin/CompanyForm';
import UsersList from './pages/admin/UsersList';
import TemplatesList from './pages/admin/TemplatesList';
import TemplateForm from './pages/admin/TemplateForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import MobileDashboard from './pages/employee/MobileDashboard';
import EmployeePortal from './pages/employee/EmployeePortal';
import ProcessesList from './pages/admin/ProcessesList';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AjustesModal from './components/AjustesModal';
import { Bell, BarChart3, Users as UsersIcon, ClipboardList, LayoutDashboard, Zap, Briefcase } from 'lucide-react';
import { hasAccessToSection } from './config/rolePermissions';

export const getRoleRoutePrefix = (role) => {
  if (role === 'SUPERADMIN') return '/superadmin';
  if (role === 'ADMIN') return '/admin';
  if (role === 'SUPERVISOR_ONBOARDING') return '/supervisor';
  if (role === 'ENCARGADO_AREA') return '/encargado';
  return '/employee';
};

export const getRoleRedirectPath = (role) => {
  const prefix = getRoleRoutePrefix(role);
  if (role === 'ENCARGADO_AREA') return `${prefix}/processes`;
  if (role === 'SUPERADMIN') return `${prefix}/talent-management`;
  if (role === 'EMPLOYEE') return `${prefix}/dashboard`;
  return `${prefix}/dashboard`;
};

const PlaceholderPage = ({ titleKey }) => {
  const { t, language } = useLanguage();
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 className="page-title">{t(titleKey)}</h1>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Módulo en desarrollo para el siguiente Sprint.</p>
    </div>
  );
};

function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let authData = null;
    try {
      // Try real backend login first (treat input as email)
      const { authService } = await import('./services/authService');
      const res = await authService.login(user.trim(), pass);
      const u = res.user;
      authData = { role: u.role, client_id: u.client_id, name: u.name, email: u.email, id: u.id };
    } catch (err) {
      // Fallback to demo accounts for development/testing
      if (user === 'admin' && pass === 'admin123') {
        authData = { role: 'SUPERADMIN', client_id: null, name: 'Alloxentric' };
      } else if (user === 'hr' && pass === 'hr123') {
        authData = { role: 'ADMIN', client_id: 1, name: 'Admin RRHH' };
      } else if (user === 'encargado' && pass === 'encargado123') {
        authData = { role: 'ENCARGADO_AREA', client_id: 1, name: 'Encargado de Área', area: 'TI' };
      } else if (user === 'supervisor' && pass === 'supervisor123') {
        authData = { role: 'SUPERVISOR_ONBOARDING', client_id: 1, name: 'Supervisor de Onboarding' };
      } else if (user === 'employee' && pass === 'employee123') {
        authData = { role: 'EMPLOYEE', client_id: 1, name: 'Juan Pérez', email: 'juan.perez@company.com', id: 1 };
      }
    }

    if (!authData) {
      alert(t('error_invalid_credentials'));
      return;
    }

    sessionStorage.setItem('onboardhub_auth', 'true');
    sessionStorage.setItem('onboardhub_user', JSON.stringify(authData));
    onLogin();
    navigate(getRoleRedirectPath(authData.role), { replace: true });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '350px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t('login_title')}</h2>
        <div className="form-group">
          <label className="form-label">{t('login_user')}</label>
          <input className="form-input" type="text" value={user} onChange={e => setUser(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">{t('login_pass')}</label>
          <input className="form-input" type="password" value={pass} onChange={e => setPass(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('login_btn')}</button>
      </form>
    </div>
  );
}

function AdminLayout({ children, onLogout }) {
  const [showSettings, setShowSettings] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const user = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
  const prefix = getRoleRoutePrefix(user.role);

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item';
  const canAccess = (section) => hasAccessToSection(user.role, section);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Rocket size={24} style={{ marginRight: '8px' }} />
          OnBoardHub
        </div>
        <nav className="sidebar-nav">
          {canAccess('dashboard') && (
            <Link to={`${prefix}/dashboard`} className={isActive(`${prefix}/dashboard`)}>
              <LayoutDashboard size={18} style={{ marginRight: '8px' }} /> {t('sidebar_dashboard')}
            </Link>
          )}
          
          {canAccess('processes') && (
            <Link to={`${prefix}/processes`} className={isActive(`${prefix}/processes`)}>
              <Briefcase size={18} style={{ marginRight: '8px' }} /> {t('sidebar_procesos')}
            </Link>
          )}

          {canAccess('templates') && (
            <Link to={`${prefix}/templates`} className={isActive(`${prefix}/templates`)}>
              <ClipboardList size={18} style={{ marginRight: '8px' }} /> {t('sidebar_plantillas')}
            </Link>
          )}
          
          {canAccess('talent-management') && (
            <Link to={`${prefix}/talent-management`} className={isActive(`${prefix}/talent-management`)}>
              <UsersIcon size={18} style={{ marginRight: '8px' }} /> {t('sidebar_talento')}
            </Link>
          )}

          {canAccess('onboarding-team') && (
            <Link to={`${prefix}/onboarding-team`} className={isActive(`${prefix}/onboarding-team`)}>
              <Zap size={18} style={{ marginRight: '8px' }} /> {t('sidebar_equipo_onboarding')}
            </Link>
          )}

          {canAccess('alerts') && (
            <Link to={`${prefix}/alerts`} className={isActive(`${prefix}/alerts`)}>
              <Bell size={18} style={{ marginRight: '8px' }} /> {t('sidebar_alertas')}
            </Link>
          )}

          {canAccess('analytics') && (
            <Link to={`${prefix}/analytics`} className={isActive(`${prefix}/analytics`)}>
              <BarChart3 size={18} style={{ marginRight: '8px' }} /> {t('sidebar_analitica')}
            </Link>
          )}

          {canAccess('companies') && (
            <Link to={`${prefix}/companies`} className={isActive(`${prefix}/companies`)}>
              <Settings size={18} style={{ marginRight: '8px' }} /> {t('sidebar_empresas')}
            </Link>
          )}
          
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            {canAccess('settings') && (
              <button className="nav-item" onClick={() => setShowSettings(true)} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
                <Settings size={18} style={{ marginRight: '8px' }} /> {t('sidebar_ajustes')}
              </button>
            )}
            <button className="nav-item" onClick={onLogout} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}>
              <LogOut size={18} style={{ marginRight: '8px' }} /> {t('btn_close')}
            </button>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <div className="top-bar">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{t(`role_${user.role.toLowerCase()}`) || user.role}</span>
          </div>
          {user.role === 'EMPLOYEE' && (
            <button 
              onClick={() => navigate('/employee/mobile')}
              className="nav-item"
              style={{ marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', color: 'var(--primary)' }}
              title="Ver vista móvil"
            >
              <Smartphone size={18} />
            </button>
          )}
        </div>
        {children}
      </main>

      {showSettings && <AjustesModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function RoleRoute({ allowedRoles, children }) {
  const isAuthenticated = sessionStorage.getItem('onboardhub_auth') === 'true';
  const user = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('onboardhub_auth') === 'true');

  const handleLogout = () => {
    sessionStorage.removeItem('onboardhub_auth');
    sessionStorage.removeItem('onboardhub_user');
    setIsAuthenticated(false);
  };

  const currentUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={
              isAuthenticated ? (
                <Navigate to={getRoleRedirectPath(currentUser.role)} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            
            <Route path="/login" element={
              isAuthenticated ? (
                <Navigate to={getRoleRedirectPath(currentUser.role)} replace />
              ) : (
                <LoginPage onLogin={() => setIsAuthenticated(true)} />
              )
            } />

            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            
            {/* Employee Web Routes */}
            <Route path="/employee/*" element={
              <RoleRoute allowedRoles={['EMPLOYEE']}>
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route path="dashboard" element={<EmployeePortal />} />
                    <Route path="journeys" element={<EmployeePortal />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </RoleRoute>
            } />

            {/* Employee Mobile Route */}
            <Route path="/employee/mobile" element={
              <RoleRoute allowedRoles={['EMPLOYEE']}>
                <MobileDashboard />
              </RoleRoute>
            } />

            {/* Superadmin Routes */}
            <Route path="/superadmin/*" element={
              <RoleRoute allowedRoles={['SUPERADMIN']}>
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route path="talent-management" element={<UsersList />} />
                    <Route path="companies" element={<CompaniesList />} />
                    <Route path="companies/new" element={<CompanyForm />} />
                    <Route path="companies/:id/edit" element={<CompanyForm />} />
                    <Route path="*" element={<Navigate to="talent-management" replace />} />
                  </Routes>
                </AdminLayout>
              </RoleRoute>
            } />

            {/* Admin (RRHH) Routes */}
            <Route path="/admin/*" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="processes" element={<ProcessesList />} />
                    <Route path="templates" element={<TemplatesList />} />
                    <Route path="templates/new" element={<TemplateForm />} />
                    <Route path="templates/:id/edit" element={<TemplateForm />} />
                    <Route path="talent-management" element={<UsersList />} />
                    <Route path="onboarding-team" element={<PlaceholderPage titleKey="sidebar_equipo_onboarding" />} />
                    <Route path="alerts" element={<PlaceholderPage titleKey="sidebar_alertas" />} />
                    <Route path="analytics" element={<PlaceholderPage titleKey="sidebar_analitica" />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </RoleRoute>
            } />

            {/* Supervisor Routes */}
            <Route path="/supervisor/*" element={
              <RoleRoute allowedRoles={['SUPERVISOR_ONBOARDING']}>
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="processes" element={<ProcessesList />} />
                    <Route path="alerts" element={<PlaceholderPage titleKey="sidebar_alertas" />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </RoleRoute>
            } />

            {/* Encargado Routes */}
            <Route path="/encargado/*" element={
              <RoleRoute allowedRoles={['ENCARGADO_AREA']}>
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route path="processes" element={<ProcessesList />} />
                    <Route path="alerts" element={<PlaceholderPage titleKey="sidebar_alertas" />} />
                    <Route path="*" element={<Navigate to="processes" replace />} />
                  </Routes>
                </AdminLayout>
              </RoleRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
