import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Rocket, Settings, LogOut } from 'lucide-react';
import CompaniesList from './pages/admin/CompaniesList';
import CompanyForm from './pages/admin/CompanyForm';
import UsersList from './pages/admin/UsersList';
import TemplatesList from './pages/admin/TemplatesList';
import TemplateForm from './pages/admin/TemplateForm';
import MobileDashboard from './pages/employee/MobileDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AjustesModal from './components/AjustesModal';

function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') {
      localStorage.setItem('onboardhub_auth', 'true');
      onLogin();
    } else {
      alert('Invalid credentials');
    }
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
  const { t } = useLanguage();
  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Rocket size={24} style={{ marginRight: '8px' }} />
          OnBoardHub
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/companies" className={isActive('/admin/companies')}>{t('sidebar_empresas')}</Link>
          <Link to="/admin/users" className={isActive('/admin/users')}>{t('sidebar_usuarios')}</Link>
          <Link to="/admin/templates" className={isActive('/admin/templates')}>{t('sidebar_plantillas')}</Link>
          
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button className="nav-item" onClick={() => setShowSettings(true)} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
              <Settings size={18} style={{ marginRight: '8px' }} /> {t('sidebar_ajustes')}
            </button>
            <button className="nav-item" onClick={onLogout} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}>
              <LogOut size={18} style={{ marginRight: '8px' }} /> {t('btn_close')}
            </button>
          </div>
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
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('onboardhub_auth') === 'true');

  const handleLogout = () => {
    localStorage.removeItem('onboardhub_auth');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/employee" replace />} />
            <Route path="/employee" element={<MobileDashboard />} />
            
            <Route path="/admin/login" element={
              isAuthenticated ? <Navigate to="/admin/companies" /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
            } />

            <Route path="/admin/*" element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route path="companies" element={<CompaniesList />} />
                    <Route path="companies/new" element={<CompanyForm />} />
                    <Route path="companies/:id/edit" element={<CompanyForm />} />
                    <Route path="users" element={<UsersList />} />
                    <Route path="templates" element={<TemplatesList />} />
                    <Route path="templates/new" element={<TemplateForm />} />
                    <Route path="*" element={<Navigate to="companies" />} />
                  </Routes>
                </AdminLayout>
              ) : <Navigate to="/admin/login" />
            } />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
