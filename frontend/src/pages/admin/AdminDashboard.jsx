import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye,
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useLanguage();

  const kpis = [
    { label: t('dashboard_kpi_active'), value: '24', delta: '+3', deltaType: 'up', icon: Clock },
    { label: t('dashboard_kpi_employees'), value: '47', delta: '+12', deltaType: 'up', icon: Users },
    { label: t('dashboard_kpi_overdue'), value: '8', delta: '-2', deltaType: 'down', icon: AlertCircle },
    { label: t('dashboard_kpi_nps'), value: '4.2', delta: '+0.3', deltaType: 'up', icon: TrendingUp },
  ];

  const employees = [
    { name: 'Maria Garcia', role: 'Developer', progress: 75, color: '#10b981' },
    { name: 'Carlos López', role: 'Ventas', progress: 45, color: '#f59e0b' },
    { name: 'Ana Martínez', role: 'Marketing', progress: 20, color: '#ef4444' },
    { name: 'Pedro Sánchez', role: 'Developer', progress: 90, color: '#10b981' },
  ];

  const alerts = [
    { type: 'danger', title: 'SLA vencido: Reunión con jefe', time: 'Hace 2h' },
    { type: 'warning', title: 'Escalamiento: Sin respuesta 48h', time: 'Hace 4h' },
    { type: 'info', title: 'Feedback negativo recibido', time: 'Hace 6h' },
  ];

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard_title')}</h1>
          <p className="page-subtitle">{t('dashboard_subtitle')}</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} style={{ marginRight: '8px' }} />
          {t('dashboard_new_process')}
        </button>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value-container">
              <span className="kpi-value">{kpi.value}</span>
              <span className={`kpi-delta ${kpi.deltaType}`}>
                {kpi.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-title">
            {t('dashboard_employee_status')}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Search size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
              <Filter size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('table_name')}</th>
                  <th>{t('table_role')}</th>
                  <th>Progreso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: 'var(--bg-color)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)'
                        }}>
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td style={{ width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="progress-container">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${emp.progress}%`, backgroundColor: emp.color }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', width: '30px' }}>
                          {emp.progress}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <Eye size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-title">{t('dashboard_recent_alerts')}</div>
          <div className="alert-list">
            {alerts.map((alert, i) => (
              <div key={i} className={`alert-card alert-${alert.type}`}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{alert.title}</div>
                <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>{alert.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
