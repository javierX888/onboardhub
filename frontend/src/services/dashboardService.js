import api from './api';

export const dashboardService = {
  async getAdminDashboard(clientId) {
    const response = await api.get(`/dashboard/admin?client_id=${clientId}`);
    return response.data;
  },
  async getSupervisorDashboard(clientId, supervisorId) {
    const response = await api.get(`/dashboard/supervisor?client_id=${clientId}&supervisor_id=${supervisorId}`);
    return response.data;
  },
  async getEmployeeDashboard(employeeId) {
    const response = await api.get(`/dashboard/employee/${employeeId}`);
    return response.data;
  }
};
