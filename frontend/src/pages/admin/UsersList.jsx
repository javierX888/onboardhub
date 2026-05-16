import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { journeyService } from '../../services/employeeService'; // combined
import { templateService } from '../../services/templateService';
import { useLanguage } from '../../context/LanguageContext';
import { UserPlus, Briefcase, MapPin, Calendar, CheckCircle, X } from 'lucide-react';

export default function UsersList() {
    const [users, setUsers] = useState([]);
    const [companiesList, setCompaniesList] = useState([]);
    const [companiesMap, setCompaniesMap] = useState({});
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Forms
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'EMPLOYEE', client_id: '', password: 'Password123' });
    const [viewingJourney, setViewingJourney] = useState(null);
    const [assignmentData, setAssignmentData] = useState({ 
        template_id: '', 
        start_date: '', 
        end_date: '', 
        location: '',
        responsible_id: '' 
    });
    const [toastMessage, setToastMessage] = useState(null);
    
    const { t } = useLanguage();

    const fetchData = async () => {
        setLoading(true);
        const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
        const isAdmin = authUser.role === 'SUPERADMIN';
        const clientId = authUser.client_id;

        try {
            const [usersData, companiesData, templatesData] = await Promise.all([
                isAdmin ? userService.getUsers() : userService.getUsersByCompany(clientId),
                isAdmin ? companyService.getCompanies() : Promise.resolve([{ id: clientId, name: 'Mi Empresa' }]),
                isAdmin ? templateService.getTemplates() : templateService.getTemplatesByCompany(clientId)
            ]);

            setUsers(usersData);
            setTemplates(templatesData);
            setCompaniesList(companiesData);
            
            const compMap = {};
            companiesData.forEach(c => compMap[c.id] = c.name);
            setCompaniesMap(compMap);
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = "success") => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
        const finalClientId = authUser.role === 'SUPERADMIN' ? newUser.client_id : authUser.client_id;

        try {
            await userService.createUser({
                ...newUser,
                client_id: parseInt(finalClientId)
            });
            setShowAddModal(false);
            setNewUser({ name: '', email: '', role: 'EMPLOYEE', client_id: '', password: 'Password123' });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error creating user. Check console for details.");
        }
    };

    const handleAssign = async () => {
        try {
            await journeyService.createJourney({
                employee_id: selectedUser.id,
                client_id: selectedUser.client_id,
                template_id: parseInt(assignmentData.template_id),
                role: selectedUser.role,
                start_date: assignmentData.start_date || null,
                end_date: assignmentData.end_date || null,
                location: assignmentData.location || null,
                responsible_id: assignmentData.responsible_id ? parseInt(assignmentData.responsible_id) : null
            });
            showToast("✅ Success! Onboarding assigned.", "success");
            setSelectedUser(null);
            setAssignmentData({ template_id: '', start_date: '', end_date: '', location: '', responsible_id: '' });
        } catch (err) {
            showToast("❌ Error assigning onboarding.", "error");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">{t('sidebar_usuarios')}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('users_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> {t('btn_add')}
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('msg_loading')}</div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('table_id')}</th>
                                <th>{t('table_name')}</th>
                                <th>{t('table_email')}</th>
                                <th>{t('table_role')}</th>
                                <th>{t('table_company')}</th>
                                <th>{t('table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                        <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>👥</div>
                                        {t('msg_no_data')}
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>#{user.id}</td>
                                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                            {t(`role_${user.role.toLowerCase()}`) || user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                                            {companiesMap[user.client_id] || user.client_id}
                                        </div>
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-secondary" onClick={() => setSelectedUser(user)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                            {t('btn_assign')}
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={async () => {
                                                const data = await userService.getDashboard(user.email);
                                                setViewingJourney(data);
                                            }}
                                            style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--secondary)' }}
                                        >
                                            {t('btn_track')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Create User (Premium Glassmorphism) */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="card" style={{ 
                        width: '95%',
                        maxWidth: '450px', 
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem', 
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <button 
                            onClick={() => setShowAddModal(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>{t('users_add_title')}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>{t('users_add_subtitle')}</p>

                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label className="form-label">{t('table_name')}</label>
                                <input 
                                    className="form-input" 
                                    type="text" 
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    placeholder="e.g. John Doe"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('table_email')}</label>
                                <input 
                                    className="form-input" 
                                    type="email" 
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    placeholder="john@company.com"
                                    required 
                                />
                            </div>
                            <div className="grid-form">
                                <div className="form-group">
                                    <label className="form-label">{t('table_role')}</label>
                                    <select 
                                        className="form-input" 
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                    >
                                        <option value="EMPLOYEE">{t('role_employee')}</option>
                                        <option value="ONBOARDING_MANAGER">{t('role_onboarding_manager')}</option>
                                        <option value="ADMIN">{t('role_admin')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('login_pass')}</label>
                                    <input 
                                        className="form-input" 
                                        type="password" 
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label">{t('table_company')}</label>
                                <select 
                                    className="form-input" 
                                    value={JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}').role === 'SUPERADMIN' ? newUser.client_id : JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}').client_id}
                                    onChange={e => setNewUser({...newUser, client_id: e.target.value})}
                                    disabled={JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}').role !== 'SUPERADMIN'}
                                    required
                                >
                                    <option value="">-- {t('table_company')} --</option>
                                    {companiesList.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Create User</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Assign Onboarding (Premium Glassmorphism) */}
            {selectedUser && (
                <div className="modal-overlay">
                    <div className="card" style={{ 
                        width: '95%',
                        maxWidth: '480px', 
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem' }}>Assign Onboarding</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>To: {selectedUser.name}</p>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Template</label>
                            <select 
                                className="form-input"
                                value={assignmentData.template_id}
                                onChange={(e) => setAssignmentData({...assignmentData, template_id: e.target.value})}
                            >
                                <option value="">Select template...</option>
                                {templates.filter(t => t.client_id === selectedUser.client_id).map(temp => (
                                    <option key={temp.id} value={temp.id}>{temp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mentor / Supervisor</label>
                            <select 
                                className="form-input"
                                value={assignmentData.responsible_id}
                                onChange={(e) => setAssignmentData({...assignmentData, responsible_id: e.target.value})}
                            >
                                <option value="">Select supervisor...</option>
                                {users.filter(u => u.client_id === selectedUser.client_id && u.id !== selectedUser.id).map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid-form" style={{ gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">{t('table_location')}</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        className="form-input" 
                                        style={{ paddingLeft: '35px' }}
                                        type="text" 
                                        value={assignmentData.location}
                                        onChange={(e) => setAssignmentData({...assignmentData, location: e.target.value})}
                                        placeholder="Location"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input 
                                    className="form-input" 
                                    type="date" 
                                    value={assignmentData.start_date}
                                    onChange={(e) => setAssignmentData({...assignmentData, start_date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-primary" onClick={handleAssign} disabled={!assignmentData.template_id} style={{ flex: 1, padding: '12px' }}>
                                Confirm Journey
                            </button>
                            <button className="btn btn-secondary" onClick={() => setSelectedUser(null)} style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Track Progress */}
            {viewingJourney && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '95%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Progress: {viewingJourney.user.name}</h2>
                            <button className="btn btn-secondary" onClick={() => setViewingJourney(null)} style={{ padding: '5px' }}><X size={18}/></button>
                        </div>

                        {!viewingJourney.journey ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>No active journey for this user.</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Progress</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{viewingJourney.journey.progress}%</div>
                                    </div>
                                    <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${viewingJourney.journey.progress}%`, height: '100%', background: 'var(--primary)' }}></div>
                                    </div>
                                </div>

                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Task</th>
                                                <th>Status</th>
                                                <th>Document</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingJourney.journey.tasks.map(task => (
                                                <tr key={task.id}>
                                                    <td style={{ fontSize: '13px' }}>{task.title}</td>
                                                    <td>
                                                        <span className={`badge ${task.completed ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '10px' }}>
                                                            {task.completed ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {task.document_url ? (
                                                            <a 
                                                                href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${task.document_url}`} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none' }}
                                                            >
                                                                📥 Download
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No file</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
