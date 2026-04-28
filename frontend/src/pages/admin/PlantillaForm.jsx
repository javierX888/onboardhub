import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlantilla, createPlantilla, updatePlantilla } from '../../services/plantillaService';

export default function PlantillaForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    // Array dinámico de tareas
    const [tareas, setTareas] = useState([]);

    useEffect(() => {
        if (isEditing) {
            loadPlantilla();
        }
    }, [id]);

    const loadPlantilla = async () => {
        try {
            const data = await getPlantilla(id);
            setFormData({ nombre: data.nombre, descripcion: data.descripcion || '' });
            // Cargar tareas ordenadas
            const loadedTareas = data.tareas ? [...data.tareas].sort((a, b) => a.orden - b.orden) : [];
            setTareas(loadedTareas);
        } catch (err) {
            console.error(err);
            setError("Error al cargar la plantilla.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // --- Lógica del Builder de Tareas ---

    const addTarea = () => {
        setTareas([
            ...tareas,
            { titulo: '', tipo: 'document', descripcion: '', id_temp: Date.now() }
        ]);
    };

    const updateTarea = (index, field, value) => {
        const newTareas = [...tareas];
        newTareas[index][field] = value;
        setTareas(newTareas);
    };

    const removeTarea = (index) => {
        const newTareas = [...tareas];
        newTareas.splice(index, 1);
        setTareas(newTareas);
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newTareas = [...tareas];
        const temp = newTareas[index - 1];
        newTareas[index - 1] = newTareas[index];
        newTareas[index] = temp;
        setTareas(newTareas);
    };

    const moveDown = (index) => {
        if (index === tareas.length - 1) return;
        const newTareas = [...tareas];
        const temp = newTareas[index + 1];
        newTareas[index + 1] = newTareas[index];
        newTareas[index] = temp;
        setTareas(newTareas);
    };

    // --- Submit ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Preparamos payload asignando el orden final basado en la posición en el array
        const payloadTareas = tareas.map((t, idx) => ({
            titulo: t.titulo,
            tipo: t.tipo,
            descripcion: t.descripcion,
            orden: idx
        }));

        const payload = {
            ...formData,
            client_id: 1, // Mock para la demo
            tareas: payloadTareas
        };

        try {
            if (isEditing) {
                await updatePlantilla(id, payload);
            } else {
                await createPlantilla(payload);
            }
            navigate('/admin/plantillas');
        } catch (err) {
            console.error(err);
            setError("Error al guardar la plantilla. Verifica los datos.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Cargando...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>{isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}</h1>
                    <p className="subtitle">Diseña el proceso de onboarding.</p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/admin/plantillas')}>
                    Volver
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '800px' }}>
                <div className="form-group">
                    <label>Nombre del Proceso / Plantilla *</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="form-control"
                        placeholder="Ej. Onboarding Desarrolladores"
                    />
                </div>
                
                <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Breve descripción del objetivo de este onboarding..."
                        rows="3"
                    />
                </div>

                <hr style={{ margin: '30px 0', borderColor: '#e2e8f0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>Etapas / Tareas ({tareas.length})</h3>
                    <button type="button" className="btn btn-sm btn-primary" onClick={addTarea}>
                        + Agregar Tarea
                    </button>
                </div>

                {tareas.length === 0 ? (
                    <div style={{ background: '#f8fafc', padding: '30px', textAlign: 'center', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
                        <p style={{ color: '#64748b', margin: 0 }}>No has agregado tareas. Haz clic en "Agregar Tarea" para empezar a diseñar el proceso.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                        {tareas.map((tarea, index) => (
                            <div key={tarea.id_temp || index} style={{ 
                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', 
                                padding: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start'
                            }}>
                                {/* Controles de Ordenamiento */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '5px' }}>
                                    <button type="button" onClick={() => moveUp(index)} disabled={index === 0}
                                        style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: '18px' }}
                                        title="Mover Arriba"
                                    >⬆️</button>
                                    <span style={{ textAlign: 'center', fontWeight: 'bold', color: '#94a3b8', fontSize: '12px' }}>{index + 1}</span>
                                    <button type="button" onClick={() => moveDown(index)} disabled={index === tareas.length - 1}
                                        style={{ background: 'none', border: 'none', cursor: index === tareas.length - 1 ? 'not-allowed' : 'pointer', opacity: index === tareas.length - 1 ? 0.3 : 1, fontSize: '18px' }}
                                        title="Mover Abajo"
                                    >⬇️</button>
                                </div>

                                {/* Campos de la tarea */}
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '12px', marginBottom: '5px' }}>Título de la Tarea *</label>
                                        <input
                                            type="text"
                                            value={tarea.titulo}
                                            onChange={(e) => updateTarea(index, 'titulo', e.target.value)}
                                            required
                                            className="form-control"
                                            style={{ padding: '8px' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '12px', marginBottom: '5px' }}>Tipo de Contenido *</label>
                                        <select
                                            value={tarea.tipo}
                                            onChange={(e) => updateTarea(index, 'tipo', e.target.value)}
                                            required
                                            className="form-control"
                                            style={{ padding: '8px' }}
                                        >
                                            <option value="document">Documento (PDF/Doc)</option>
                                            <option value="video">Video Interactivo</option>
                                            <option value="link">Enlace Externo</option>
                                            <option value="form">Formulario / Quiz</option>
                                            <option value="meeting">Reunión / Evento</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                                        <label style={{ fontSize: '12px', marginBottom: '5px' }}>Instrucciones / Descripción (Opcional)</label>
                                        <input
                                            type="text"
                                            value={tarea.descripcion || ''}
                                            onChange={(e) => updateTarea(index, 'descripcion', e.target.value)}
                                            className="form-control"
                                            style={{ padding: '8px' }}
                                        />
                                    </div>
                                </div>

                                {/* Botón eliminar tarea */}
                                <button type="button" onClick={() => removeTarea(index)} 
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '20px', padding: '5px' }}
                                    title="Eliminar Tarea"
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="form-actions" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/plantillas')} disabled={submitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Guardando...' : 'Guardar Plantilla'}
                    </button>
                </div>
            </form>
        </div>
    );
}
