import api from './api';

export const employeeService = {
  async getDashboard(email) {
    const response = await api.get(`/employee/${email}`);
    return response.data;
  }
};

export const journeyService = {
  async createJourney(journeyData) {
    const response = await api.post('/journeys/', journeyData);
    return response.data;
  },
  
  async updateTaskStatus(taskId, completed, responsibleId = null) {
    const response = await api.put(`/journeys/task/${taskId}`, { 
        completed,
        responsible_id: responsibleId 
    });
    return response.data;
  },

  async completeTask(taskId, clientId, file = null) {
    const formData = new FormData();
    formData.append('client_id', clientId);
    if (file) {
      formData.append('file', file);
    }
    
    const response = await api.post(`/journeys/task/${taskId}/complete`, formData);
    return response.data;
  }
};
