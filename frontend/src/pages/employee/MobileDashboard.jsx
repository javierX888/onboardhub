import React, { useState, useEffect } from 'react';
import './MobileDashboard.css';
import { getEmpleadoJourney } from '../../services/empleadoService';

export default function MobileDashboard() {
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                const EMPEADO_ID = 1;
                const data = await getEmpleadoJourney(EMPEADO_ID);
                setJourney(data);
            } catch (error) {
                console.error("Error fetching journey data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJourney();
    }, []);

    const openTaskModal = (task) => {
        setActiveModal(task);
    };

    const handleCompleteTask = () => {
        if(!activeModal) return;

        const updatedTasks = journey.tasks.map(t => 
            t.id === activeModal.id ? { ...t, completada: true } : t
        );
        const completedCount = updatedTasks.filter(t => t.completada).length;
        const newProgress = Math.round((completedCount / updatedTasks.length) * 100);
        
        setJourney({ 
            ...journey, 
            tasks: updatedTasks, 
            progreso: newProgress 
        });
        
        setActiveModal(null); // Cerrar Modal
    };

    const handleNavClick = (tabName) => {
        if (tabName !== 'journey') {
            alert(`La sección "${tabName}" está en construcción y será completada en el siguiente Sprint.`);
        }
    };

    if (loading) {
        return <div className="mobile-super-container" style={{ color: 'white' }}>Cargando OnBoardHub...</div>;
    }

    if (!journey) {
        return <div className="mobile-super-container" style={{ color: 'white' }}>Error conectando al backend</div>;
    }

    // Render del Contenido Simulado del Modal según tipo
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
                    <h2 style={{fontSize: '18px', marginBottom: '10px'}}>{activeModal.titulo}</h2>
                    <span style={{display:'inline-block', padding:'5px 10px', background:'#eef2ff', color:'#4f46e5', borderRadius:'10px', fontSize:'12px', marginBottom: '20px'}}>
                        {activeModal.tipo.toUpperCase()}
                    </span>
                    
                    <div style={{
                        background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '20px',
                        border: '1px dashed #cbd5e1'
                    }}>
                        {activeModal.tipo === 'video' && <div style={{fontSize: '40px'}}>▶️</div>}
                        {activeModal.tipo === 'pdf' && <div style={{fontSize: '40px'}}>📄</div>}
                        {activeModal.tipo === 'document' && <div style={{fontSize: '40px'}}>✍️</div>}
                        {activeModal.tipo === 'link' && <div style={{fontSize: '40px'}}>🔗</div>}
                        
                        <p style={{marginTop: '10px', fontSize: '14px', color: '#64748b'}}>
                            Previsualización interactiva de contenido inhabilitada en la versión prototipo. ¡Imagina el mejor visor renderizado aquí!
                        </p>
                    </div>

                    <div style={{display:'flex', gap: '10px', width: '100%'}}>
                        <button 
                            onClick={() => setActiveModal(null)}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
                        >Cancelar</button>
                        <button 
                            onClick={handleCompleteTask}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >✓ Marcar Completada</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mobile-super-container">
            <div className="phone-frame">
                
                {/* Modal Overlay en nivel superior del celular */}
                {activeModal && renderModalContent()}

                {/* Status Bar Simulada */}
                <div className="status-bar">
                    <span className="status-bar-time">9:41</span>
                    <div className="status-bar-icons">
                        <span style={{ fontSize: '10px' }}>5G 🔋</span>
                    </div>
                </div>
                <div className="dynamic-island"></div>

                {/* Contenido App */}
                <div className="app-content">
                    <div className="screen journey-screen">
                        
                        <div className="journey-header">
                            <h1 className="journey-greeting">Hola Empleado 👋</h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Continuemos tu inducción como {journey.rol}</p>
                        </div>

                        <div className="journey-progress-card">
                            <div>
                                <h3 style={{ color: 'white', marginBottom: '5px' }}>Progreso de Onboarding</h3>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                    {journey.progreso}%
                                </div>
                            </div>
                        </div>

                        <div className="journey-content">
                            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Tu línea de tiempo</h3>
                            
                            <div className="timeline">
                                {journey.tasks.map((task, idx) => {
                                    const isCompleted = task.completada;
                                    const isCurrent = !isCompleted && (idx === 0 || journey.tasks[idx - 1].completada);
                                    const isLocked = !isCompleted && !isCurrent;
                                    
                                    return (
                                        <div className="timeline-item" key={task.id}>
                                            <div className={`timeline-marker ${isCompleted ? 'completed' : isCurrent ? 'current' : 'locked'}`}>
                                                {isCompleted ? '✓' : isLocked ? '🔒' : <span style={{fontSize:'16px'}}>🗓️</span>}
                                            </div>
                                            
                                            <div className={`timeline-card ${isLocked ? 'locked' : ''}`}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{task.etapa}</div>
                                                    {isCompleted && task.id === 1 && <div style={{ color: '#fbbf24', fontSize:'10px' }}>⭐⭐⭐⭐</div>}
                                                </div>
                                                <div className="timeline-card-title">{task.titulo}</div>
                                                
                                                {task.descripcion && isCurrent && (
                                                    <p style={{ fontSize: '12px', color: '#0f62fe', background:'#eef2ff', padding:'5px', borderRadius:'5px', marginTop:'5px' }}>
                                                        {task.descripcion}
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
                                                        <span>{task.id === 2 ? '📅' : '👉'}</span> {task.texto_boton}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bottom-nav">
                    <button className="nav-item active" onClick={() => handleNavClick('mi_viaje')}>
                        <span style={{ fontSize: '20px' }}>🏠</span>
                        <span>Mi viaje</span>
                    </button>
                    <button className="nav-item" onClick={() => handleNavClick('tareas')}>
                        <span style={{ fontSize: '20px' }}>✔️</span>
                        <span>Tareas</span>
                    </button>
                    <button className="nav-item" onClick={() => handleNavClick('recursos')}>
                        <span style={{ fontSize: '20px' }}>📁</span>
                        <span>Recursos</span>
                    </button>
                    <button className="nav-item" onClick={() => handleNavClick('perfil')}>
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <span>Perfil</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
