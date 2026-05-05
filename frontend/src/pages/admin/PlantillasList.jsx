import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlantillas, deletePlantilla } from '../../services/plantillaService';

export default function PlantillasList() {
    const [plantillas, setPlantillas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState(null); // stores the id of the template to delete
    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        loadPlantillas();
    }, []);

    const loadPlantillas = async () => {
        try {
            const data = await getPlantillas();
            setPlantillas(data);
        } catch (error) {
            console.error("Error cargando plantillas:", error);
            showToast("Error al cargar las plantillas", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if(!deleteConfirm) return;
        try {
            await deletePlantilla(deleteConfirm);
            setPlantillas(plantillas.filter(p => p.id !== deleteConfirm));
            showToast("Plantilla eliminada correctamente");
        } catch (error) {
            console.error("Error al eliminar plantilla:", error);
            showToast("Error al eliminar la plantilla", "error");
        } finally {
            setDeleteConfirm(null);
        }
    };

    if (loading) return <div className="loading">Cargando plantillas...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>Gestión de Plantillas</h1>
                    <p className="subtitle">Diseña los procesos de onboarding agregando tareas estructuradas.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/admin/plantillas/new')}>
                    + Nueva Plantilla
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Nº Tareas</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plantillas.map(plantilla => (
                            <tr key={plantilla.id}>
                                <td>#{plantilla.id}</td>
                                <td style={{ fontWeight: 500 }}>{plantilla.nombre}</td>
                                <td>{plantilla.descripcion || '-'}</td>
                                <td>
                                    <span style={{background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold'}}>
                                        {plantilla.tareas?.length || 0}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-sm btn-outline" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => navigate(`/admin/plantillas/${plantilla.id}/edit`)}>
                                            Editar
                                        </button>
                                        <button className="btn btn-sm btn-danger" style={{ background: '#ef4444', color: 'white', border: 'none' }} onClick={() => setDeleteConfirm(plantilla.id)}>
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {plantillas.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                    No hay plantillas registradas. Crea tu primera plantilla.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal: Confirmar Eliminación */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: '16px',
                        padding: '2rem', width: '400px', maxWidth: '90vw',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#ef4444' }}>Eliminar Plantilla</h2>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                            ¿Estás seguro de que quieres eliminar esta plantilla de onboarding? Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" style={{ background: '#ef4444', color: 'white', border: 'none' }} onClick={confirmDelete}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    background: toast.type === 'success' ? '#22c55e' : '#ef4444',
                    color: 'white', padding: '1rem 1.5rem', borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontWeight: 500, animation: 'fadeIn 0.3s ease'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
