import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { useLanguage } from '../../context/LanguageContext';
import { locationsData } from '../../config/locationsData';

export default function CompanyForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        tax_id: '',
        location: '',
        status: true
    });

    // Geographical state
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    
    // Autocomplete state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef(null);

    useEffect(() => {
        if (id) {
            companyService.getCompany(id).then(company => {
                if (company) {
                    setFormData(company);
                    if (company.location) {
                        const parts = company.location.split(', ');
                        if (parts.length === 3) {
                            const [city, region, countryName] = parts;
                            // Find country key by matching label
                            const countryKey = Object.keys(locationsData).find(
                                key => locationsData[key].label.toLowerCase() === countryName.trim().toLowerCase()
                            );
                            if (countryKey) {
                                setSelectedCountry(countryKey);
                                setSelectedRegion(region.trim());
                                setSelectedCity(city.trim());
                            } else {
                                setSelectedCity(company.location);
                            }
                        } else {
                            setSelectedCity(company.location);
                        }
                    }
                }
            });
        }
    }, [id]);

    // Handle outside clicks to close suggestions dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load city suggestions when city text or region changes
    useEffect(() => {
        if (!selectedCountry || !selectedRegion || !selectedCity) {
            setSuggestions([]);
            return;
        }

        const countryInfo = locationsData[selectedCountry];
        const regionInfo = countryInfo?.divisions.find(d => d.name === selectedRegion);
        if (regionInfo) {
            const filtered = regionInfo.cities.filter(c => 
                c.toLowerCase().includes(selectedCity.toLowerCase()) &&
                c.toLowerCase() !== selectedCity.toLowerCase()
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [selectedCity, selectedRegion, selectedCountry]);

    const handleCountryChange = (e) => {
        const val = e.target.value;
        setSelectedCountry(val);
        setSelectedRegion('');
        setSelectedCity('');
        setSuggestions([]);
    };

    const handleRegionChange = (e) => {
        setSelectedRegion(e.target.value);
        setSelectedCity('');
        setSuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let combinedLocation = '';
        if (selectedCountry) {
            const countryLabel = locationsData[selectedCountry].label;
            combinedLocation = [selectedCity, selectedRegion, countryLabel]
                .map(s => s?.trim())
                .filter(Boolean)
                .join(', ');
        } else {
            combinedLocation = selectedCity?.trim();
        }

        const payload = {
            ...formData,
            location: combinedLocation
        };

        try {
            if (id) await companyService.updateCompany(id, payload);
            else await companyService.createCompany(payload);
            navigate('/superadmin/companies');
        } catch (err) {
            alert(t('msg_error_generic'));
        }
    };

    const countryInfo = locationsData[selectedCountry];
    const divisionLabelKey = countryInfo ? countryInfo.divisionKey : 'company_region_default';

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>{id ? t('company_edit_title') : t('company_new_title')}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">{t('table_name')}</label>
                    <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">RUT (Tax ID)</label>
                    <input className="form-input" value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="form-group">
                        <label className="form-label">{t('company_country')}</label>
                        <select className="form-input" value={selectedCountry} onChange={handleCountryChange}>
                            <option value="">-- {t('company_country')} --</option>
                            {Object.keys(locationsData).map(key => (
                                <option key={key} value={key}>{locationsData[key].label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t(divisionLabelKey)}</label>
                        <select 
                            className="form-input" 
                            value={selectedRegion} 
                            onChange={handleRegionChange}
                            disabled={!selectedCountry}
                        >
                            <option value="">-- {t(divisionLabelKey)} --</option>
                            {countryInfo?.divisions.map(div => (
                                <option key={div.name} value={div.name}>{div.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem', position: 'relative' }} ref={suggestionRef}>
                    <label className="form-label">{t('company_city_commune')}</label>
                    <input 
                        className="form-input" 
                        value={selectedCity} 
                        onChange={e => {
                            setSelectedCity(e.target.value);
                            setShowSuggestions(true);
                        }} 
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={t('company_city_commune_placeholder')}
                        required
                    />
                    
                    {/* Suggestions Autocomplete Box */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-lg)',
                            marginTop: '4px'
                        }}>
                            {suggestions.map(s => (
                                <div 
                                    key={s} 
                                    onClick={() => {
                                        setSelectedCity(s);
                                        setShowSuggestions(false);
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-light, #f1f5f9)',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-main)',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--bg-color)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary">{t('btn_save')}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/superadmin/companies')}>{t('btn_cancel')}</button>
                </div>
            </form>
        </div>
    );
}
