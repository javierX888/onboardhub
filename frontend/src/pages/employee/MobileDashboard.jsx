import React, { useState, useEffect } from 'react';
import './MobileDashboard.css';
import { employeeService } from '../../services/employeeService';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileDashboard() {
    const [userData, setUserData] = useState(null);
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // For demo, we use a fixed email or get from local storage
                const email = "empleado@alloxentric.com"; 
                const data = await employeeService.getDashboard(email);
                setUserData(data.user);
                setJourney(data.journey);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const openTaskModal = (task) => {
        setActiveModal(task);
    };

    const handleCompleteTask = () => {
        if(!activeModal) return;

        const updatedTasks = journey.tasks.map(t => 
            t.id === activeModal.id ? { ...t, completed: true } : t
        );
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const newProgress = Math.round((completedCount / updatedTasks.length) * 100);
        
        setJourney({ 
            ...journey, 
            tasks: updatedTasks, 
            progress: newProgress 
        });
        
        setActiveModal(null);
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
                            Preview enabled for next sprint!
                        </p>
                    </div>

                    <div style={{display:'flex', gap: '10px', width: '100%'}}>
                        <button 
                            onClick={() => setActiveModal(null)}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
                        >{t('btn_cancel')}</button>
                        <button 
                            onClick={handleCompleteTask}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >✓ {t('btn_complete') || 'Complete'}</button>
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
        </div>
    );
}
