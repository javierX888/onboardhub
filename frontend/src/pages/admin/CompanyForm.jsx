import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';

export default function CompanyForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        tax_id: '',
        location: '',
        status: true
    });

    useEffect(() => {
        if (id) {
            companyService.getCompanies().then(companies => {
                const company = companies.find(c => c.id === parseInt(id));
                if (company) setFormData(company);
            });
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) await companyService.updateCompany(id, formData);
            else await companyService.createCompany(formData);
            navigate('/admin/companies');
        } catch (err) {
            alert(t('msg_error_generic'));
        }
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>{id ? 'Edit Company' : 'New Company'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">{t('table_name')}</label>
                    <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label className="form-label">RUT (Tax ID)</label>
                    <input className="form-input" value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label className="form-label">{t('table_location')}</label>
                    <input className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder={t('location_placeholder')} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary">{t('btn_save')}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/companies')}>{t('btn_cancel')}</button>
                </div>
            </form>
        </div>
    );
}
