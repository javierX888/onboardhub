import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { journeyService, employeeService } from '../../services/employeeService';
import { templateService } from '../../services/templateService';
import { areaService } from '../../services/areaService';
import { officeService } from '../../services/officeService';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { UserPlus, Briefcase, MapPin, Calendar, CheckCircle, X } from 'lucide-react';

export default function UsersList() {
    const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
    const isSuperAdmin = authUser.role === 'SUPERADMIN';
    const clientId = authUser.client_id;

    const [users, setUsers] = useState([]);
    const [companiesList, setCompaniesList] = useState([]);
    const [companiesMap, setCompaniesMap] = useState({});
    const [templates, setTemplates] = useState([]);
    const [journeys, setJourneys] = useState({}); // Map of employee_id -> journey
    const [loading, setLoading] = useState(true);

    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [hasActiveJourney, setHasActiveJourney] = useState(false);
    const [checkingJourney, setCheckingJourney] = useState(false);

    // Forms
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        client_id: '',
        password: 'Password123',
        area: '',
        pais: '',
        ciudad: '',
        comuna: '',
        sucursal: ''
    });
    const [editingUser, setEditingUser] = useState(null);
    const [viewingJourney, setViewingJourney] = useState(null);
    const [areas, setAreas] = useState([]);
    const [isCreatingArea, setIsCreatingArea] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');

    // Offices State
    const [offices, setOffices] = useState([]);
    const [isCreatingOffice, setIsCreatingOffice] = useState(false);
    const [newOfficeName, setNewOfficeName] = useState('');

    const [assignmentData, setAssignmentData] = useState({
        template_id: '',
        start_date: '',
        end_date: '',
        responsible_id: '',
        employee_id: '' // For supervisor assignment
    });

    // Filtros y paginación
    const [filterName, setFilterName] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [filterOnboardingStatus, setFilterOnboardingStatus] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [toastMessage, setToastMessage] = useState(null);

    const { t, language } = useLanguage();

    const filteredUsers = users.filter(user => {
        // SUPERADMIN only sees ADMINs
        if (isSuperAdmin && user.role !== 'ADMIN') return false;

        const matchName = user.name.toLowerCase().includes(filterName.toLowerCase());
        const matchEmail = user.email.toLowerCase().includes(filterEmail.toLowerCase());
        const matchRole = filterRole ? user.role === filterRole : true;
        
        const userJourney = journeys[user.id];
        let matchOnboarding = true;
        if (filterOnboardingStatus === 'unassigned') {
            matchOnboarding = !userJourney;
        } else if (filterOnboardingStatus === 'in_progress') {
            matchOnboarding = userJourney && userJourney.progress < 100;
        } else if (filterOnboardingStatus === 'completed') {
            matchOnboarding = userJourney && userJourney.progress === 100;
        }
        
        return matchName && matchEmail && matchRole && matchOnboarding;
    });

    // Lógica de paginación
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Reset a página 1 cuando cambian filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [filterName, filterEmail, filterRole, statusFilter, filterOnboardingStatus]);

    useEffect(() => {
        const checkActiveJourney = async () => {
            if (!selectedUser || selectedUser.role !== 'EMPLOYEE') {
                setHasActiveJourney(false);
                return;
            }
            setCheckingJourney(true);
            try {
                const data = await employeeService.getDashboard(selectedUser.email);
                if (data && data.journey && data.journey.progress < 100) {
                    setHasActiveJourney(true);
                } else {
                    setHasActiveJourney(false);
                }
            } catch (err) {
                console.error("Error checking user onboarding status", err);
                setHasActiveJourney(false);
            } finally {
                setCheckingJourney(false);
            }
        };
        checkActiveJourney();
    }, [selectedUser]);

    useEffect(() => {
        if (showAddModal) {
            setNewUser({
                name: '',
                email: '',
                role: isSuperAdmin ? 'ADMIN' : 'EMPLOYEE',
                client_id: isSuperAdmin ? '' : clientId,
                password: 'Password123',
                area: '',
                pais: '',
                ciudad: '',
                comuna: '',
                sucursal: ''
            });
        }
    }, [showAddModal]);

    const fetchData = async () => {
        setLoading(true);
        const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
        const isAdmin = authUser.role === 'SUPERADMIN';
        const clientId = authUser.client_id;

        try {
            const [usersData, companiesData, templatesData, areasData, officesData] = await Promise.all([
                isAdmin ? userService.getUsers(statusFilter) : userService.getUsersByCompany(clientId, statusFilter),
                isAdmin ? companyService.getCompanies() : Promise.resolve([{ id: clientId, name: 'Mi Empresa' }]),
                isAdmin ? templateService.getTemplates() : templateService.getTemplatesByCompany(clientId),
                isAdmin ? Promise.resolve([]) : areaService.getAreas(clientId),
                isAdmin ? Promise.resolve([]) : officeService.getOffices(clientId)
            ]);

            setUsers(usersData);
            setTemplates(templatesData);
            setCompaniesList(companiesData);
            setAreas(areasData || []);
            setOffices(officesData || []);

            const compMap = {};
            companiesData.forEach(c => compMap[c.id] = c.name);
            setCompaniesMap(compMap);

            // Fetch journeys for all users
            const journeysMap = {};
            for (const user of usersData) {
                try {
                    const response = await api.get(`/journeys/employee/${user.id}?client_id=${user.client_id}`);
                    if (response.data && response.data.length > 0) {
                        journeysMap[user.id] = response.data[0]; // Get first active journey
                    }
                } catch (err) {
                    console.log(`No journey for user ${user.id}`);
                }
            }
            setJourneys(journeysMap);
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
    }, [statusFilter]);

    const handleCreateArea = async () => {
        if (!newAreaName.trim()) return;
        const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
        const clientId = authUser.client_id || 1;
        try {
            const created = await areaService.createArea(clientId, { name: newAreaName.trim() });
            const data = await areaService.getAreas(clientId);
            setAreas(data || []);
            if (showEditModal) {
                setEditingUser(prev => ({ ...prev, area: created.name }));
            } else {
                setNewUser(prev => ({ ...prev, area: created.name }));
            }
            setIsCreatingArea(false);
            setNewAreaName('');
        } catch (err) {
            console.error("Error creating area:", err);
            alert("Error al crear el área");
        }
    };

    const handleDeleteArea = async () => {
        const areaName = showEditModal ? editingUser.area : newUser.area;
        if (!areaName) return;
        if (!window.confirm(`¿Estás seguro de eliminar el área "${areaName}"?`)) return;
        
        const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
        const clientId = authUser.client_id || 1;
        
        const areaToDelete = areas.find(a => a.name === areaName);
        if (!areaToDelete) return;
        
        try {
            await areaService.deleteArea(areaToDelete.id, clientId);
            const data = await areaService.getAreas(clientId);
            setAreas(data || []);
            if (showEditModal) {
                setEditingUser(prev => ({ ...prev, area: '' }));
            } else {
                setNewUser(prev => ({ ...prev, area: '' }));
            }
        } catch (err) {
            console.error("Error deleting area:", err);
            alert("Error al eliminar el área");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
        const finalClientId = isSuperAdmin ? newUser.client_id : authUser.client_id;

        try {
            await userService.createUser({
                ...newUser,
                client_id: parseInt(finalClientId)
            });
            setShowAddModal(false);
            setNewUser({
                name: '',
                email: '',
                role: isSuperAdmin ? 'ADMIN' : 'EMPLOYEE',
                client_id: '',
                password: 'Password123',
                area: '',
                pais: '',
                ciudad: '',
                comuna: '',
                sucursal: ''
            });
            showToast("✅ Usuario creado con éxito.", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("❌ Error al crear el usuario.", "error");
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...editingUser };
            if (!payload.password) {
                delete payload.password;
            }
            await userService.updateUser(editingUser.id, payload);
            setShowEditModal(false);
            setEditingUser(null);
            showToast("✅ Usuario actualizado con éxito.", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("❌ Error al actualizar el usuario.", "error");
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"?`)) return;
        try {
            await userService.deleteUser(id);
            showToast("✅ Usuario eliminado con éxito.", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("❌ Error al eliminar el usuario.", "error");
        }
    };

    const handleAssign = async () => {
        try {
            const combinedLocation = [
                selectedUser.pais,
                selectedUser.ciudad,
                selectedUser.comuna,
                selectedUser.sucursal
            ].map(s => s?.trim()).filter(Boolean).join(', ');

            await journeyService.createJourney({
                employee_id: selectedUser.id,
                client_id: selectedUser.client_id,
                template_id: parseInt(assignmentData.template_id),
                role: selectedUser.role,
                start_date: assignmentData.start_date || null,
                end_date: assignmentData.end_date || null,
                location: combinedLocation || null,
                responsible_id: assignmentData.responsible_id ? parseInt(assignmentData.responsible_id) : null,
                supervisor_id: assignmentData.responsible_id ? parseInt(assignmentData.responsible_id) : null
            });
            showToast("✅ Success! Onboarding assigned.", "success");
            fetchData();
            setSelectedUser(null);
            setAssignmentData({ template_id: '', start_date: '', end_date: '', responsible_id: '', employee_id: '' });
        } catch (err) {
            showToast("❌ Error assigning onboarding.", "error");
        }
    };

    const handleAssignSupervisor = async () => {
        try {
            if (!assignmentData.employee_id) return;
            const employeeJourney = journeys[assignmentData.employee_id];
            if (!employeeJourney) {
                showToast("❌ El empleado seleccionado no tiene un proceso activo.", "error");
                return;
            }

            await journeyService.updateJourney(employeeJourney.id, selectedUser.client_id, {
                supervisor_id: selectedUser.id
            });
            showToast("✅ Supervisor asignado con éxito.", "success");
            fetchData();
            setSelectedUser(null);
            setAssignmentData({ template_id: '', start_date: '', end_date: '', responsible_id: '', employee_id: '' });
        } catch (err) {
            console.error(err);
            showToast("❌ Error al asignar supervisor.", "error");
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
                    <>
                        {/* Filtros */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="form-label">{t('filter_name')}</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder={t('filter_name_placeholder')}
                                        value={filterName}
                                        onChange={(e) => setFilterName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">{t('filter_email')}</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder={t('filter_email_placeholder')}
                                        value={filterEmail}
                                        onChange={(e) => setFilterEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">{t('filter_record_status')}</label>
                                    <select
                                        className="form-input"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="active">{t('status_active')}</option>
                                        <option value="inactive">{t('status_inactive')}</option>
                                        <option value="all">{t('status_all_records')}</option>
                                    </select>
                                </div>
                                {!isSuperAdmin && (
                                    <>
                                        <div>
                                            <label className="form-label">{t('filter_role')}</label>
                                            <select
                                                className="form-input"
                                                value={filterRole}
                                                onChange={(e) => setFilterRole(e.target.value)}
                                            >
                                                <option value="">{t('filter_all_roles')}</option>
                                                <option value="EMPLOYEE">{t('role_employee')}</option>
                                                <option value="ENCARGADO_AREA">{t('role_encargado_area')}</option>
                                                <option value="SUPERVISOR_ONBOARDING">{t('role_supervisor_onboarding')}</option>
                                                <option value="ADMIN">{t('role_admin')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label">{t('filter_onboarding_status')}</label>
                                            <select
                                                className="form-input"
                                                value={filterOnboardingStatus}
                                                onChange={(e) => setFilterOnboardingStatus(e.target.value)}
                                            >
                                                <option value="">{t('filter_all_statuses')}</option>
                                                <option value="unassigned">{t('filter_unassigned')}</option>
                                                <option value="in_progress">{t('filter_in_progress')}</option>
                                                <option value="completed">{t('filter_completed')}</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {filteredUsers.length === 0 ? (
                                        t('msg_no_data')
                                    ) : (
                                        <>{t('users_showing_count')} <strong>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> {t('users_showing_of')} <strong>{filteredUsers.length}</strong> {t('users_showing_users')}</>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label" style={{ marginRight: '0.5rem', display: 'inline-block', marginBottom: 0 }}>{t('users_per_page')}</label>
                                    <select
                                        className="form-input"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(parseInt(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        style={{ width: '80px', display: 'inline-block' }}
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', marginBottom: '1.5rem' }}>
                            <table className="data-table" style={{ minWidth: '950px', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>{t('table_id')}</th>
                                    <th>{t('table_name')}</th>
                                    <th>{t('table_email')}</th>
                                    <th>{t('table_role')}</th>
                                    <th>{t('table_status')}</th>
                                    {isSuperAdmin ? (
                                        <>
                                            <th>{t('table_company') || 'Compañía'}</th>
                                            <th>{t('table_actions')}</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>Sucursal</th>
                                            <th>Onboarding</th>
                                            <th>Template</th>
                                            <th>Progress</th>
                                            <th>{t('table_actions')}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? "7" : "10"} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                            <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>👥</div>
                                            {filteredUsers.length === 0 ? 'No se encontraron usuarios con los filtros aplicados' : t('msg_no_data')}
                                        </td>
                                    </tr>
                                ) : paginatedUsers.map(user => {
                                    const userJourney = journeys[user.id];
                                    const templateName = userJourney ? templates.find(template => template.id === userJourney.template_id)?.name : null;
                                    return (
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
                                                <span className={`badge ${user.status ? 'badge-active' : 'badge-inactive'}`}>
                                                    {user.status ? t('status_active') : t('status_inactive')}
                                                </span>
                                            </td>
                                            {isSuperAdmin ? (
                                                <>
                                                    <td>{companiesMap[user.client_id] || user.client_id}</td>
                                                    <td style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            onClick={() => {
                                                                setEditingUser({ ...user, password: '' });
                                                                setShowEditModal(true);
                                                            }} 
                                                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                                        >
                                                            Editar
                                                        </button>
                                                        {user.status && (
                                                            <button 
                                                                className="btn btn-secondary" 
                                                                onClick={() => handleDeleteUser(user.id, user.name)} 
                                                                style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#f87171', borderColor: '#f87171' }}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        {user.sucursal || '—'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {userJourney ? (
                                                            <CheckCircle size={20} strokeWidth={2} style={{ color: 'var(--primary)' }} />
                                                        ) : (
                                                            <X size={20} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                                                        )}
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        {templateName || '—'}
                                                    </td>
                                                    <td>
                                                        {userJourney ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${userJourney.progress}%`, height: '100%', background: 'var(--primary)' }}></div>
                                                                </div>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userJourney.progress}%</span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {/* Asignación condicional: Empleado o Supervisor */}
                                                        {(user.role === 'EMPLOYEE' || user.role === 'SUPERVISOR_ONBOARDING' || user.role === 'ENCARGADO_AREA') && (
                                                            <button className="btn btn-secondary" onClick={() => setSelectedUser(user)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                                                {user.role === 'EMPLOYEE' ? t('btn_assign') : 'Asignar Empleado'}
                                                            </button>
                                                        )}
                                                        {user.role === 'EMPLOYEE' && (
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
                                                        )}
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            onClick={() => {
                                                                setEditingUser({ ...user, password: '' });
                                                                setShowEditModal(true);
                                                            }} 
                                                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                                        >
                                                            Editar
                                                        </button>
                                                        {user.status && (
                                                            <button 
                                                                className="btn btn-secondary" 
                                                                onClick={() => handleDeleteUser(user.id, user.name)} 
                                                                style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#f87171', borderColor: '#f87171' }}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>

                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {t('users_page_indicator')} <strong>{currentPage}</strong> {t('users_page_of')} <strong>{totalPages}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >
                                        ← {t('btn_previous')}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className="btn"
                                            onClick={() => setCurrentPage(page)}
                                            style={{
                                                backgroundColor: currentPage === page ? 'var(--primary)' : 'transparent',
                                                color: currentPage === page ? 'white' : 'var(--text-main)',
                                                border: '1px solid var(--border)',
                                                padding: '0.5rem 0.75rem',
                                                fontSize: '0.8rem',
                                                borderRadius: 'var(--radius-md)',
                                            }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                                    >
                                        {t('btn_next')} →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal: Create User (Premium Glassmorphism) */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="card" style={{
                        width: '95%',
                        maxWidth: '480px',
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
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
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
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>
                            <div className="grid-form">
                                <div className="form-group">
                                    <label className="form-label">{t('table_role')}</label>
                                    {isSuperAdmin ? (
                                        <select className="form-input" value="ADMIN" disabled>
                                            <option value="ADMIN">{t('role_admin')}</option>
                                        </select>
                                    ) : (
                                        <select
                                            className="form-input"
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        >
                                            <option value="EMPLOYEE">{t('role_employee')}</option>
                                            <option value="ENCARGADO_AREA">{t('role_encargado_area')}</option>
                                            <option value="SUPERVISOR_ONBOARDING">{t('role_supervisor_onboarding')}</option>
                                            <option value="ADMIN">{t('role_admin')}</option>
                                        </select>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('login_pass')}</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            {isSuperAdmin && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label className="form-label">{t('table_company')}</label>
                                    <select
                                        className="form-input"
                                        value={newUser.client_id}
                                        onChange={e => setNewUser({ ...newUser, client_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- {t('table_company')} --</option>
                                        {companiesList.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {!isSuperAdmin && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="form-label" style={{ margin: 0 }}>Área</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {!isCreatingArea && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreatingArea(true)}
                                                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                                                >
                                                    + Nueva Área
                                                </button>
                                            )}
                                            {!isCreatingArea && newUser.area && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteArea}
                                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                                                >
                                                    Eliminar Área
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isCreatingArea ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={newAreaName}
                                                onChange={e => setNewAreaName(e.target.value)}
                                                placeholder="Nombre del área..."
                                                style={{ marginBottom: 0 }}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleCreateArea}
                                                style={{ padding: '0 12px' }}
                                            >
                                                OK
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => { setIsCreatingArea(false); setNewAreaName(''); }}
                                                style={{ padding: '0 12px' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            className="form-input"
                                            value={newUser.area || ''}
                                            onChange={e => setNewUser({ ...newUser, area: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Seleccionar Área --</option>
                                            {areas.map(a => (
                                                <option key={a.id} value={a.name}>{a.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Ubicación del Usuario (País, Ciudad, Comuna, Sucursal) */}
                            {!isSuperAdmin && (
                                <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Ubicación</h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">País</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={newUser.pais || ''}
                                                onChange={(e) => setNewUser({ ...newUser, pais: e.target.value })}
                                                placeholder="ej: Chile"
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Ciudad</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={newUser.ciudad || ''}
                                                onChange={(e) => setNewUser({ ...newUser, ciudad: e.target.value })}
                                                placeholder="ej: Santiago"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Comuna</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={newUser.comuna || ''}
                                                onChange={(e) => setNewUser({ ...newUser, comuna: e.target.value })}
                                                placeholder="ej: Providencia"
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label className="form-label" style={{ margin: 0 }}>Sucursal / Oficina</label>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    {!isCreatingOffice && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingOffice(true)}
                                                            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                                                        >
                                                            + Nueva
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isCreatingOffice ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        className="form-input"
                                                        type="text"
                                                        value={newOfficeName}
                                                        onChange={e => setNewOfficeName(e.target.value)}
                                                        placeholder="Sucursal..."
                                                        style={{ marginBottom: 0 }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={async () => {
                                                            if (!newOfficeName.trim()) return;
                                                            const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
                                                            const clientId = authUser.client_id || 1;
                                                            try {
                                                                const created = await officeService.createOffice(clientId, { name: newOfficeName.trim() });
                                                                const data = await officeService.getOffices(clientId);
                                                                setOffices(data || []);
                                                                setNewUser(prev => ({ ...prev, sucursal: created.name }));
                                                                setIsCreatingOffice(false);
                                                                setNewOfficeName('');
                                                            } catch (err) {
                                                                alert("Error al crear sucursal");
                                                            }
                                                        }}
                                                        style={{ padding: '0 8px' }}
                                                    >
                                                        OK
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => { setIsCreatingOffice(false); setNewOfficeName(''); }}
                                                        style={{ padding: '0 8px' }}
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    className="form-input"
                                                    value={newUser.sucursal || ''}
                                                    onChange={(e) => setNewUser({ ...newUser, sucursal: e.target.value })}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {offices.map(o => (
                                                        <option key={o.id} value={o.name}>{o.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Create User</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit User (Premium Glassmorphism) */}
            {showEditModal && editingUser && (
                <div className="modal-overlay">
                    <div className="card" style={{
                        width: '95%',
                        maxWidth: '480px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <button
                            onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Editar Usuario</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Actualiza los detalles del perfil del usuario.</p>

                        <form onSubmit={handleEditUser}>
                            <div className="form-group">
                                <label className="form-label">{t('table_name')}</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={editingUser.name || ''}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('table_email')}</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={editingUser.email || ''}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>
                            <div className="grid-form">
                                <div className="form-group">
                                    <label className="form-label">{t('table_role')}</label>
                                    {isSuperAdmin ? (
                                        <select className="form-input" value="ADMIN" disabled>
                                            <option value="ADMIN">{t('role_admin')}</option>
                                        </select>
                                    ) : (
                                        <select
                                            className="form-input"
                                            value={editingUser.role || 'EMPLOYEE'}
                                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        >
                                            <option value="EMPLOYEE">{t('role_employee')}</option>
                                            <option value="ENCARGADO_AREA">{t('role_encargado_area')}</option>
                                            <option value="SUPERVISOR_ONBOARDING">{t('role_supervisor_onboarding')}</option>
                                            <option value="ADMIN">{t('role_admin')}</option>
                                        </select>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('login_pass')} (Opcional)</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        value={editingUser.password || ''}
                                        onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                        placeholder="Dejar vacío para no cambiar"
                                    />
                                </div>
                            </div>
                            
                            {isSuperAdmin && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label className="form-label">{t('table_company')}</label>
                                    <select
                                        className="form-input"
                                        value={editingUser.client_id || ''}
                                        onChange={e => setEditingUser({ ...editingUser, client_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- {t('table_company')} --</option>
                                        {companiesList.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {!isSuperAdmin && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="form-label" style={{ margin: 0 }}>Área</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {!isCreatingArea && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreatingArea(true)}
                                                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                                                >
                                                    + Nueva Área
                                                </button>
                                            )}
                                            {!isCreatingArea && editingUser.area && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteArea}
                                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                                                >
                                                    Eliminar Área
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isCreatingArea ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={newAreaName}
                                                onChange={e => setNewAreaName(e.target.value)}
                                                placeholder="Nombre del área..."
                                                style={{ marginBottom: 0 }}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleCreateArea}
                                                style={{ padding: '0 12px' }}
                                            >
                                                OK
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => { setIsCreatingArea(false); setNewAreaName(''); }}
                                                style={{ padding: '0 12px' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            className="form-input"
                                            value={editingUser.area || ''}
                                            onChange={e => setEditingUser({ ...editingUser, area: e.target.value })}
                                        >
                                            <option value="">-- Seleccionar Área --</option>
                                            {areas.map(a => (
                                                <option key={a.id} value={a.name}>{a.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {!isSuperAdmin && (
                                <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Ubicación</h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">País</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={editingUser.pais || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, pais: e.target.value })}
                                                placeholder="ej: Chile"
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Ciudad</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={editingUser.ciudad || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, ciudad: e.target.value })}
                                                placeholder="ej: Santiago"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Comuna</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={editingUser.comuna || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, comuna: e.target.value })}
                                                placeholder="ej: Providencia"
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label className="form-label" style={{ margin: 0 }}>Sucursal / Oficina</label>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    {!isCreatingOffice && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingOffice(true)}
                                                            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                                                        >
                                                            + Nueva
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isCreatingOffice ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        className="form-input"
                                                        type="text"
                                                        value={newOfficeName}
                                                        onChange={e => setNewOfficeName(e.target.value)}
                                                        placeholder="Sucursal..."
                                                        style={{ marginBottom: 0 }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={async () => {
                                                            if (!newOfficeName.trim()) return;
                                                            const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
                                                            const clientId = authUser.client_id || 1;
                                                            try {
                                                                const created = await officeService.createOffice(clientId, { name: newOfficeName.trim() });
                                                                const data = await officeService.getOffices(clientId);
                                                                setOffices(data || []);
                                                                setEditingUser(prev => ({ ...prev, sucursal: created.name }));
                                                                setIsCreatingOffice(false);
                                                                setNewOfficeName('');
                                                            } catch (err) {
                                                                alert("Error al crear sucursal");
                                                            }
                                                        }}
                                                        style={{ padding: '0 8px' }}
                                                    >
                                                        OK
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => { setIsCreatingOffice(false); setNewOfficeName(''); }}
                                                        style={{ padding: '0 8px' }}
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    className="form-input"
                                                    value={editingUser.sucursal || ''}
                                                    onChange={(e) => setEditingUser({ ...editingUser, sucursal: e.target.value })}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {offices.map(o => (
                                                        <option key={o.id} value={o.name}>{o.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Guardar Cambios</button>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditingUser(null); }} style={{ flex: 1 }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Assign Onboarding / Assign Supervisor */}
            {selectedUser && (
                selectedUser.role === 'EMPLOYEE' ? (
                    /* CASE A: Assigning Onboarding to Employee */
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

                            {/* Onboarding status warning */}
                            {hasActiveJourney && (
                                <div style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    color: '#d97706',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <span style={{ fontWeight: 'bold' }}>⚠️ Advertencia:</span>
                                    <span>Este empleado ya cuenta con un proceso de onboarding activo. Puedes asignarle un nuevo proceso de todas formas para enlazar etapas.</span>
                                </div>
                            )}

                            {/* Template selector filtered by Employee Area */}
                            <div className="form-group">
                                <label className="form-label">Template</label>
                                <select
                                    className="form-input"
                                    value={assignmentData.template_id}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, template_id: e.target.value })}
                                >
                                    <option value="">Select template...</option>
                                    {templates
                                        .filter(t => t.client_id === selectedUser.client_id)
                                        .filter(t => !selectedUser.area || t.area === selectedUser.area)
                                        .map(temp => (
                                            <option key={temp.id} value={temp.id}>{temp.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mentor / Supervisor</label>
                                <select
                                    className="form-input"
                                    value={assignmentData.responsible_id}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, responsible_id: e.target.value })}
                                >
                                    <option value="">Select supervisor...</option>
                                    {users.filter(u => u.client_id === selectedUser.client_id && u.id !== selectedUser.id).map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    value={assignmentData.start_date}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, start_date: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">End Date</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    value={assignmentData.end_date}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, end_date: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-primary" onClick={handleAssign} disabled={!assignmentData.template_id} style={{ flex: 1, padding: '12px' }}>
                                    Confirm Journey
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setAssignmentData({ template_id: '', start_date: '', end_date: '', responsible_id: '', employee_id: '' });
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (selectedUser.role === 'SUPERVISOR_ONBOARDING' || selectedUser.role === 'ENCARGADO_AREA') ? (
                    /* CASE B: Assigning Employee to Supervisor */
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
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem' }}>Asignar Empleado a Supervisar</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Supervisor: {selectedUser.name}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                <strong>Área del Supervisor: </strong>
                                <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                    {selectedUser.area || 'Sin Área'}
                                </span>
                            </div>

                            {/* Dropdown: Employee to supervise (same area and has active journey) */}
                            <div className="form-group">
                                <label className="form-label">Empleado</label>
                                <select
                                    className="form-input"
                                    value={assignmentData.employee_id}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, employee_id: e.target.value })}
                                >
                                    <option value="">Selecciona un empleado de tu área...</option>
                                    {users
                                        .filter(u => 
                                            u.client_id === selectedUser.client_id &&
                                            u.role === 'EMPLOYEE' &&
                                            u.area === selectedUser.area &&
                                            journeys[u.id]
                                        )
                                        .map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.email})
                                            </option>
                                        ))
                                    }
                                </select>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    Solo aparecen empleados activos de la misma área que cuentan con un proceso de onboarding.
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-primary" onClick={handleAssignSupervisor} disabled={!assignmentData.employee_id} style={{ flex: 1, padding: '12px' }}>
                                    Asignar Empleado
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setAssignmentData({ template_id: '', start_date: '', end_date: '', responsible_id: '', employee_id: '' });
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null
            )}

            {/* Modal: Track Progress */}
            {viewingJourney && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '95%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Progress: {viewingJourney.user.name}</h2>
                            <button className="btn btn-secondary" onClick={() => setViewingJourney(null)} style={{ padding: '5px' }}><X size={18} /></button>
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
