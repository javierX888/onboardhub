import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { areaService } from '../services/areaService';
import { officeService } from '../services/officeService';
import { Trash2, Edit2, Plus, Check, X, Building, Settings2, MapPin } from 'lucide-react';

export default function AjustesModal({ onClose }) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('preferences'); // 'preferences' | 'areas' | 'offices'
  const [areas, setAreas] = useState([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingName, setEditingName] = useState('');
  
  // Offices State
  const [offices, setOffices] = useState([]);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [editingOfficeId, setEditingOfficeId] = useState(null);
  const [editingOfficeName, setEditingOfficeName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
  const clientId = user.client_id;
  const isSuperAdmin = user.role === 'SUPERADMIN';
  const isAdmin = user.role === 'ADMIN'; // Only ADMIN (RRHH) should see company config

  useEffect(() => {
    if (activeTab === 'areas' && clientId) {
      fetchAreas();
    } else if (activeTab === 'offices' && clientId) {
      fetchOffices();
    }
  }, [activeTab]);

  const fetchAreas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await areaService.getAreas(clientId);
      setAreas(data);
    } catch (err) {
      setError('Error al cargar las áreas de la empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    setError('');
    try {
      const newArea = await areaService.createArea(clientId, { name: newAreaName.trim() });
      setAreas([...areas, newArea]);
      setNewAreaName('');
    } catch (err) {
      setError('Error al crear el área.');
    }
  };

  const handleStartEdit = (area) => {
    setEditingAreaId(area.id);
    setEditingName(area.name);
  };

  const handleCancelEdit = () => {
    setEditingAreaId(null);
    setEditingName('');
  };

  const handleUpdateArea = async (id) => {
    if (!editingName.trim()) return;
    setError('');
    try {
      const updated = await areaService.updateArea(id, clientId, { name: editingName.trim() });
      setAreas(areas.map(a => a.id === id ? updated : a));
      setEditingAreaId(null);
      setEditingName('');
    } catch (err) {
      setError('Error al actualizar el área.');
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta área?')) return;
    setError('');
    try {
      await areaService.deleteArea(id, clientId);
      setAreas(areas.filter(a => a.id !== id));
    } catch (err) {
      setError('Error al eliminar el área.');
    }
  };

  // Offices Operations
  const fetchOffices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await officeService.getOffices(clientId);
      setOffices(data);
    } catch (err) {
      setError('Error al cargar las sucursales/oficinas de la empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffice = async (e) => {
    e.preventDefault();
    if (!newOfficeName.trim()) return;
    setError('');
    try {
      const newOffice = await officeService.createOffice(clientId, { name: newOfficeName.trim() });
      setOffices([...offices, newOffice]);
      setNewOfficeName('');
    } catch (err) {
      setError('Error al crear la sucursal/oficina.');
    }
  };

  const handleStartEditOffice = (office) => {
    setEditingOfficeId(office.id);
    setEditingOfficeName(office.name);
  };

  const handleCancelEditOffice = () => {
    setEditingOfficeId(null);
    setEditingOfficeName('');
  };

  const handleUpdateOffice = async (id) => {
    if (!editingOfficeName.trim()) return;
    setError('');
    try {
      const updated = await officeService.updateOffice(id, clientId, { name: editingOfficeName.trim() });
      setOffices(offices.map(o => o.id === id ? updated : o));
      setEditingOfficeId(null);
      setEditingOfficeName('');
    } catch (err) {
      setError('Error al actualizar la sucursal/oficina.');
    }
  };

  const handleDeleteOffice = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta sucursal/oficina?')) return;
    setError('');
    try {
      await officeService.deleteOffice(id, clientId);
      setOffices(offices.filter(o => o.id !== id));
    } catch (err) {
      setError('Error al eliminar la sucursal/oficina.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '20px',
        padding: '2rem', width: '500px', maxWidth: '90vw',
        color: 'var(--text-main)', border: '1px solid var(--border)',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={20} className="text-primary" /> {t('modal_ajustes_title')}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs - Restricted to Admin RRHH (ADMIN role) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              background: 'transparent', border: 'none', paddingBottom: '0.75rem',
              borderBottom: activeTab === 'preferences' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'preferences' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'preferences' ? 'bold' : 'normal',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Preferencias
          </button>
          {isAdmin && clientId && (
            <>
              <button
                onClick={() => setActiveTab('areas')}
                style={{
                  background: 'transparent', border: 'none', paddingBottom: '0.75rem',
                  borderBottom: activeTab === 'areas' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'areas' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'areas' ? 'bold' : 'normal',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Áreas de la Empresa
              </button>
              <button
                onClick={() => setActiveTab('offices')}
                style={{
                  background: 'transparent', border: 'none', paddingBottom: '0.75rem',
                  borderBottom: activeTab === 'offices' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'offices' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'offices' ? 'bold' : 'normal',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Sucursales / Oficinas
              </button>
            </>
          )}
        </div>

        {/* Tab Contents: Preferences */}
        {activeTab === 'preferences' && (
          <div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>{t('modal_ajustes_appearance')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTheme('light')}
                  style={{ flex: 1 }}
                >
                  {t('theme_light')}
                </button>
                <button
                  className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTheme('dark')}
                  style={{ flex: 1 }}
                >
                  {t('theme_dark')}
                </button>
                <button
                  className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTheme('system')}
                  style={{ flex: 1 }}
                >
                  {t('theme_system')}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>{t('modal_ajustes_language')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className={`btn ${language === 'es' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setLanguage('es')}
                  style={{ flex: 1 }}
                >
                  Español
                </button>
                <button
                  className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setLanguage('en')}
                  style={{ flex: 1 }}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Contents: Areas CRUD */}
        {activeTab === 'areas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* Create Area Form */}
            <form onSubmit={handleCreateArea} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre del área (ej. Finanzas)"
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                <Plus size={18} />
              </button>
            </form>

            {/* Areas List */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando áreas...</div>
              ) : areas.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Building size={28} />
                  <span>No hay áreas configuradas para tu empresa.</span>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {areas.map(area => (
                    <li key={area.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderBottom: '1px solid var(--border)',
                      borderRadius: '8px', transition: 'background-color 0.2s',
                      marginBottom: '4px'
                    }}>
                      {editingAreaId === area.id ? (
                        <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            style={{ flex: 1, margin: 0, padding: '6px 10px', fontSize: '14px' }}
                          />
                          <button onClick={() => handleUpdateArea(area.id)} className="btn btn-primary" style={{ padding: '6px 10px', background: '#10b981' }}>
                            <Check size={16} />
                          </button>
                          <button onClick={handleCancelEdit} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{area.name}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleStartEdit(area)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteArea(area.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Tab Contents: Offices CRUD */}
        {activeTab === 'offices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* Create Office Form */}
            <form onSubmit={handleCreateOffice} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre de sucursal/oficina (ej. Central)"
                value={newOfficeName}
                onChange={e => setNewOfficeName(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                <Plus size={18} />
              </button>
            </form>

            {/* Offices List */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando sucursales/oficinas...</div>
              ) : offices.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={28} />
                  <span>No hay sucursales/oficinas configuradas.</span>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {offices.map(office => (
                    <li key={office.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderBottom: '1px solid var(--border)',
                      borderRadius: '8px', transition: 'background-color 0.2s',
                      marginBottom: '4px'
                    }}>
                      {editingOfficeId === office.id ? (
                        <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={editingOfficeName}
                            onChange={e => setEditingOfficeName(e.target.value)}
                            style={{ flex: 1, margin: 0, padding: '6px 10px', fontSize: '14px' }}
                          />
                          <button onClick={() => handleUpdateOffice(office.id)} className="btn btn-primary" style={{ padding: '6px 10px', background: '#10b981' }}>
                            <Check size={16} />
                          </button>
                          <button onClick={handleCancelEditOffice} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{office.name}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleStartEditOffice(office)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteOffice(office.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {t('btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
