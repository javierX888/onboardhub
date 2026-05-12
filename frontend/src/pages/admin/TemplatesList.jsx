import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';

export default function TemplatesList() {
    const [templates, setTemplates] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [temps, comps] = await Promise.all([
                    templateService.getTemplates(),
                    companyService.getCompanies()
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
            await templateService.deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
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
                {loading ? <p>Loading...</p> : (
                    <div className="table-container">
                        <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('table_id')}</th>
                                <th>{t('table_name')}</th>
                                <th>{t('table_company')}</th>
                                <th>Tasks</th>
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
                                        <button className="btn btn-secondary" onClick={() => handleDelete(temp.id)}>
                                            {t('btn_delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
