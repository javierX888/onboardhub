import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import { companyService } from '../../services/companyService';
import { areaService } from '../../services/areaService';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Trash2, Save, ArrowLeft, Layout, ChevronUp, ChevronDown } from 'lucide-react';

export default function TemplateForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const AREAS = ["Planta", "Área TI", "Finanzas", "Ventas", "Recursos Humanos", "Marketing", "Operaciones"];
    const STAGES = Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`);
    const TASK_TYPES = [
        { value: 'read_text', label: 'Leer Texto (Bienvenida)' },
        { value: 'read_document', label: 'Ver Documento / Enlace externo' },
        { value: 'watch_video', label: 'Ver Video' },
        { value: 'upload_document', label: 'Subir Archivo (Empleado)' }
    ];

    const [companies, setCompanies] = useState([]);
    const [allTemplates, setAllTemplates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [isAdminRole, setIsAdminRole] = useState(false);
    const [template, setTemplate] = useState({
        name: '',
        description: '',
        area: '',
        client_id: '',
        parent_template_id: null,
        tasks: [
            { title: '', description: '', stage: 'Day 1', type: 'read_text', resource_url: '', is_evidence_mandatory: false }
        ]
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
            const isAdmin = authUser.role === 'SUPERADMIN';
            setIsAdminRole(isAdmin);
            
            let currentClientId = authUser.client_id;
            
            if (id) {
                try {
                    const existingTemplate = await templateService.getTemplate(id);
                    setTemplate(existingTemplate);
                    currentClientId = existingTemplate.client_id;
                } catch (err) {
                    console.error("Error loading template", err);
                    alert("Error loading template");
                }
            } else if (!isAdmin) {
                setTemplate(prev => ({ ...prev, client_id: authUser.client_id }));
            }

            try {
                if (isAdmin) {
                    const companiesData = await companyService.getCompanies();
                    setCompanies(companiesData);
                }
                const templatesData = await templateService.getTemplates();
                setAllTemplates(templatesData);
            } catch (err) {
                console.error("Error loading templates list", err);
            }
        };
        fetchInitialData();
    }, [id]);

    useEffect(() => {
        const fetchAreas = async () => {
            if (template.client_id) {
                try {
                    const data = await areaService.getAreas(template.client_id);
                    setAreas(data);
                } catch (err) {
                    console.error("Error loading areas", err);
                }
            }
        };
        fetchAreas();
    }, [template.client_id]);

    const addTask = () => {
        let nextStage = 'Day 1';
        if (template.tasks.length > 0) {
            const lastStage = template.tasks[template.tasks.length - 1].stage || 'Day 1';
            const num = parseInt(lastStage.replace('Day ', '')) || 1;
            nextStage = `Day ${Math.min(31, num + 1)}`;
        }
        setTemplate({
            ...template,
            tasks: [...template.tasks, { title: '', description: '', stage: nextStage, type: 'read_text', resource_url: '', is_evidence_mandatory: false }]
        });
    };

    const removeTask = (index) => {
        const newTasks = template.tasks.filter((_, i) => i !== index);
        setTemplate({ ...template, tasks: newTasks });
    };

    const updateTask = (index, field, value) => {
        const newTasks = [...template.tasks];
        newTasks[index][field] = value;
        setTemplate({ ...template, tasks: newTasks });
    };

    const moveTask = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === template.tasks.length - 1) return;

        const newTasks = [...template.tasks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap the tasks
        const tempTask = newTasks[index];
        newTasks[index] = newTasks[targetIndex];
        newTasks[targetIndex] = tempTask;

        // Swap their stages so they take the stage of the position they moved to
        const tempStage = newTasks[index].stage;
        newTasks[index].stage = newTasks[targetIndex].stage;
        newTasks[targetIndex].stage = tempStage;

        setTemplate({ ...template, tasks: newTasks });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const templateData = {
                ...template,
                client_id: parseInt(template.client_id),
                parent_template_id: template.parent_template_id ? parseInt(template.parent_template_id) : null
            };
            if (id) {
                await templateService.updateTemplate(id, templateData);
            } else {
                await templateService.createTemplate(templateData);
            }
            navigate('/admin/templates');
        } catch (err) {
            console.error(err);
            alert("Error saving template");
        }
    };

    // Filter templates to list only those from the same client and excluding this template
    const filteredTemplates = allTemplates.filter(t => 
        t.client_id === parseInt(template.client_id) && 
        t.id !== parseInt(id)
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-secondary" type="button" onClick={() => navigate('/admin/templates')} style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="page-title">{id ? 'Edit Onboarding Template' : 'New Onboarding Template'}</h1>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 1fr 2fr columns layout: Settings on Left, Steps on Right */}
                <div className="grid-form" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>

                    {/* Left: Template Settings */}
                    <div className="card" style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Template Settings</h3>

                        <div className="form-group">
                            <label className="form-label">Template Name</label>
                            <input
                                className="form-input"
                                type="text"
                                value={template.name}
                                onChange={e => setTemplate({ ...template, name: e.target.value })}
                                placeholder="e.g. Sales Onboarding"
                                required
                            />
                        </div>

                        {isAdminRole && (
                            <div className="form-group">
                                <label className="form-label">Company</label>
                                <select
                                    className="form-input"
                                    value={template.client_id}
                                    onChange={e => setTemplate({ ...template, client_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Company...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Área</label>
                            <select
                                className="form-input"
                                value={template.area}
                                onChange={e => setTemplate({ ...template, area: e.target.value })}
                                required
                            >
                                <option value="">Seleccione Área...</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.name}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Link Previous Process */}
                        <div className="form-group">
                            <label className="form-label">Proceso anterior vinculante</label>
                            <select
                                className="form-input"
                                value={template.parent_template_id || ''}
                                onChange={e => setTemplate({ ...template, parent_template_id: e.target.value ? parseInt(e.target.value) : null })}
                            >
                                <option value="">Ninguno (Proceso Inicial)</option>
                                {filteredTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.area || 'General'})</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                Permite encadenar onboardings mayores a 31 días.
                            </span>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={18} /> Save Template
                            </button>
                        </div>
                    </div>

                    {/* Right: Onboarding Steps (Tasks) */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <Layout size={20} color="var(--primary)" />
                                Onboarding Steps
                            </h3>
                            <button type="button" className="btn btn-secondary" onClick={addTask} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Plus size={16} /> Add Step
                            </button>
                        </div>

                        {template.tasks.map((task, index) => (
                            <div key={index} style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                marginBottom: '1.5rem',
                                border: '1px solid var(--border)',
                                position: 'relative'
                            }}>
                                <div className="grid-form" style={{ gap: '1rem', marginBottom: '1rem', gridTemplateColumns: '3fr 1fr' }}>
                                    <input
                                        className="form-input"
                                        placeholder="Task Title (e.g. Welcome Meeting)"
                                        value={task.title}
                                        onChange={e => updateTask(index, 'title', e.target.value)}
                                        required
                                    />
                                    {/* Day Dropdown */}
                                    <select
                                        className="form-input"
                                        value={task.stage}
                                        onChange={e => updateTask(index, 'stage', e.target.value)}
                                        required
                                    >
                                        {STAGES.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="grid-form" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <select
                                            className="form-input"
                                            value={task.type}
                                            onChange={e => updateTask(index, 'type', e.target.value)}
                                        >
                                            {TASK_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {(task.type === 'read_document' || task.type === 'watch_video') && (
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <input
                                                className="form-input"
                                                type="url"
                                                placeholder="Enlace al Documento o Video (Ej. Drive, YouTube)"
                                                value={task.resource_url || ''}
                                                onChange={e => updateTask(index, 'resource_url', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <textarea
                                    className="form-input"
                                    placeholder="Brief description of what the employee should do..."
                                    style={{ height: '80px', resize: 'none', marginBottom: '0.5rem' }}
                                    value={task.description || ''}
                                    onChange={e => updateTask(index, 'description', e.target.value)}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', marginTop: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id={`evidence-mandatory-${index}`}
                                        checked={task.is_evidence_mandatory || false}
                                        onChange={e => updateTask(index, 'is_evidence_mandatory', e.target.checked)}
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <label htmlFor={`evidence-mandatory-${index}`} style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', margin: 0, color: 'var(--text-main)' }}>
                                        ¿El empleado debe subir evidencia obligatoriamente para completar esta tarea?
                                    </label>
                                </div>

                                {/* Card Actions (Move Up / Down & Remove) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => moveTask(index, 'up')}
                                            disabled={index === 0}
                                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                                        >
                                            <ChevronUp size={14} /> Subir
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => moveTask(index, 'down')}
                                            disabled={index === template.tasks.length - 1}
                                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                                        >
                                            <ChevronDown size={14} /> Bajar
                                        </button>
                                    </div>

                                    {template.tasks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTask(index)}
                                            style={{ 
                                                background: 'rgba(239, 68, 68, 0.1)', 
                                                color: '#ef4444', 
                                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                borderRadius: '6px', 
                                                padding: '6px 12px', 
                                                fontSize: '0.8rem', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Trash2 size={14} /> {t('btn_delete')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </form>
        </div>
    );
}
