import api from './api';

export const asignarJourney = async (journeyData) => {
    try {
        const response = await api.post('/journeys/asignar', journeyData);
        return response.data;
    } catch (error) {
        console.error('Error al asignar journey:', error);
        throw error;
    }
};
