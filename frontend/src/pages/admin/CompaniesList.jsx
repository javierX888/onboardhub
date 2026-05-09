import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';

export default function CompaniesList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchCompanies = async () => {
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

        fetchCompanies();
    }, [t]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('sidebar_empresas')}</h1>
                    <p className="page-subtitle">SaaS Multi-tenant administration.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/admin/companies/new')}>
                    + {t('btn_add')}
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p style={{ color: '#ef4444' }}>{error}</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('table_id')}</th>
                                <th>{t('table_name')}</th>
                                <th>RUT (Tax ID)</th>
                                <th>{t('table_location')}</th>
                                <th>{t('table_status')}</th>
                                <th>{t('table_actions')}</th>
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
                                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}
                                            onClick={() => navigate(`/admin/companies/${company.id}/edit`)}>
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {companies.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No companies found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
