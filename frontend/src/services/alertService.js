import api from './api';

export const alertService = {
  async getAlerts(clientId, status = 'active', userId = null) {
    const response = await api.get('/alerts/', {
      params: {
        client_id: clientId,
        status,
        ...(userId ? { user_id: userId } : {})
      }
    });
    return response.data;
  },

  async attendAlert(alertId, clientId, userId) {
    const response = await api.put(`/alerts/${alertId}/attend?client_id=${clientId}&user_id=${userId}`);
    return response.data;
  }
};