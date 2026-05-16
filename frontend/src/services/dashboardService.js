import api from './api';

export const dashboardService = {
  async getAdminDashboard(clientId) {
    const response = await api.get(`/dashboard/admin?client_id=${clientId}`);
    return response.data;
  }
};
