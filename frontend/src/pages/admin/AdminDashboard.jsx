import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardService } from '../../services/dashboardService';
import { userService } from '../../services/userService';
import { 
  Search, 
  Filter, 
  Eye,
  Plus,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
  const isEmployee = authUser.role === 'EMPLOYEE';
  const isSupervisor = authUser.role === 'SUPERVISOR_ONBOARDING';

  // States for interactivity
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
      const clientId = authUser.client_id || 1; 
      try {
        if (authUser.role === 'EMPLOYEE') {
          // Para empleados, traer solo sus datos
          const dashboardData = await dashboardService.getEmployeeDashboard(authUser.id);
          setData(dashboardData);
        } else if (authUser.role === 'SUPERVISOR_ONBOARDING') {
          const users = await userService.getUsersByCompany(clientId);
          const me = users.find(u => u.email === authUser.email || u.role === authUser.role) || { id: 4 };
          const dashboardData = await dashboardService.getSupervisorDashboard(clientId, me.id);
          setData(dashboardData);
        } else {
          const dashboardData = await dashboardService.getAdminDashboard(clientId);
          setData(dashboardData);
        }
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

  // Dashboard simplificado para EMPLOYEE
  if (isEmployee) {
    return (
      <div className="dashboard-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('dashboard_title') || 'Mi Progreso'}</h1>
            <p className="page-subtitle">Bienvenido/a {authUser.name}</p>
          </div>
        </div>

        {data.kpis && data.kpis.length > 0 && (
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
        )}

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-title">{t('dashboard_employee_status') || 'Mi Proceso de Onboarding'}</div>
            {data.employee_status && data.employee_status.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {data.employee_status.map((emp, i) => (
                  <div key={i} className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                        {emp.template_name || 'Proceso de Onboarding'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Rol: <strong>{emp.role}</strong>
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Progreso General</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
                          {emp.progress}%
                        </span>
                      </div>
                      <div className="progress-container">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${emp.progress}%`, 
                            backgroundColor: emp.progress > 70 ? '#10b981' : emp.progress > 30 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>

                    {emp.tasks && emp.tasks.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                          Tareas Pendientes
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {emp.tasks.filter(t => !t.completed).slice(0, 5).map((task, idx) => (
                            <div key={idx} style={{ 
                              padding: '0.75rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              transition: 'all 0.2s ease'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <span style={{ fontWeight: '500', fontSize: '0.875rem', color: 'var(--text-main)', flex: 1 }}>{task.title}</span>
                                {task.is_overdue && (
                                  <span className="badge badge-inactive" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                    Vencida
                                  </span>
                                )}
                              </div>
                              {task.deadline && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                  Vence: {task.deadline}
                                </div>
                              )}
                            </div>
                          ))}
                          {emp.tasks.filter(t => !t.completed).length > 5 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem' }}>
                              +{emp.tasks.filter(t => !t.completed).length - 5} tareas más
                            </div>
                          )}
                          {emp.tasks.filter(t => !t.completed).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              ✓ ¡Todas las tareas completadas!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No hay procesos de onboarding en progreso.
              </div>
            )}
          </div>

          {data.recent_alerts && data.recent_alerts.length > 0 && (
            <div className="dashboard-section">
              <div className="section-title">{t('dashboard_recent_alerts') || 'Alertas Recientes'}</div>
              <div className="alert-list">
                {data.recent_alerts.slice(0, 8).map((alert, i) => (
                  <div key={i} className={`alert-card alert-${alert.type}`}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.875rem' }}>{alert.title}</div>
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard_title')}</h1>
          <p className="page-subtitle">{t('dashboard_subtitle')}</p>
        </div>
        {!isSupervisor && (
          <button className="btn btn-primary" onClick={() => navigate('/admin/templates/new')}>
            <Plus size={18} style={{ marginRight: '8px' }} />
            {t('dashboard_new_process')}
          </button>
        )}
      </div>

      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Detalles del Proceso</h2>
              <X size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelectedEmployee(null)} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Empleado:</strong> {selectedEmployee.name}</p>
              <p><strong>Rol:</strong> {selectedEmployee.role}</p>
              <p><strong>Progreso:</strong> {selectedEmployee.progress}%</p>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Tareas del Proceso</h3>
            
            {selectedEmployee.tasks && selectedEmployee.tasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedEmployee.tasks.map((task, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: `1px solid ${task.completed ? '#10b981' : 'var(--border)'}`,
                    backgroundColor: task.completed ? '#ecfdf5' : 'var(--surface)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500', color: task.completed ? '#065f46' : 'var(--text-main)' }}>{task.title}</span>
                      {task.completed ? (
                        <span className="badge badge-active">Completada</span>
                      ) : task.is_overdue ? (
                        <span className="badge badge-inactive" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Vencida</span>
                      ) : (
                        <span className="badge badge-inactive">Pendiente</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Etapa: {task.stage || 'General'} {task.deadline && ` | Vence: ${task.deadline}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay tareas registradas para este proceso.</p>
            )}
          </div>
        </div>
      )}

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
            <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 'normal' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder={t('filter_name_placeholder')}
                  className="form-input" 
                  style={{ padding: '0.4rem 0.5rem 0.4rem 2rem', fontSize: '0.75rem', width: '150px', marginBottom: 0 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  className="form-input" 
                  style={{ padding: '0.4rem 0.5rem 0.4rem 2rem', fontSize: '0.75rem', width: '120px', marginBottom: 0 }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">{t('filter_all_roles')}</option>

                  <option value="EMPLOYEE">{t('role_employee')}</option>
                  <option value="ENCARGADO_AREA">{t('role_encargado_area')}</option>
                  <option value="SUPERVISOR_ONBOARDING">{t('role_supervisor_onboarding')}</option>
                  <option value="ADMIN">{t('role_admin')}</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('table_name')}</th>
                  <th>{t('table_process')}</th>
                  <th>Progreso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.employee_status
                  .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .filter(emp => roleFilter ? emp.role.toUpperCase() === roleFilter.toUpperCase() : true)
                  .map((emp, i) => (
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
                          {emp.name.split(' ').map(n => n && n[0]).join('')}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td>{emp.template_name || '-'}</td>
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
                      <Eye size={18} color="var(--primary)" style={{ cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp)} />
                    </td>
                  </tr>
                ))}
                {data.employee_status.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())).filter(emp => roleFilter ? emp.role.toUpperCase() === roleFilter.toUpperCase() : true).length === 0 && (
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
