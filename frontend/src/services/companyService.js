import api from './api';

let companiesCache = null;
const companiesByStatusCache = {};

export const companyService = {
  async getCompanies(status = 'active') {
    if (companiesByStatusCache[status]) return companiesByStatusCache[status];
    const response = await api.get('/companies/', { params: { status } });
    companiesByStatusCache[status] = response.data;
    if (status === 'active') companiesCache = response.data;
    return response.data;
  },

  async getCompany(id) {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  async createCompany(companyData) {
    const response = await api.post('/companies/', companyData);
    companiesCache = null; // Invalidate cache
    Object.keys(companiesByStatusCache).forEach(key => delete companiesByStatusCache[key]);
    return response.data;
  },

  async updateCompany(id, companyData) {
    const response = await api.put(`/companies/${id}`, companyData);
    companiesCache = null; // Invalidate cache
    Object.keys(companiesByStatusCache).forEach(key => delete companiesByStatusCache[key]);
    return response.data;
  },

  async deleteCompany(id) {
    const response = await api.delete(`/companies/${id}`);
    companiesCache = null; // Invalidate cache
    Object.keys(companiesByStatusCache).forEach(key => delete companiesByStatusCache[key]);
    return response.data;
  }
};
