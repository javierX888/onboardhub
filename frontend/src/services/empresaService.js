import api from './api';

const basePath = '/empresas';

export const getEmpresas = async () => {
    const response = await api.get(basePath);
    return response.data;
};

export const getEmpresa = async (id) => {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
};

export const createEmpresa = async (data) => {
    const response = await api.post(basePath, data);
    return response.data;
};

export const updateEmpresa = async (id, data) => {
    const response = await api.put(`${basePath}/${id}`, data);
    return response.data;
};
