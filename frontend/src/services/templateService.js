import api from './api';

let templatesCache = null;
const templatesByStatusCache = {};

export const templateService = {
  async getTemplates(status = 'active') {
    if (templatesByStatusCache[status]) return templatesByStatusCache[status];
    const response = await api.get('/templates/', { params: { status } });
    templatesByStatusCache[status] = response.data;
    if (status === 'active') templatesCache = response.data;
    return response.data;
  },

  async getTemplatesByCompany(clientId, status = 'active') {
    const response = await api.get(`/templates/company/${clientId}`, { params: { status } });
    return response.data;
  },

  async createTemplate(templateData) {
    const response = await api.post('/templates/', templateData);
    templatesCache = null;
    Object.keys(templatesByStatusCache).forEach(key => delete templatesByStatusCache[key]);
    return response.data;
  },

  async getTemplate(id) {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  async updateTemplate(id, templateData) {
    const response = await api.put(`/templates/${id}`, templateData);
    templatesCache = null;
    Object.keys(templatesByStatusCache).forEach(key => delete templatesByStatusCache[key]);
    return response.data;
  },

  async deleteTemplate(id) {
    const response = await api.delete(`/templates/${id}`);
    templatesCache = null;
    Object.keys(templatesByStatusCache).forEach(key => delete templatesByStatusCache[key]);
    return response.data;
  }
};
