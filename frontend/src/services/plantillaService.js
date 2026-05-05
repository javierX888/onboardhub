import api from './api';

const basePath = '/plantillas';

let plantillasCache = null;

export const getPlantillas = async (forceRefresh = false) => {
    if (plantillasCache && !forceRefresh) return plantillasCache;
    const response = await api.get(basePath);
    plantillasCache = response.data;
    return response.data;
};

export const getPlantilla = async (id) => {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
};

export const createPlantilla = async (data) => {
    const response = await api.post(basePath, data);
    plantillasCache = null; // Invalidate cache
    return response.data;
};

export const updatePlantilla = async (id, data) => {
    const response = await api.put(`${basePath}/${id}`, data);
    plantillasCache = null; // Invalidate cache
    return response.data;
};

export const deletePlantilla = async (id) => {
    const response = await api.delete(`${basePath}/${id}`);
    plantillasCache = null; // Invalidate cache
    return response.data;
};
