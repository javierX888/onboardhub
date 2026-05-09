import api from './api';

let companiesCache = null;

export const companyService = {
  async getCompanies() {
    if (companiesCache) return companiesCache;
    const response = await api.get('/companies/');
    companiesCache = response.data;
    return response.data;
  },

  async createCompany(companyData) {
    const response = await api.post('/companies/', companyData);
    companiesCache = null; // Invalidate cache
    return response.data;
  },

  async updateCompany(id, companyData) {
    const response = await api.put(`/companies/${id}`, companyData);
    companiesCache = null; // Invalidate cache
    return response.data;
  },

  async deleteCompany(id) {
    const response = await api.delete(`/companies/${id}`);
    companiesCache = null; // Invalidate cache
    return response.data;
  }
};
