import api from './api';

export const userService = {
  async getUsers(status = 'active') {
    const response = await api.get('/users/', { params: { status } });
    return response.data;
  },

  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async getUsersByCompany(clientId, status = 'active') {
    const response = await api.get(`/users/company/${clientId}`, { params: { status } });
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async getDashboard(email) {
    const response = await api.get(`/employee/${email}`);
    return response.data;
  }
};
