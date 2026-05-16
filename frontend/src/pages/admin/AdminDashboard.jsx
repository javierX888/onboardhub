import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardService } from '../../services/dashboardService';
import { 
  Search, 
  Filter, 
  Eye,
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
      // En entorno local/desarrollo si no hay cliente asignado usamos ID 1
      const clientId = authUser.client_id || 1; 
      try {
        const dashboardData = await dashboardService.getAdminDashboard(clientId);
        setData(dashboardData);
      } catch (err) {
        console.error("Error fetching dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('msg_loading')}</div>;
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('msg_error_generic')}</div>;

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
        {data.kpis.map((kpi, index) => (
          <div key={index} className="kpi-card">
            <div className="kpi-label">{t(kpi.label)}</div>
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
                {data.employee_status.map((emp, i) => (
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
                            style={{ 
                                width: `${emp.progress}%`, 
                                backgroundColor: emp.progress > 70 ? '#10b981' : emp.progress > 30 ? '#f59e0b' : '#ef4444' 
                            }}
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
                {data.employee_status.length === 0 && (
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            {t('msg_no_data')}
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-title">{t('dashboard_recent_alerts')}</div>
          <div className="alert-list">
            {data.recent_alerts.map((alert, i) => (
              <div key={i} className={`alert-card alert-${alert.type}`}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{alert.title}</div>
                <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>{alert.time}</div>
              </div>
            ))}
            {data.recent_alerts.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Sin alertas pendientes.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
