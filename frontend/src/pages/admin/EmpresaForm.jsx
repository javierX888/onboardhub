import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmpresa, getEmpresa, updateEmpresa } from '../../services/empresaService';

export default function EmpresaForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        estado: true
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditing);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        if (isEditing) {
            const fetchEmpresa = async () => {
                try {
                    const data = await getEmpresa(id);
                    setFormData({ nombre: data.nombre, rut: data.rut, estado: data.estado });
                } catch (err) {
                    setApiError('No se pudo cargar la empresa.');
                } finally {
                    setLoadingData(false);
                }
            };
            fetchEmpresa();
        }
    }, [id, isEditing]);

    const validate = () => {
        const newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
        if (!formData.rut.trim()) newErrors.rut = 'El RUT es obligatorio';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Limpiar error del campo al escribir
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validate()) return;

        setLoading(true);
        try {
            if (isEditing) {
                await updateEmpresa(id, formData);
            } else {
                await createEmpresa(formData);
            }
            navigate('/admin/empresas');
        } catch (error) {
            const detail = error.response?.data?.detail;
            setApiError(detail || 'Ocurrió un error al guardar la empresa.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) return <p>Cargando datos de la empresa...</p>;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{isEditing ? 'Editar Empresa' : 'Nueva Empresa'}</h1>
                    <p className="page-subtitle">
                        {isEditing ? 'Modifica los datos del tenant seleccionado.' : 'Registra un nuevo tenant en el sistema OnBoardHub.'}
                    </p>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                {apiError && (
                    <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px' }}>
                        ⚠️ {apiError}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre de la Empresa</label>
                        <input
                            type="text"
                            name="nombre"
                            className="form-input"
                            placeholder="Ej. Alloxentric"
                            value={formData.nombre}
                            onChange={handleChange}
                            style={errors.nombre ? { borderColor: '#ef4444' } : {}}
                        />
                        {errors.nombre && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.nombre}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">RUT Comercial</label>
                        <input
                            type="text"
                            name="rut"
                            className="form-input"
                            placeholder="Ej. 76.123.456-K"
                            value={formData.rut}
                            onChange={handleChange}
                            disabled={isEditing}
                            style={{
                                ...(errors.rut ? { borderColor: '#ef4444' } : {}),
                                ...(isEditing ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                            }}
                        />
                        {errors.rut && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.rut}</p>}
                        {isEditing && <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>El RUT no se puede modificar.</p>}
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            name="estado"
                            id="estado"
                            checked={formData.estado}
                            onChange={handleChange}
                        />
                        <label htmlFor="estado" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                            Empresa Activa (El tenant estará habilitado inmediatamente)
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/empresas')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Empresa')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
