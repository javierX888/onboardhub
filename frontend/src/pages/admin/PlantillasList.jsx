import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlantillas, deletePlantilla } from '../../services/plantillaService';

export default function PlantillasList() {
    const [plantillas, setPlantillas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPlantillas();
    }, []);

    const loadPlantillas = async () => {
        try {
            const data = await getPlantillas();
            setPlantillas(data);
        } catch (error) {
            console.error("Error cargando plantillas:", error);
            alert("Error al cargar las plantillas");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
            try {
                await deletePlantilla(id);
                setPlantillas(plantillas.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error al eliminar plantilla:", error);
                alert("Error al eliminar la plantilla");
            }
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
                                    <span style={{background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold'}}>
                                        {plantilla.tareas?.length || 0}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/admin/plantillas/${plantilla.id}/edit`)}>
                                            Editar
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(plantilla.id)}>
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
        </div>
    );
}
