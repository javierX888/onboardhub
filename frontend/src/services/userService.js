import api from './api';

export const userService = {
  async getUsers() {
    const response = await api.get('/users/');
    return response.data;
  },

  async getUsersByCompany(clientId) {
    const response = await api.get(`/users/company/${clientId}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
