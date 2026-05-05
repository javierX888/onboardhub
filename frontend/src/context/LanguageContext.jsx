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
    btn_close: "Cerrar"
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
    btn_close: "Close"
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
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
