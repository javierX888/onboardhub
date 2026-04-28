import api from './api';

const basePath = '/plantillas';

export const getPlantillas = async () => {
    const response = await api.get(basePath);
    return response.data;
};

export const getPlantilla = async (id) => {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
};

export const createPlantilla = async (data) => {
    const response = await api.post(basePath, data);
    return response.data;
};

export const updatePlantilla = async (id, data) => {
    const response = await api.put(`${basePath}/${id}`, data);
    return response.data;
};

export const deletePlantilla = async (id) => {
    const response = await api.delete(`${basePath}/${id}`);
    return response.data;
};
