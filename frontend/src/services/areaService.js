import api from './api';

export const areaService = {
    async getAreas(clientId) {
        const response = await api.get(`/areas/?client_id=${clientId}`);
        return response.data;
    },
    async createArea(clientId, data) {
        const response = await api.post(`/areas/?client_id=${clientId}`, data);
        return response.data;
    },
    async updateArea(id, clientId, data) {
        const response = await api.put(`/areas/${id}?client_id=${clientId}`, data);
        return response.data;
    },
    async deleteArea(id, clientId) {
        const response = await api.delete(`/areas/${id}?client_id=${clientId}`);
        return response.data;
    }
};
