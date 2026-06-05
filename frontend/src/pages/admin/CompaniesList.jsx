import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function CompaniesList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await companyService.getCompanies();
            setCompanies(data);
        } catch (err) {
            console.error("Error fetching companies", err);
            setError(t('msg_error_generic'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm(t('company_delete_confirm'))) {
            try {
                await companyService.deleteCompany(id);
                setCompanies(prev => prev.filter(c => c.id !== id));
            } catch (err) {
                console.error("Error deleting company", err);
                alert("Error deleting company. Make sure there are no remaining users or processes associated with this company.");
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('sidebar_empresas')}</h1>
                    <p className="page-subtitle">{t('companies_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/superadmin/companies/new')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> {t('btn_add')}
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <p>{t('msg_loading')}</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <p style={{ color: '#ef4444' }}>{error}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('table_id')}</th>
                                <th>{t('table_name')}</th>
                                <th>RUT (Tax ID)</th>
                                <th>{t('table_location')}</th>
                                <th>{t('table_status')}</th>
                                <th style={{ width: '150px' }}>{t('table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company) => (
                                <tr key={company.id}>
                                    <td><strong>#{company.id}</strong></td>
                                    <td>{company.name}</td>
                                    <td>{company.tax_id}</td>
                                    <td>{company.location || '-'}</td>
                                    <td>
                                        <span className={`badge ${company.status ? 'badge-active' : 'badge-inactive'}`}>
                                            {company.status ? t('status_active') : t('status_inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                onClick={() => navigate(`/superadmin/companies/${company.id}/edit`)}>
                                                <Edit size={12} /> {t('btn_edit')}
                                            </button>
                                            <button className="btn" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                                                onClick={() => handleDelete(company.id)}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {companies.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>{t('msg_no_data')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
