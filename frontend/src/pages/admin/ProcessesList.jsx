import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { journeyService } from '../../services/employeeService';
import { templateService } from '../../services/templateService';
import { useLanguage } from '../../context/LanguageContext';
import { Briefcase, CheckCircle, Clock, MapPin, Eye, X, ShieldAlert, Award, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function ProcessesList() {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [viewingJourney, setViewingJourney] = useState(null);
    const [currentUserDb, setCurrentUserDb] = useState(null);
    const [expandedTemplates, setExpandedTemplates] = useState({});

    const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');

    const fetchData = async () => {
        setLoading(true);
        try {
            const clientId = authUser.client_id || 1;
            const [usersData, journeysData, templatesData] = await Promise.all([
                userService.getUsersByCompany(clientId),
                journeyService.getJourneysByCompany(clientId),
                templateService.getTemplatesByCompany(clientId)
            ]);

            setUsers(usersData);
            setJourneys(journeysData);
            setTemplates(templatesData);

            // Find current user DB record to match area or ID
            const me = usersData.find(u => u.email === authUser.email || u.role === authUser.role) || {
                id: 4, // Fallback for testing
                name: authUser.name,
                role: authUser.role,
                area: authUser.area || 'TI'
            };
            setCurrentUserDb(me);
        } catch (err) {
            console.error("Error loading processes data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const usersMap = {};
    users.forEach(u => {
        usersMap[u.id] = u;
    });

    const templatesMap = {};
    templates.forEach(t => {
        templatesMap[t.id] = t;
    });

    // Filtering logic based on Role
    const filteredJourneys = journeys.filter(journey => {
        if (!currentUserDb) return true;

        if (currentUserDb.role === 'ADMIN') {
            return true; // Admin sees all journeys
        }

        if (currentUserDb.role === 'SUPERVISOR_ONBOARDING') {
            // Supervisor sees journeys assigned to them
            return journey.supervisor_id === currentUserDb.id || journey.responsible_id === currentUserDb.id;
        }

        if (currentUserDb.role === 'ENCARGADO_AREA') {
            // Encargado Area sees journeys of employees in their area
            const employee = usersMap[journey.employee_id];
            return employee && employee.area === currentUserDb.area;
        }

        return false;
    });

    // Group journeys by template_id
    const groupedJourneys = {};
    filteredJourneys.forEach(journey => {
        const tId = journey.template_id || 'custom';
        if (!groupedJourneys[tId]) {
            groupedJourneys[tId] = [];
        }
        groupedJourneys[tId].push(journey);
    });

    // Statistics
    const totalCount = filteredJourneys.length;
    const completedCount = filteredJourneys.filter(j => j.progress === 100).length;
    const activeCount = totalCount - completedCount;

    const toggleTemplate = (templateId) => {
        setExpandedTemplates(prev => ({
            ...prev,
            [templateId]: prev[templateId] === false ? true : false
        }));
    };

    const handleDeleteJourney = async (journeyId) => {
        if (!window.confirm(t('msg_confirm_delete') || '¿Estás seguro de eliminar este proceso?')) return;
        try {
            const clientId = authUser.client_id || 1;
            await journeyService.deleteJourney(journeyId, clientId);
            alert(t('msg_success_delete') || 'Proceso eliminado exitosamente.');
            fetchData();
        } catch (err) {
            console.error("Error deleting journey:", err);
            alert(t('msg_error_generic') || 'Ocurrió un error al eliminar.');
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">{t('sidebar_procesos')}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {t('processes_subtitle')}
                </p>
            </div>

            {currentUserDb && (
                <div style={{
                    background: 'var(--card-bg)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '50%' }}>
                        <Award size={20} />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('processes_role_view')}: {t(`role_${currentUserDb.role.toLowerCase()}`) || currentUserDb.role}</span>
                        <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {currentUserDb.role === 'ADMIN' && t('processes_admin_view')}
                            {currentUserDb.role === 'SUPERVISOR_ONBOARDING' && t('processes_supervisor_view')}
                            {currentUserDb.role === 'ENCARGADO_AREA' && `${t('processes_encargado_view')} ${currentUserDb.area}`}
                        </h4>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px', borderRadius: '12px' }}>
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('processes_kpi_total')}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalCount}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '12px', borderRadius: '12px' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('processes_kpi_progress')}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{activeCount}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '12px', borderRadius: '12px' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('processes_kpi_completed')}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{completedCount}</div>
                    </div>
                </div>
            </div>

            {/* Main Accordion Lists */}
            {loading ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('processes_loading')}
                </div>
            ) : Object.keys(groupedJourneys).length === 0 ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <h3>{t('processes_empty_state')}</h3>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.keys(groupedJourneys).map(tId => {
                        const templateJourneys = groupedJourneys[tId];
                        const isCustom = tId === 'custom';
                        const template = !isCustom ? templatesMap[tId] : null;
                        const isExpanded = expandedTemplates[tId] !== false;

                        // Calculate average progress for journeys in this group
                        const groupProgressSum = templateJourneys.reduce((sum, j) => sum + (j.progress || 0), 0);
                        const groupAvgProgress = templateJourneys.length > 0 ? Math.round(groupProgressSum / templateJourneys.length) : 0;

                        return (
                            <div key={tId} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                {/* Accordion Header */}
                                <div 
                                    onClick={() => toggleTemplate(tId)}
                                    style={{
                                        padding: '1.25rem 1.5rem',
                                        background: 'var(--card-bg)',
                                        borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background 0.2s'
                                    }}
                                    className="accordion-header"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            background: isCustom ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-light)',
                                            color: isCustom ? '#ef4444' : 'var(--primary)',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {isCustom ? t('processes_group_custom') : (template?.name || `Proceso ID: ${tId}`)}
                                                </h3>
                                                <span className="badge badge-active" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                                                    {templateJourneys.length} {templateJourneys.length === 1 ? t('processes_colaborador') : t('processes_colaboradores')}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {isCustom ? t('processes_custom_desc') : (template?.description || t('processes_no_desc'))}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('dashboard_kpi_progress_avg')}</span>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{groupAvgProgress}%</span>
                                        </div>
                                        {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                                    </div>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                    <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                                        <table className="data-table" style={{ minWidth: '900px', width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th>{t('processes_col_employee')}</th>
                                                    <th>{t('processes_col_area')}</th>
                                                    <th>{t('processes_col_role')}</th>
                                                    <th>{t('processes_col_progress')}</th>
                                                    <th>{t('processes_col_start')}</th>
                                                    <th>{t('processes_col_end')}</th>
                                                    <th>{t('processes_col_location')}</th>
                                                    <th style={{ width: '120px' }}>{t('processes_col_actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {templateJourneys.map(journey => {
                                                    const employee = usersMap[journey.employee_id] || {};
                                                    return (
                                                        <tr key={journey.id}>
                                                            <td>
                                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{employee.name || `${t('processes_user_id')}: ${journey.employee_id}`}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{employee.email}</div>
                                                            </td>
                                                            <td>
                                                                <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                                                                    {employee.area || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>{t(`role_${(employee.role || 'EMPLOYEE').toLowerCase()}`) || employee.role}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: '35px' }}>{journey.progress}%</span>
                                                                    <div style={{ flex: 1, minWidth: '80px', height: '6px', backgroundColor: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{ width: `${journey.progress}%`, height: '100%', backgroundColor: journey.progress === 100 ? '#22c55e' : 'var(--primary)' }}></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{journey.start_date ? new Date(journey.start_date).toLocaleDateString() : 'N/A'}</td>
                                                            <td>{journey.end_date ? new Date(journey.end_date).toLocaleDateString() : 'N/A'}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                    <MapPin size={12} />
                                                                    <span>{journey.location || t('location_remote')}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        onClick={async () => {
                                                                            const data = await userService.getDashboard(employee.email);
                                                                            setViewingJourney(data);
                                                                        }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 10px', background: 'var(--primary)' }}
                                                                        title={t('processes_btn_detail')}
                                                                    >
                                                                        <Eye size={12} />
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        onClick={() => handleDeleteJourney(journey.id)}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 10px', background: 'var(--danger-light, #fee2e2)', color: '#ef4444', border: '1px solid #fca5a5' }}
                                                                        title={t('processes_btn_delete') || 'Eliminar Proceso'}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Track Progress */}
            {viewingJourney && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '95%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>{t('processes_modal_title')} {viewingJourney.user.name}</h2>
                            <button className="btn btn-secondary" onClick={() => setViewingJourney(null)} style={{ padding: '5px' }}><X size={18} /></button>
                        </div>

                        {!viewingJourney.journey ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>{t('processes_modal_no_journey')}</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('processes_modal_progress_general')}</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{viewingJourney.journey.progress}%</div>
                                    </div>
                                    <div style={{ width: '150px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${viewingJourney.journey.progress}%`, height: '100%', background: 'var(--primary)' }}></div>
                                    </div>
                                </div>

                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('processes_modal_task')}</th>
                                                <th>{t('processes_modal_status')}</th>
                                                <th>{t('processes_modal_evidence')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingJourney.journey.tasks.map(task => (
                                                <tr key={task.id}>
                                                    <td style={{ fontSize: '13px' }}>{task.title}</td>
                                                    <td>
                                                        <span className={`badge ${task.completed ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '10px' }}>
                                                            {task.completed ? t('processes_modal_completed') : t('processes_modal_pending')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {task.document_url ? (
                                                            <a
                                                                href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${task.document_url}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none' }}
                                                            >
                                                                📥 {t('processes_modal_download')}
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{t('processes_modal_no_evidence')}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
