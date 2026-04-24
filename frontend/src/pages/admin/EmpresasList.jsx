import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmpresas } from '../../services/empresaService';

export default function EmpresasList() {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const data = await getEmpresas();
                setEmpresas(data);
            } catch (err) {
                console.error("Error fetching empresas", err);
                setError("No se pudo conectar al backend. Verifica que el servidor esté corriendo.");
            } finally {
                setLoading(false);
            }
        };

        fetchEmpresas();
    }, []);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Empresas</h1>
                    <p className="page-subtitle">Administra los tenants (clientes) del sistema OnBoardHub.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/admin/empresas/new')}>
                    + Nueva Empresa
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <p>Cargando empresas...</p>
                ) : error ? (
                    <p style={{ color: '#ef4444' }}>{error}</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>RUT</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empresas.map((emp) => (
                                <tr key={emp.id}>
                                    <td><strong>#{emp.id}</strong></td>
                                    <td>{emp.nombre}</td>
                                    <td>{emp.rut}</td>
                                    <td>
                                        <span className={`badge ${emp.estado ? 'badge-active' : 'badge-inactive'}`}>
                                            {emp.estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}
                                            onClick={() => navigate(`/admin/empresas/${emp.id}/edit`)}>
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {empresas.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>No hay empresas registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

