import api from './api';

const basePath = '/empresas';

let empresasCache = null;

export const getEmpresas = async (forceRefresh = false) => {
    if (empresasCache && !forceRefresh) return empresasCache;
    const response = await api.get(basePath);
    empresasCache = response.data;
    return response.data;
};

export const getEmpresa = async (id) => {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
};

export const createEmpresa = async (data) => {
    const response = await api.post(basePath, data);
    empresasCache = null; // Invalidate cache
    return response.data;
};

export const updateEmpresa = async (id, data) => {
    const response = await api.put(`${basePath}/${id}`, data);
    empresasCache = null; // Invalidate cache
    return response.data;
};
