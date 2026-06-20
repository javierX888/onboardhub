import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, Clock, History, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { alertService } from '../../services/alertService';

export default function AlertsCenter() {
  const { t, language } = useLanguage();
  const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
  const clientId = authUser.client_id || 1;
  const userId = authUser.id;

  const [status, setStatus] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendingId, setAttendingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alertService.getAlerts(clientId, status, userId);
      setAlerts(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError(t('alerts_error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [status]);

  const filteredAlerts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return alerts;
    return alerts.filter(alert => {
      const values = [alert.employee_name, alert.task_title, alert.message, alert.type];
      return values.some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [alerts, searchTerm]);

  const handleAttend = async (alertId) => {
    if (!userId) {
      setError(t('alerts_error_user'));
      return;
    }

    setAttendingId(alertId);
    setError('');
    try {
      await alertService.attendAlert(alertId, clientId, userId);
      await fetchAlerts();
    } catch (err) {
      console.error('Error attending alert:', err);
      setError(t('alerts_error_attend'));
    } finally {
      setAttendingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(value));
  };

  const getAlertTypeLabel = (type) => {
    if (type === 'SLA_EXPIRED') return t('alert_type_sla_expired');
    return type || '-';
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sidebar_alertas')}</h1>
          <p className="page-subtitle">{t('alerts_subtitle')}</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw size={18} style={{ marginRight: '8px' }} />
          {t('alerts_refresh')}
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">{status === 'active' ? t('alerts_active') : t('alerts_history')}</div>
          <div className="kpi-value-container">
            <span className="kpi-value">{alerts.length}</span>
            <span className={`kpi-delta ${status === 'active' ? 'down' : 'neutral'}`}>{t('sidebar_alertas')}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-title" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} />
            {status === 'active' ? t('alerts_active') : t('alerts_history')}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem', border: '1px solid var(--border)' }}>
              <button
                className={`btn ${status === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatus('active')}
                style={{ padding: '0.45rem 0.75rem' }}
              >
                <Bell size={16} style={{ marginRight: '6px' }} />
                {t('alerts_active')}
              </button>
              <button
                className={`btn ${status === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatus('history')}
                style={{ padding: '0.45rem 0.75rem' }}
              >
                <History size={16} style={{ marginRight: '6px' }} />
                {t('alerts_history')}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('alerts_search')}
                style={{ padding: '0.45rem 0.5rem 0.45rem 2rem', marginBottom: 0, width: '220px' }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-card alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('msg_loading')}</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {status === 'active' ? t('alert_no_pending') : t('alerts_no_history')}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('alerts_employee')}</th>
                  <th>{t('alerts_task')}</th>
                  <th>{t('alerts_deadline')}</th>
                  <th>{t('alerts_days_overdue')}</th>
                  <th>{t('alerts_generated_at')}</th>
                  <th>{t('alerts_status')}</th>
                  {status === 'active' && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => (
                  <tr key={alert.id}>
                    <td>{alert.employee_name || '-'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{alert.task_title || alert.message}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getAlertTypeLabel(alert.type)}</div>
                    </td>
                    <td>{formatDate(alert.deadline)}</td>
                    <td>
                      <span className="badge badge-inactive" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                        {alert.days_overdue} {t('alerts_days')}
                      </span>
                    </td>
                    <td>{formatDate(alert.created_at)}</td>
                    <td>
                      {alert.is_read ? (
                        <span className="badge badge-active">{t('alerts_attended')}</span>
                      ) : (
                        <span className="badge badge-inactive">{t('alerts_pending')}</span>
                      )}
                    </td>
                    {status === 'active' && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAttend(alert.id)}
                          disabled={attendingId === alert.id}
                        >
                          <CheckCircle size={16} style={{ marginRight: '6px' }} />
                          {attendingId === alert.id ? t('msg_loading') : t('alerts_attend')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}