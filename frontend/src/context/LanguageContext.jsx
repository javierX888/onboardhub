import React, { createContext, useState, useEffect, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  es: {
    sidebar_empresas: "Empresas",
    sidebar_usuarios: "Usuarios",
    sidebar_plantillas: "Plantillas",
    sidebar_ajustes: "Ajustes",
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
    table_location: "Sede",
    table_tasks: "Tareas",
    status_active: "Activo",
    status_inactive: "Inactivo",
    msg_confirm_delete: "¿Estás seguro de que quieres eliminar este elemento?",
    msg_success_delete: "Eliminado con éxito",
    msg_error_generic: "Ocurrió un error",
    msg_loading: "Cargando...",
    msg_no_data: "No se encontraron datos.",
    msg_success_assign: "✅ ¡Onboarding asignado exitosamente!",
    msg_error_assign: "❌ Error al asignar onboarding.",
    msg_success_complete: "✅ Tarea completada con éxito",
    login_title: "Administración OnBoardHub",
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
    role_superadmin: "Super Administrador"
  },
  en: {
    sidebar_empresas: "Companies",
    sidebar_usuarios: "Users",
    sidebar_plantillas: "Templates",
    sidebar_ajustes: "Settings",
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
    login_title: "OnBoardHub Admin",
    login_user: "Username",
    login_pass: "Password",
    login_btn: "Login",
    location_placeholder: "Site / Location",
    users_subtitle: "Manage your organization members and their onboarding journey",
    users_add_title: "Add New Member",
    users_add_subtitle: "Add a new employee or manager to your platform.",
    companies_subtitle: "SaaS Multi-tenant administration.",
    role_admin: "Admin",
    role_onboarding_manager: "Onboarding Manager",
    role_employee: "Employee",
    role_superadmin: "Super Admin"
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
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value[k]) {
        value = value[k];
      } else {
        return key;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
