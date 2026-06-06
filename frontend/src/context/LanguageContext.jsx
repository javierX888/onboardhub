import React, { createContext, useState, useEffect, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  es: {
    login_title: "Iniciar Sesión",
    login_user: "Usuario",
    login_pass: "Contraseña",
    login_btn: "Ingresar",
    location_placeholder: "Sede / Oficina",
    
    users_subtitle: "Gestiona los miembros de tu organización y su proceso de onboarding",
    users_add_title: "Agregar Nuevo Miembro",
    users_add_subtitle: "Añade un nuevo empleado o encargado a tu plataforma.",
    companies_subtitle: "Administración SaaS Multi-tenant.",
    
    role_admin: "Administrador",
    role_onboarding_manager: "Encargado Onboarding",
    role_employee: "Empleado",
    role_superadmin: "Super Administrador",
    role_supervisor_onboarding: "Supervisor de Onboarding",
    role_responsable_area: "Responsable de Área",
    role_encargado_area: "Encargado de Área",
    
    sidebar_dashboard: "Dashboard",
    sidebar_procesos: "Mis Procesos",
    sidebar_plantillas: "Mis Plantillas",
    sidebar_talento: "Gestión de Talento",
    sidebar_equipo_onboarding: "Equipo de Onboarding",
    sidebar_alertas: "Centro de Alertas",
    sidebar_analitica: "Analítica",
    sidebar_empresas: "Empresas",
    sidebar_usuarios: "Gestión de Talento",
    sidebar_ajustes: "Ajustes",
    
    dashboard_title: "Dashboard",
    dashboard_subtitle: "Vista general del onboarding",
    dashboard_kpi_active: "Procesos Activos",
    dashboard_kpi_employees: "Empleados en Onboarding",
    dashboard_kpi_overdue: "Tareas Vencidas",
    dashboard_kpi_nps: "NPS Promedio",
    dashboard_kpi_progress_avg: "Progreso Promedio",
    dashboard_employee_status: "Estado de Empleados",
    dashboard_recent_alerts: "Alertas Recientes",
    dashboard_new_process: "Nuevo Proceso",
    
    portal_admin: "Portal Admin",
    portal_employee: "Portal Empleado",
    
    modal_ajustes_title: "Ajustes del Sistema",
    modal_ajustes_appearance: "Apariencia",
    modal_ajustes_language: "Idioma",
    theme_light: "Claro",
    theme_dark: "Oscuro",
    theme_system: "Sistema",
    
    btn_close: "Cerrar",
    btn_save: "Guardar",
    btn_cancel: "Cancelar",
    btn_delete: "Eliminar",
    btn_add: "Agregar",
    btn_edit: "Editar",
    btn_assign: "Asignar",
    btn_track: "Seguimiento",
    btn_complete: "Completar",
    
    table_id: "ID",
    table_name: "Nombre",
    table_email: "Email",
    table_role: "Rol",
    table_company: "Empresa",
    table_status: "Estado",
    table_actions: "Acciones",
    table_location: "Ubicación",
    table_tasks: "Tareas",
    table_process: "Proceso",
    
    status_active: "Activo",
    status_inactive: "Inactivo",
    
    msg_confirm_delete: "¿Estás seguro de que quieres eliminar este elemento?",
    msg_success_delete: "Eliminado con éxito",
    msg_error_generic: "Error al cargar los datos",
    msg_loading: "Cargando...",
    msg_no_data: "No hay datos disponibles",
    msg_success_assign: "✅ ¡Onboarding asignado exitosamente!",
    msg_error_assign: "❌ Error al asignar onboarding.",
    msg_success_complete: "✅ Tarea completada con éxito",
    
    // Procesos
    processes_kpi_total: "Procesos Totales",
    processes_kpi_progress: "En Progreso",
    processes_kpi_completed: "Completados",
    processes_role_view: "Vista de Rol",
    processes_col_employee: "Colaborador",
    processes_col_area: "Área",
    processes_col_role: "Rol",
    processes_col_progress: "Progreso",
    processes_col_start: "Fecha Inicio",
    processes_col_end: "Fecha Fin",
    processes_col_location: "Ubicación",
    processes_col_actions: "Acciones",
    processes_btn_detail: "Ver Detalle",
    processes_modal_title: "Progreso de",
    processes_modal_task: "Tarea",
    processes_modal_status: "Estado",
    processes_modal_evidence: "Evidencia",
    processes_modal_completed: "Completada",
    processes_modal_pending: "Pendiente",
    processes_modal_download: "Descargar Evidencia",
    processes_modal_no_evidence: "Sin evidencia",
    processes_modal_no_journey: "No hay un proceso de onboarding activo asignado a este colaborador.",
    processes_empty_state: "No hay procesos de onboarding activos en este momento",
    processes_loading: "Cargando procesos...",
    
    // Filtros de usuarios
    filter_name: "Filtrar por Nombre",
    filter_email: "Filtrar por Email",
    filter_role: "Filtrar por Rol",
    filter_onboarding_status: "Filtrar por Estado de Onboarding",
    filter_all_statuses: "Todos los estados",
    filter_unassigned: "Sin Asignar",
    filter_in_progress: "En Proceso",
    filter_completed: "Completado",
    users_showing_count: "Mostrando",
    users_showing_of: "de",
    users_showing_users: "usuarios",
    users_per_page: "Usuarios por página:",
    users_page_indicator: "Página",
    users_page_of: "de",
    
    // Formulario de empresas
    company_new_title: "Nueva Empresa",
    company_edit_title: "Editar Empresa",
    company_country: "País",
    company_region_chile: "Región",
    company_region_mexico: "Estado",
    company_region_colombia: "Departamento",
    company_region_argentina: "Provincia",
    company_region_peru: "Departamento",
    company_region_default: "Región/Estado",
    company_city_commune: "Comuna / Ciudad",
    company_city_commune_placeholder: "Escribe la comuna o ciudad...",
    company_delete_confirm: "¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer.",
    company_delete_success: "Empresa eliminada exitosamente",
    processes_subtitle: "Control y seguimiento de procesos de inducción y onboarding.",
    processes_admin_view: "Visualizando todos los procesos de onboarding de la empresa.",
    processes_supervisor_view: "Visualizando procesos bajo tu supervisión directa.",
    processes_encargado_view: "Visualizando procesos del área de:",
    processes_user_id: "Usuario ID",
    location_remote: "Remoto",
    processes_modal_progress_general: "Progreso General",
    processes_group_custom: "Procesos Personalizados / Sin Plantilla",
    processes_btn_delete: "Eliminar Proceso",
    filter_name_placeholder: "Buscar nombre...",
    filter_email_placeholder: "Buscar email...",
    filter_all_roles: "Todos los roles",
    btn_previous: "Anterior",
    btn_next: "Siguiente"
  },
  en: {
    login_title: "Sign In",
    login_user: "Username",
    login_pass: "Password",
    login_btn: "Sign In",
    location_placeholder: "Site / Location",
    
    users_subtitle: "Manage your organization members and their onboarding journey",
    users_add_title: "Add New Member",
    users_add_subtitle: "Add a new employee or manager to your platform.",
    companies_subtitle: "SaaS Multi-tenant administration.",
    
    role_admin: "Admin",
    role_onboarding_manager: "Onboarding Manager",
    role_employee: "Employee",
    role_superadmin: "Super Admin",
    role_supervisor_onboarding: "Onboarding Supervisor",
    role_responsable_area: "Area Responsible",
    role_encargado_area: "Area Manager",
    
    sidebar_dashboard: "Dashboard",
    sidebar_procesos: "My Processes",
    sidebar_plantillas: "My Templates",
    sidebar_talento: "Talent Management",
    sidebar_equipo_onboarding: "Onboarding Team",
    sidebar_alertas: "Alerts",
    sidebar_analitica: "Analytics",
    sidebar_empresas: "Companies",
    sidebar_usuarios: "Users",
    sidebar_ajustes: "Settings",
    
    dashboard_title: "Dashboard",
    dashboard_subtitle: "Onboarding Overview",
    dashboard_kpi_active: "Active Processes",
    dashboard_kpi_employees: "Employees in Onboarding",
    dashboard_kpi_overdue: "Overdue Tasks",
    dashboard_kpi_nps: "Average NPS",
    dashboard_kpi_progress_avg: "Average Progress",
    dashboard_employee_status: "Employee Status",
    dashboard_recent_alerts: "Recent Alerts",
    dashboard_new_process: "New Process",
    
    portal_admin: "Admin Portal",
    portal_employee: "Employee Portal",
    
    modal_ajustes_title: "System Settings",
    modal_ajustes_appearance: "Appearance",
    modal_ajustes_language: "Language",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_system: "System",
    
    btn_close: "Close",
    btn_save: "Save",
    btn_cancel: "Cancel",
    btn_delete: "Delete",
    btn_add: "Add",
    btn_edit: "Edit",
    btn_assign: "Assign",
    btn_track: "Track",
    btn_complete: "Complete",
    
    table_id: "ID",
    table_name: "Name",
    table_email: "Email",
    table_role: "Role",
    table_company: "Company",
    table_status: "Status",
    table_actions: "Actions",
    table_location: "Location",
    table_tasks: "Tasks",
    table_process: "Process",
    
    status_active: "Active",
    status_inactive: "Inactive",
    
    msg_confirm_delete: "Are you sure you want to delete this item?",
    msg_success_delete: "Successfully deleted",
    msg_error_generic: "An error occurred",
    msg_loading: "Loading...",
    msg_no_data: "No data found.",
    msg_success_assign: "✅ Onboarding assigned successfully!",
    msg_error_assign: "❌ Error assigning onboarding.",
    msg_success_complete: "✅ Task completed successfully",
    
    // Processes
    processes_kpi_total: "Total Processes",
    processes_kpi_progress: "In Progress",
    processes_kpi_completed: "Completed",
    processes_role_view: "Role View",
    processes_col_employee: "Employee",
    processes_col_area: "Area",
    processes_col_role: "Role",
    processes_col_progress: "Progress",
    processes_col_start: "Start Date",
    processes_col_end: "End Date",
    processes_col_location: "Location",
    processes_col_actions: "Actions",
    processes_btn_detail: "View Detail",
    processes_modal_title: "Progress of",
    processes_modal_task: "Task",
    processes_modal_status: "Status",
    processes_modal_evidence: "Evidence",
    processes_modal_completed: "Completed",
    processes_modal_pending: "Pending",
    processes_modal_download: "Download Evidence",
    processes_modal_no_evidence: "No evidence",
    processes_modal_no_journey: "No active onboarding process assigned to this employee.",
    processes_empty_state: "There are no active onboarding processes at this moment",
    processes_loading: "Loading processes...",
    
    // User filters
    filter_name: "Filter by Name",
    filter_email: "Filter by Email",
    filter_role: "Filter by Role",
    filter_onboarding_status: "Filter by Onboarding Status",
    filter_all_statuses: "All statuses",
    filter_unassigned: "Unassigned",
    filter_in_progress: "In Progress",
    filter_completed: "Completed",
    users_showing_count: "Showing",
    users_showing_of: "of",
    users_showing_users: "users",
    users_per_page: "Users per page:",
    users_page_indicator: "Page",
    users_page_of: "of",
    
    // Company form
    company_new_title: "New Company",
    company_edit_title: "Edit Company",
    company_country: "Country",
    company_region_chile: "Region",
    company_region_mexico: "State",
    company_region_colombia: "Department",
    company_region_argentina: "Province",
    company_region_peru: "Department",
    company_region_default: "Region/State",
    company_city_commune: "City / Commune",
    company_city_commune_placeholder: "Type city or commune...",
    company_delete_confirm: "Are you sure you want to delete this company? This action cannot be undone.",
    company_delete_success: "Company successfully deleted",
    processes_subtitle: "Control and monitoring of induction and onboarding processes.",
    processes_admin_view: "Viewing all onboarding processes of the company.",
    processes_supervisor_view: "Viewing processes under your direct supervision.",
    processes_encargado_view: "Viewing processes of the area:",
    processes_user_id: "User ID",
    location_remote: "Remote",
    processes_modal_progress_general: "General Progress",
    processes_group_custom: "Custom / No Template Processes",
    processes_btn_delete: "Delete Process",
    filter_name_placeholder: "Search name...",
    filter_email_placeholder: "Search email...",
    filter_all_roles: "All roles",
    btn_previous: "Previous",
    btn_next: "Next"
  }
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('onboardhub_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('onboardhub_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    let value = translations[language];
    if (value && value[key]) {
      return value[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
