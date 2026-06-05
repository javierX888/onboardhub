import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { journeyService } from '../../services/employeeService';
import { useLanguage } from '../../context/LanguageContext';
import { Briefcase, CheckCircle, Clock, MapPin, Eye, X, ShieldAlert, Award } from 'lucide-react';
import api from '../../services/api';

export default function ProcessesList() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [viewingJourney, setViewingJourney] = useState(null);
    const [currentUserDb, setCurrentUserDb] = useState(null);

    const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');

    const fetchData = async () => {
        setLoading(true);
        try {
            const clientId = authUser.client_id || 1;
            const [usersData, journeysData] = await Promise.all([
                userService.getUsersByCompany(clientId),
                journeyService.getJourneysByCompany(clientId)
            ]);

            setUsers(usersData);
            setJourneys(journeysData);

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

    // Statistics
    const totalCount = filteredJourneys.length;
    const completedCount = filteredJourneys.filter(j => j.progress === 100).length;
    const activeCount = totalCount - completedCount;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">{t('sidebar_procesos')}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Control y seguimiento de procesos de inducción y onboarding.
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
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vista de Rol: {currentUserDb.role}</span>
                        <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {currentUserDb.role === 'ADMIN' && 'Visualizando todos los procesos de onboarding de la empresa.'}
                            {currentUserDb.role === 'SUPERVISOR_ONBOARDING' && `Visualizando procesos bajo tu supervisión directa.`}
                            {currentUserDb.role === 'ENCARGADO_AREA' && `Visualizando procesos del área de: ${currentUserDb.area}`}
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
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Procesos Totales</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalCount}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '12px', borderRadius: '12px' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>En Progreso</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{activeCount}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '12px', borderRadius: '12px' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Completados</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{completedCount}</div>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card" style={{ padding: '0' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Cargando procesos...
                    </div>
                ) : filteredJourneys.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                        <h3>No hay procesos de onboarding activos en este momento</h3>
                    </div>
                ) : (
                    <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                        <table className="data-table" style={{ minWidth: '900px', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Área</th>
                                    <th>Rol</th>
                                    <th>Progreso</th>
                                    <th>Fecha Inicio</th>
                                    <th>Fecha Fin</th>
                                    <th>Ubicación</th>
                                    <th style={{ width: '100px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJourneys.map(journey => {
                                    const employee = usersMap[journey.employee_id] || {};
                                    return (
                                        <tr key={journey.id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{employee.name || `Usuario ID: ${journey.employee_id}`}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{employee.email}</div>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                                                    {employee.area || 'N/A'}
                                                </span>
                                            </td>
                                            <td>{employee.role || 'EMPLOYEE'}</td>
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
                                                    <span>{journey.location || 'Remoto'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={async () => {
                                                        const data = await userService.getDashboard(employee.email);
                                                        setViewingJourney(data);
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 12px', background: 'var(--primary)' }}
                                                >
                                                    <Eye size={12} />
                                                    Ver Detalle
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Track Progress */}
            {viewingJourney && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '95%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Progreso de {viewingJourney.user.name}</h2>
                            <button className="btn btn-secondary" onClick={() => setViewingJourney(null)} style={{ padding: '5px' }}><X size={18} /></button>
                        </div>

                        {!viewingJourney.journey ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>No hay un proceso de onboarding activo asignado a este colaborador.</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progreso General</div>
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
                                                <th>Tarea</th>
                                                <th>Estado</th>
                                                <th>Evidencia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingJourney.journey.tasks.map(task => (
                                                <tr key={task.id}>
                                                    <td style={{ fontSize: '13px' }}>{task.title}</td>
                                                    <td>
                                                        <span className={`badge ${task.completed ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '10px' }}>
                                                            {task.completed ? 'Completada' : 'Pendiente'}
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
                                                                📥 Descargar Evidencia
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Sin evidencia</span>
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
