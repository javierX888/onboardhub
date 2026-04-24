import api from './api';

const basePath = '/empleado';

export const getEmpleadoJourney = async (empleadoId) => {
    // Maneja llamadas para consultar el Timeline del Empleado
    const response = await api.get(`${basePath}/journey/${empleadoId}`);
    return response.data;
};
