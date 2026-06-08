import api from './api';

export const officeService = {
    async getOffices(clientId) {
        const response = await api.get(`/offices/?client_id=${clientId}`);
        return response.data;
    },
    async createOffice(clientId, data) {
        const response = await api.post(`/offices/?client_id=${clientId}`, data);
        return response.data;
    },
    async updateOffice(id, clientId, data) {
        const response = await api.put(`/offices/${id}?client_id=${clientId}`, data);
        return response.data;
    },
    async deleteOffice(id, clientId) {
        const response = await api.delete(`/offices/${id}?client_id=${clientId}`);
        return response.data;
    }
};
