import React, { useState, useEffect } from 'react';
import './MobileDashboard.css';
import { employeeService, journeyService } from '../../services/employeeService';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileDashboard() {
    const [userData, setUserData] = useState(null);
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null); // Custom Toast state
    const [email, setEmail] = useState(sessionStorage.getItem('onboardhub_employee_email') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('onboardhub_employee_email'));
    const { t } = useLanguage();

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
            alert("Usuario no encontrado o error de conexión");
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
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Acceso Empleado</h2>
                    <div className="form-group">
                        <label className="form-label">Email de la Empresa</label>
                        <input 
                            className="form-input" 
                            type="email" 
                            placeholder="ej: javier@alloxentric.com"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Entrar al Onboarding</button>
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
            showToast("✅ Tarea completada con éxito", "success");
        } catch (error) {
            console.error("Error completing task", error);
            let errorMsg = "Error al completar la tarea";
            
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
                        {activeModal.type === 'video' && <div style={{fontSize: '40px'}}>▶️</div>}
                        {activeModal.type === 'pdf' && <div style={{fontSize: '40px'}}>📄</div>}
                        {activeModal.type === 'document' && <div style={{fontSize: '40px'}}>✍️</div>}
                        {activeModal.type === 'link' && <div style={{fontSize: '40px'}}>🔗</div>}
                        
                        <p style={{marginTop: '10px', fontSize: '14px', color: '#64748b'}}>
                            {activeModal.description || 'Por favor completa esta etapa para continuar.'}
                        </p>

                        {(activeModal.type === 'document' || activeModal.type === 'pdf') && !activeModal.completed && (
                            <div style={{ marginTop: '15px', textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', display: 'block', marginBottom: '5px' }}>
                                    Subir documento (PDF, JPG, PNG)
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
                                ✅ Tarea completada
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
                                disabled={isUploading || ((activeModal.type === 'document' || activeModal.type === 'pdf') && !selectedFile)}
                            >
                                {isUploading ? 'Subiendo...' : 'Completar'}
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
                        
                        <div className="journey-header">
                            <h1 className="journey-greeting">Hi, {userData.name} 👋</h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Onboarding at {journey?.location || 'Alloxentric'}</p>
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
                            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Timeline</h3>
                            
                            {!journey ? <p>No active journey.</p> : (
                                <div className="timeline">
                                    {journey.tasks.map((task, idx) => {
                                        const isCompleted = task.completed;
                                        const isCurrent = !isCompleted && (idx === 0 || journey.tasks[idx - 1].completed);
                                        const isLocked = !isCompleted && !isCurrent;
                                        
                                        return (
                                            <div className="timeline-item" key={task.id}>
                                                <div className={`timeline-marker ${isCompleted ? 'completed' : isCurrent ? 'current' : 'locked'}`}>
                                                    {isCompleted ? '✓' : isLocked ? '🔒' : <span style={{fontSize:'16px'}}>🗓️</span>}
                                                </div>
                                                
                                                <div className={`timeline-card ${isLocked ? 'locked' : ''}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{task.stage}</div>
                                                    </div>
                                                    <div className="timeline-card-title">{task.title}</div>
                                                    
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
                                                            <span>👉</span> Open Task
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
                        <span>Home</span>
                    </button>
                    <button className="nav-item">
                        <span style={{ fontSize: '20px' }}>✔️</span>
                        <span>Tasks</span>
                    </button>
                    <button className="nav-item">
                        <span style={{ fontSize: '20px' }}>📁</span>
                        <span>Files</span>
                    </button>
                    <button className="nav-item">
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <span>Profile</span>
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
