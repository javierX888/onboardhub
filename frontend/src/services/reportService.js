import api from './api';

export const reportService = {
  async getOnboardingReport({ empresaId, clientId, desde, hasta }) {
    const response = await api.get('/reportes/onboarding', {
      params: {
        empresaId,
        client_id: clientId,
        desde,
        hasta
      }
    });
    return response.data;
  }
};
