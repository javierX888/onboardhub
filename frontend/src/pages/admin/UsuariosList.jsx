import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { asignarJourney } from '../../services/journeyService';
import { getPlantillas } from '../../services/plantillaService';

export default function UsuariosList() {
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '', nombre: '', password: '', rol: 'EMPLEADO', client_id: ''
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Estados para Asignación de Journey (HU-04)
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignUser, setAssignUser] = useState(null);
    const [plantillas, setPlantillas] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [assignData, setAssignData] = useState({
        plantilla_id: '',
        fecha_inicio: '',
        fecha_termino: ''
    });

    const fetchData = async () => {
        try {
            const [empRes, empresasRes] = await Promise.all([
                api.get('/empresas/'),
                api.get('/empresas/')
            ]);
            setEmpresas(empRes.data);
            // Load users from all empresas
            const allUsers = [];
            for (const empresa of empRes.data) {
                try {
                    const res = await api.get(`/usuarios/empresa/${empresa.id}`);
                    allUsers.push(...res.data);
                } catch { /* skip */ }
            }
            setUsuarios(allUsers);
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            if (editingUser) {
                await api.put(`/usuarios/${editingUser.id}`, {
                    nombre: formData.nombre,
                    rol: formData.rol
                });
            } else {
                await api.post('/usuarios/', {
                    ...formData,
                    client_id: parseInt(formData.client_id)
                });
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ email: '', nombre: '', password: '', rol: 'EMPLEADO', client_id: '' });
            setLoading(true);
            fetchData();
        } catch (err) {
            setFormError(err.response?.data?.detail || 'Error al guardar usuario');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (usr) => {
        setEditingUser(usr);
        setFormData({ email: usr.email, nombre: usr.nombre, password: '', rol: usr.rol, client_id: String(usr.client_id) });
        setFormError('');
        setShowModal(true);
    };

    const openAssignModal = async (usr) => {
        setAssignUser(usr);
        setAssignError('');
        setAssignData({ plantilla_id: '', fecha_inicio: '', fecha_termino: '' });
        setShowAssignModal(true);
        try {
            const data = await getPlantillas();
            setPlantillas(data);
        } catch (error) {
            console.error("Error cargando plantillas:", error);
            setAssignError("Error al cargar las plantillas disponibles.");
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        setAssignError('');
        setAssignLoading(true);
        try {
            await asignarJourney({
                empleado_id: assignUser.id,
                plantilla_id: parseInt(assignData.plantilla_id),
                fecha_inicio: assignData.fecha_inicio || null,
                fecha_termino: assignData.fecha_termino || null
            });
            setShowAssignModal(false);
            alert(`Onboarding asignado correctamente a ${assignUser.nombre}`);
        } catch (err) {
            setAssignError(err.response?.data?.detail || 'Error al asignar el onboarding.');
        } finally {
            setAssignLoading(false);
        }
    };

    const toggleEstado = async (usr) => {
        try {
            await api.put(`/usuarios/${usr.id}`, { estado: !usr.estado });
            setLoading(true);
            fetchData();
        } catch (err) {
            console.error('Error toggling estado', err);
        }
    };

    const getEmpresaNombre = (clientId) => {
        const emp = empresas.find(e => e.id === clientId);
        return emp ? emp.nombre : `ID: ${clientId}`;
    };

    const getRolColor = (rol) => {
        switch(rol) {
            case 'ADMIN': return '#ef4444';
            case 'RRHH': return '#f59e0b';
            case 'EMPLEADO': return '#22c55e';
            default: return '#94a3b8';
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Usuarios</h1>
                    <p className="page-subtitle">Administra los usuarios y roles del sistema OnBoardHub.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Invitar Usuario
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <p>Cargando usuarios...</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Empresa</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((usr) => (
                                <tr key={usr.id}>
                                    <td><strong>#{usr.id}</strong></td>
                                    <td>{usr.nombre}</td>
                                    <td>{usr.email}</td>
                                    <td>
                                        <span style={{
                                            background: getRolColor(usr.rol),
                                            color: 'white',
                                            padding: '2px 10px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block'
                                        }}>
                                            {usr.rol}
                                        </span>
                                    </td>
                                    <td>{getEmpresaNombre(usr.client_id)}</td>
                                    <td>
                                        <span className={`badge ${usr.estado ? 'badge-active' : 'badge-inactive'}`}>
                                            {usr.estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}
                                                onClick={() => openEditModal(usr)}>Editar</button>
                                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: usr.estado ? '#ef4444' : '#22c55e' }}
                                                onClick={() => toggleEstado(usr)}>
                                                {usr.estado ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </div>
                                        {usr.rol === 'EMPLEADO' && (
                                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}
                                                onClick={() => openAssignModal(usr)}>
                                                Asignar Onboarding
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center' }}>No hay usuarios registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal: Invitar Usuario */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: '16px',
                        padding: '2rem', width: '450px', maxWidth: '90vw'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{editingUser ? 'Editar Usuario' : 'Invitar Usuario'}</h2>
                        
                        {formError && (
                            <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{formError}</p>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nombre Completo</label>
                                <input type="text" name="nombre" className="form-input"
                                    placeholder="Ej. Juan Pérez" value={formData.nombre}
                                    onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Correo Electrónico</label>
                                <input type="email" name="email" className="form-input"
                                    placeholder="Ej. juan@empresa.cl" value={formData.email}
                                    onChange={handleChange} required disabled={!!editingUser}
                                    style={editingUser ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                            </div>

                            {!editingUser && (
                                <div className="form-group">
                                    <label className="form-label">Contraseña Temporal</label>
                                    <input type="password" name="password" className="form-input"
                                        placeholder="Mín. 6 caracteres" value={formData.password}
                                        onChange={handleChange} required minLength={6} />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Rol</label>
                                <select name="rol" className="form-input" value={formData.rol} onChange={handleChange}>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="RRHH">Recursos Humanos</option>
                                    <option value="EMPLEADO">Empleado</option>
                                </select>
                            </div>

                            {!editingUser && (
                                <div className="form-group">
                                    <label className="form-label">Empresa</label>
                                    <select name="client_id" className="form-input" value={formData.client_id}
                                        onChange={handleChange} required>
                                        <option value="">Seleccionar empresa...</option>
                                        {empresas.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => { setShowModal(false); setEditingUser(null); setFormError(''); }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Asignar Onboarding */}
            {showAssignModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: '16px',
                        padding: '2rem', width: '450px', maxWidth: '90vw'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Asignar Onboarding a {assignUser?.nombre}</h2>
                        
                        {assignError && (
                            <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{assignError}</p>
                        )}

                        <form onSubmit={handleAssignSubmit}>
                            <div className="form-group">
                                <label className="form-label">Plantilla de Onboarding</label>
                                <select 
                                    className="form-input" 
                                    value={assignData.plantilla_id}
                                    onChange={(e) => setAssignData({...assignData, plantilla_id: e.target.value})}
                                    required
                                >
                                    <option value="">Seleccionar plantilla...</option>
                                    {plantillas.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} ({p.tareas?.length || 0} tareas)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fecha de Inicio (Opcional)</label>
                                <input 
                                    type="date" 
                                    className="form-input"
                                    value={assignData.fecha_inicio}
                                    onChange={(e) => setAssignData({...assignData, fecha_inicio: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fecha de Término / Límite Global (Opcional)</label>
                                <input 
                                    type="date" 
                                    className="form-input"
                                    value={assignData.fecha_termino}
                                    onChange={(e) => setAssignData({...assignData, fecha_termino: e.target.value})}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setShowAssignModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={assignLoading || !assignData.plantilla_id}>
                                    {assignLoading ? 'Asignando...' : 'Confirmar Asignación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
