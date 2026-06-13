import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileDashboard.css';
import { employeeService, journeyService } from '../../services/employeeService';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
    const initialEmail = sessionStorage.getItem('onboardhub_employee_email') || authUser.email || '';
    const [userData, setUserData] = useState(null);
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null); // Custom Toast state
    const [email, setEmail] = useState(initialEmail);
    const [isLoggedIn, setIsLoggedIn] = useState(!!initialEmail);
    const { t, language } = useLanguage();
    
    // Detectar si es usuario autenticado del sistema (no solo acceso móvil)
    const isFromWeb = location.pathname === '/employee/mobile';

    useEffect(() => {
        if (isLoggedIn && email) {
            fetchDashboard();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn, email]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getDashboard(email);
            setUserData(data.user);
            setJourney(data.journey);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
            alert(t('mobile_user_not_found'));
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (email) {
            sessionStorage.setItem('onboardhub_employee_email', email);
            setIsLoggedIn(true);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('onboardhub_employee_email');
        setIsLoggedIn(false);
        setUserData(null);
        setJourney(null);
    };

    if (!isLoggedIn) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '20px' }}>
                <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: '350px', padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t('mobile_access_title')}</h2>
                    <div className="form-group">
                        <label className="form-label">{t('mobile_email_label')}</label>
                        <input 
                            className="form-input" 
                            type="email" 
                            placeholder="ej: javier@alloxentric.com"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>{t('mobile_btn_enter')}</button>
                </form>
            </div>
        );
    }

    const openTaskModal = (task) => {
        setActiveModal(task);
    };

    const handleCompleteTask = async () => {
        if(!activeModal) return;
        setIsUploading(true);

        try {
            const result = await journeyService.completeTask(
                activeModal.id, 
                userData.client_id, 
                selectedFile
            );

            // Update local state
            const updatedTasks = journey.tasks.map(t => 
                t.id === activeModal.id ? { ...t, completed: true, document_url: result.document_url } : t
            );
            
            setJourney({ 
                ...journey, 
                tasks: updatedTasks, 
                progress: result.progress 
            });
            
            setActiveModal(null);
            setSelectedFile(null);
            showToast(t('mobile_task_completed_success'), "success");
        } catch (error) {
            console.error("Error completing task", error);
            let errorMsg = t('mobile_task_completed_error');
            
            // Extract detailed error from FastAPI
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    // FastAPI validation error array
                    errorMsg = error.response.data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
                } else {
                    errorMsg = error.response.data.detail;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            showToast(`❌ ${errorMsg}`, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const showToast = (message, type = "success") => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    if (loading) {
        return <div className="mobile-super-container" style={{ color: 'white' }}>{t('msg_loading') || 'Loading...'}</div>;
    }

    if (!userData) {
        return <div className="mobile-super-container" style={{ color: 'white' }}>{t('msg_error_generic')}</div>;
    }

    const renderModalContent = () => {
        if(!activeModal) return null;
        
        return (
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.85)', zIndex: 999, borderRadius: '40px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}>
                <div style={{
                    background: 'white', width: '100%', borderRadius: '20px', padding: '20px', textAlign: 'center'
                }}>
                    <h2 style={{fontSize: '18px', marginBottom: '10px'}}>{activeModal.title}</h2>
                    <span style={{display:'inline-block', padding:'5px 10px', background:'#eef2ff', color:'#4f46e5', borderRadius:'10px', fontSize:'12px', marginBottom: '20px'}}>
                        {(activeModal.type || 'TASK').toUpperCase()}
                    </span>
                    
                    <div style={{
                        background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '20px',
                        border: '1px dashed #cbd5e1'
                    }}>
                        {activeModal.type === 'watch_video' && <div style={{fontSize: '40px'}}>▶️</div>}
                        {activeModal.type === 'read_document' && <div style={{fontSize: '40px'}}>📄</div>}
                        {activeModal.type === 'upload_document' && <div style={{fontSize: '40px'}}>✍️</div>}
                        {activeModal.type === 'read_text' && <div style={{fontSize: '40px'}}>👋</div>}
                        
                        <p style={{marginTop: '10px', fontSize: '14px', color: '#64748b'}}>
                            {activeModal.description || t('mobile_default_description')}
                        </p>

                        {/* Resource URL button for reading/watching */}
                        {activeModal.resource_url && (
                            <div style={{ marginTop: '15px' }}>
                                <a 
                                    href={activeModal.resource_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        gap: '8px', 
                                        textDecoration: 'none', 
                                        padding: '10px 20px', 
                                        borderRadius: '10px', 
                                        fontSize: '13px', 
                                        background: '#4f46e5', 
                                        color: 'white',
                                        fontWeight: 'bold',
                                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                                    }}
                                >
                                    {activeModal.type === 'watch_video' ? t('mobile_btn_watch_video') : t('mobile_btn_open_resource')}
                                </a>
                            </div>
                        )}

                        {activeModal.type === 'upload_document' && !activeModal.completed && (
                            <div style={{ marginTop: '15px', textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', display: 'block', marginBottom: '5px' }}>
                                    {t('mobile_upload_evidence_label')}
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    style={{ fontSize: '12px', width: '100%', padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        )}

                        {activeModal.completed && (
                            <div style={{ marginTop: '15px', color: '#10b981', fontWeight: 'bold' }}>
                                {t('mobile_task_completed_badge')}
                            </div>
                        )}
                    </div>

                    <div style={{display:'flex', gap: '10px', width: '100%'}}>
                        <button 
                            onClick={() => {
                                setActiveModal(null);
                                setSelectedFile(null);
                            }}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
                            disabled={isUploading}
                        >{t('btn_cancel')}</button>
                        
                        {!activeModal.completed && (
                            <button 
                                onClick={handleCompleteTask}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#4f46e5', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                disabled={isUploading || (activeModal.type === 'upload_document' && !selectedFile)}
                            >
                                {isUploading ? (selectedFile ? t('mobile_status_uploading') : t('mobile_status_completing')) : t('mobile_btn_complete')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mobile-super-container">
            <div className="phone-frame">
                
                {activeModal && renderModalContent()}

                <div className="status-bar">
                    <span className="status-bar-time">9:41</span>
                    <div className="status-bar-icons">
                        <span style={{ fontSize: '10px' }}>5G 🔋</span>
                    </div>
                </div>
                <div className="dynamic-island"></div>

                <div className="app-content">
                    <div className="screen journey-screen">
                        
                        {/* Botón para volver a vista web */}
                        {isFromWeb && (
                            <button
                                onClick={() => navigate('/employee/dashboard')}
                                style={{ 
                                    marginBottom: '1rem', 
                                    padding: '0.5rem 1rem',
                                    background: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    width: '100%'
                                }}
                                className="btn btn-secondary"
                            >
                                {t('mobile_btn_back_web')}
                            </button>
                        )}
                        
                        <div className="journey-header">
                            <h1 className="journey-greeting">{t('mobile_greeting')}, {userData.name} 👋</h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>{t('mobile_onboarding_at')} {journey?.location || 'Alloxentric'}</p>
                        </div>

                        <div className="journey-progress-card">
                            <div>
                                <h3 style={{ color: 'white', marginBottom: '5px' }}>{t('onboarding_progress') || 'Progress'}</h3>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                    {journey?.progress || 0}%
                                </div>
                            </div>
                        </div>

                        <div className="journey-content">
                            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>{t('mobile_timeline')}</h3>
                            
                            {!journey ? <p>{t('employee_portal_no_journey')}</p> : (
                                <div className="timeline">
                                    {journey.tasks.map((task, idx) => {
                                        const isCompleted = task.completed;
                                        const isCurrent = !isCompleted && (idx === 0 || journey.tasks[idx - 1].completed);
                                        const isLocked = !isCompleted && !isCurrent;
                                        const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < new Date();
                                        
                                        return (
                                            <div className="timeline-item" key={task.id}>
                                                <div className={`timeline-marker ${isCompleted ? 'completed' : isCurrent ? 'current' : 'locked'}`}>
                                                    {isCompleted ? '✓' : isLocked ? '🔒' : <span style={{fontSize:'16px'}}>🗓️</span>}
                                                </div>
                                                
                                                <div className={`timeline-card ${isLocked ? 'locked' : ''}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>{task.stage}</div>
                                                        <div style={{ 
                                                            fontSize: '10px', 
                                                            padding: '2px 6px', 
                                                            borderRadius: '4px', 
                                                            background: isCompleted ? '#dcfce7' : isOverdue ? '#fee2e2' : '#e0e7ff', 
                                                            color: isCompleted ? '#166534' : isOverdue ? '#991b1b' : '#3730a3',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {isCompleted ? t('mobile_status_completed') : isOverdue ? t('mobile_status_overdue') : t('mobile_status_pending')}
                                                        </div>
                                                    </div>
                                                    <div className="timeline-card-title">{task.title}</div>
                                                    
                                                    {task.deadline && (
                                                        <div style={{ fontSize: '11px', color: isOverdue ? '#ef4444' : '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>📅</span> {t('mobile_label_due')} {new Date(task.deadline).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    
                                                    {task.description && isCurrent && (
                                                        <p style={{ fontSize: '12px', color: '#0f62fe', background:'#eef2ff', padding:'5px', borderRadius:'5px', marginTop:'5px' }}>
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    {isCurrent && (
                                                        <button 
                                                            onClick={() => openTaskModal(task)}
                                                            style={{
                                                                marginTop: '15px', 
                                                                width: '100%',
                                                                background: '#4f46e5',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '12px 15px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            <span>👉</span> {t('mobile_btn_open_task')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bottom-nav">
                    <button className="nav-item active">
                        <span style={{ fontSize: '20px' }}>🏠</span>
                        <span>{t('mobile_nav_home')}</span>
                    </button>
                    <button className="nav-item">
                        <span style={{ fontSize: '20px' }}>✔️</span>
                        <span>{t('mobile_nav_tasks')}</span>
                    </button>
                    <button className="nav-item">
                        <span style={{ fontSize: '20px' }}>📁</span>
                        <span>{t('mobile_nav_files')}</span>
                    </button>
                    <button className="nav-item">
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <span>{t('mobile_nav_profile')}</span>
                    </button>
                </div>
            </div>

            {/* Premium Toast Notification */}
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'fadeInUp 0.3s ease-out'
                }}>
                    {toastMessage.message}
                </div>
            )}
        </div>
    );
}
