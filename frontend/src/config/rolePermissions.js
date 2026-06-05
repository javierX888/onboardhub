// Role-based access control configuration
export const ROLE_PERMISSIONS = {
  SUPERADMIN: {
    canAccess: [
      'talent-management',
      'companies',
      'settings'
    ]
  },
  ADMIN: {
    canAccess: [
      'dashboard',
      'processes',
      'templates',
      'talent-management',
      'onboarding-team',
      'alerts',
      'analytics',
      'settings'
    ]
  },
  SUPERVISOR_ONBOARDING: {
    canAccess: [
      'dashboard',
      'processes',
      'alerts',
      'analytics',
      'settings'
    ]
  },
  ENCARGADO_AREA: {
    canAccess: [
      'processes',
      'alerts',
      'settings'
    ]
  }
};

/**
 * Check if a user role has access to a specific section
 * @param {string} userRole - The user's role
 * @param {string} section - The section to check access for
 * @returns {boolean} - True if user has access, false otherwise
 */
export const hasAccessToSection = (userRole, section) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.canAccess.includes(section) : false;
};
