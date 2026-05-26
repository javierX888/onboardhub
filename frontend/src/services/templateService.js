import api from './api';

let templatesCache = null;

export const templateService = {
  async getTemplates() {
    if (templatesCache) return templatesCache;
    const response = await api.get('/templates/');
    templatesCache = response.data;
    return response.data;
  },

  async getTemplatesByCompany(clientId) {
    const response = await api.get(`/templates/company/${clientId}`);
    return response.data;
  },

  async createTemplate(templateData) {
    const response = await api.post('/templates/', templateData);
    templatesCache = null;
    return response.data;
  },

  async getTemplate(id) {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  async updateTemplate(id, templateData) {
    const response = await api.put(`/templates/${id}`, templateData);
    templatesCache = null;
    return response.data;
  },

  async deleteTemplate(id) {
    const response = await api.delete(`/templates/${id}`);
    templatesCache = null;
    return response.data;
  }
};
