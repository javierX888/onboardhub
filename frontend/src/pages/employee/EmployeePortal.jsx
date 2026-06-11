import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, PlayCircle, Upload, CheckCircle, Lock, CalendarDays } from 'lucide-react';
import { employeeService, journeyService } from '../../services/employeeService';
import { useLanguage } from '../../context/LanguageContext';

const taskTypeIcon = {
  watch_video: PlayCircle,
  read_document: FileText,
  upload_document: Upload,
  read_text: FileText,
};

export default function EmployeePortal() {
  const { t } = useLanguage();
  const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
  const [userData, setUserData] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchPortalData = async () => {
    if (!authUser.email) {
      setError(t('employee_portal_missing_email'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await employeeService.getDashboard(authUser.email);
      setUserData(data.user);
      setJourney(data.journey);
      setError(null);
    } catch (err) {
      console.error('Error loading employee portal', err);
      setError(t('employee_portal_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleCompleteTask = async (task) => {
    const file = selectedFiles[task.id] || null;
    setSubmittingTaskId(task.id);

    try {
      const result = await journeyService.completeTask(task.id, userData.client_id, file);
      setJourney((currentJourney) => ({
        ...currentJourney,
        progress: result.progress,
        tasks: currentJourney.tasks.map((item) => (
          item.id === task.id
            ? { ...item, completed: true, document_url: result.document_url || item.document_url }
            : item
        )),
      }));
      setSelectedFiles((currentFiles) => ({ ...currentFiles, [task.id]: null }));
      showToast(t('msg_success_complete'), 'success');
    } catch (err) {
      console.error('Error completing task', err);
      const detail = err.response?.data?.detail;
      showToast(typeof detail === 'string' ? detail : t('employee_portal_task_error'), 'error');
    } finally {
      setSubmittingTaskId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('msg_loading')}</div>;
  }

  if (error) {
    return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  }

  const tasks = journey?.tasks || [];
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('employee_portal_title')}</h1>
          <p className="page-subtitle">{t('employee_portal_welcome')} {userData?.name || authUser.name}</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">{t('dashboard_kpi_progress')}</div>
          <div className="kpi-value-container">
            <span className="kpi-value">{journey?.progress || 0}%</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('dashboard_kpi_completed')}</div>
          <div className="kpi-value-container">
            <span className="kpi-value">{completedTasks}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('dashboard_kpi_pending')}</div>
          <div className="kpi-value-container">
            <span className="kpi-value">{pendingTasks}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {!journey ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('employee_portal_no_journey')}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {t('employee_portal_process')}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {journey.location || t('location_remote')}
                </p>
              </div>
              <span className="badge badge-active">{journey.progress}%</span>
            </div>

            <div className="progress-container" style={{ marginBottom: '1.5rem' }}>
              <div className="progress-fill" style={{ width: `${journey.progress || 0}%` }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks.map((task, index) => {
                const Icon = taskTypeIcon[task.type] || FileText;
                const isCompleted = task.completed;
                const isCurrent = !isCompleted && (index === 0 || tasks[index - 1].completed);
                const isLocked = !isCompleted && !isCurrent;
                const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < new Date();
                const selectedFile = selectedFiles[task.id];
                const requiresFile = task.type === 'upload_document' || task.is_evidence_mandatory;

                return (
                  <div
                    key={task.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      background: isLocked ? 'var(--bg-color)' : 'var(--surface)',
                      opacity: isLocked ? 0.78 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{ color: isCompleted ? '#16a34a' : isLocked ? 'var(--text-muted)' : 'var(--primary)', paddingTop: '0.1rem' }}>
                          {isCompleted ? <CheckCircle size={22} /> : isLocked ? <Lock size={22} /> : <Icon size={22} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                            {task.stage || `${t('stage_label')} ${index + 1}`}
                          </div>
                          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>{task.title}</h3>
                          {task.description && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{task.description}</p>
                          )}
                          {task.deadline && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                              <CalendarDays size={14} /> {t('employee_portal_deadline')}: {new Date(task.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${isCompleted ? 'badge-active' : isOverdue ? 'badge-inactive' : ''}`} style={!isCompleted && !isOverdue ? { background: '#e0e7ff', color: '#3730a3' } : undefined}>
                        {isCompleted ? t('processes_modal_completed') : isOverdue ? t('employee_portal_overdue') : t('processes_modal_pending')}
                      </span>
                    </div>

                    {!isLocked && !isCompleted && (
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {task.resource_url && (
                          <a className="btn btn-secondary" href={task.resource_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <ExternalLink size={16} style={{ marginRight: '6px' }} /> {t('employee_portal_open_resource')}
                          </a>
                        )}
                        {requiresFile && (
                          <input
                            className="form-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) => setSelectedFiles((currentFiles) => ({ ...currentFiles, [task.id]: event.target.files[0] || null }))}
                            style={{ maxWidth: '280px', marginBottom: 0 }}
                          />
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={() => handleCompleteTask(task)}
                          disabled={submittingTaskId === task.id || (requiresFile && !selectedFile)}
                          style={{ opacity: submittingTaskId === task.id || (requiresFile && !selectedFile) ? 0.6 : 1 }}
                        >
                          {submittingTaskId === task.id ? t('employee_portal_completing') : t('btn_complete')}
                        </button>
                      </div>
                    )}

                    {task.document_url && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <a href={task.document_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none' }}>
                          {t('processes_modal_download')}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '50px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          {toastMessage.message}
        </div>
      )}
    </div>
  );
}