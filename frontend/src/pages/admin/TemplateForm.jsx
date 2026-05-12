import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Trash2, Save, ArrowLeft, Layout } from 'lucide-react';

export default function TemplateForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const [companies, setCompanies] = useState([]);
    const [template, setTemplate] = useState({
        name: '',
        description: '',
        client_id: '',
        tasks: [
            { title: '', description: '', stage: 'Day 1', type: 'document' }
        ]
    });

    useEffect(() => {
        const fetchCompanies = async () => {
            const data = await companyService.getCompanies();
            setCompanies(data);
        };
        fetchCompanies();
    }, []);

    const addTask = () => {
        setTemplate({
            ...template,
            tasks: [...template.tasks, { title: '', description: '', stage: `Day ${template.tasks.length + 1}`, type: 'document' }]
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await templateService.createTemplate({
                ...template,
                client_id: parseInt(template.client_id)
            });
            navigate('/admin/templates');
        } catch (err) {
            alert("Error saving template");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/admin/templates')} style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="page-title">New Onboarding Template</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
                    
                    {/* Left: Tasks List */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Layout size={20} color="var(--primary)" />
                                Onboarding Steps (Tasks)
                            </h3>
                            <button type="button" className="btn btn-secondary" onClick={addTask} style={{ fontSize: '0.85rem' }}>
                                <Plus size={16} /> Add Step
                            </button>
                        </div>

                        {template.tasks.map((task, index) => (
                            <div key={index} style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '12px', 
                                padding: '1rem', 
                                marginBottom: '1.5rem',
                                border: '1px solid var(--border)',
                                position: 'relative'
                            }}>
                                <div className="grid-form" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                    <input 
                                        className="form-input" 
                                        placeholder="Task Title (e.g. Welcome Meeting)"
                                        value={task.title}
                                        onChange={e => updateTask(index, 'title', e.target.value)}
                                        required
                                    />
                                    <input 
                                        className="form-input" 
                                        placeholder="Stage (e.g. Day 1)"
                                        value={task.stage}
                                        onChange={e => updateTask(index, 'stage', e.target.value)}
                                    />
                                </div>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Brief description of what the employee should do..."
                                    style={{ height: '80px', resize: 'none' }}
                                    value={task.description}
                                    onChange={e => updateTask(index, 'description', e.target.value)}
                                />
                                
                                {template.tasks.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeTask(index)}
                                        style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Right: Template Info */}
                    <div className="card" style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Template Settings</h3>
                        
                        <div className="form-group">
                            <label className="form-label">Template Name</label>
                            <input 
                                className="form-input" 
                                type="text" 
                                value={template.name}
                                onChange={e => setTemplate({...template, name: e.target.value})}
                                placeholder="e.g. Sales Onboarding"
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Company</label>
                            <select 
                                className="form-input"
                                value={template.client_id}
                                onChange={e => setTemplate({...template, client_id: e.target.value})}
                                required
                            >
                                <option value="">Select Company...</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={18} /> Save Template
                            </button>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}

const X = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
