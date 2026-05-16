import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';

export default function TemplatesList() {
    const [templates, setTemplates] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const showToast = (message, type = "success") => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    useEffect(() => {
        const fetchData = async () => {
            const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
            const isAdmin = authUser.role === 'SUPERADMIN';
            const clientId = authUser.client_id;

            try {
                const [temps, comps] = await Promise.all([
                    isAdmin ? templateService.getTemplates() : templateService.getTemplatesByCompany(clientId),
                    isAdmin ? companyService.getCompanies() : Promise.resolve([{ id: clientId, name: 'Mi Empresa' }])
                ]);
                setTemplates(temps);
                const compMap = {};
                comps.forEach(c => compMap[c.id] = c.name);
                setCompanies(compMap);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm(t('msg_confirm_delete'))) {
            try {
                await templateService.deleteTemplate(id);
                setTemplates(prev => prev.filter(t => t.id !== id));
                showToast(t('msg_success_delete'), "success");
            } catch (err) {
                console.error("Error deleting template:", err);
                showToast(t('msg_error_generic'), "error");
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('sidebar_plantillas')}</h1>
                <button className="btn btn-primary" onClick={() => navigate('/admin/templates/new')}>
                    + {t('btn_add')}
                </button>
            </div>

            <div className="card">
                {loading ? <p>{t('msg_loading')}</p> : (
                    <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('table_id')}</th>
                                <th>{t('table_name')}</th>
                                <th>{t('table_company')}</th>
                                <th>{t('table_tasks')}</th>
                                <th>{t('table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(temp => (
                                <tr key={temp.id}>
                                    <td>#{temp.id}</td>
                                    <td>{temp.name}</td>
                                    <td>{companies[temp.client_id] || temp.client_id}</td>
                                    <td>{temp.tasks?.length || 0}</td>
                                    <td>
                                        <button className="btn btn-secondary" onClick={() => handleDelete(temp.id)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                            {t('btn_delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {templates.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>{t('msg_no_data')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {/* Premium Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'fadeInUp 0.3s ease-out'
                }}>
                    {toastMessage.message}
                </div>
            )}
        </div>
    );
}
