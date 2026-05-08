import api from './api';

export const patientService = {
  async getMyPatients(status = 'active') {
    const { data } = await api.get('/patients/me', { params: { status } });
    return data;
  },

  async getPatientById(patientId) {
    const { data } = await api.get(`/patients/${patientId}`);
    return data;
  },

  async createPatient(payload) {
    const { data } = await api.post('/patients', payload);
    return data;
  },

  async updatePatient(patientId, payload) {
    const { data } = await api.put(`/patients/${patientId}`, payload);
    return data;
  },

  async deletePatient(patientId) {
    const { data } = await api.delete(`/patients/${patientId}`);
    return data;
  },

  async unarchivePatient(patientId) {
    const { data } = await api.patch(`/patients/${patientId}/unarchive`);
    return data;
  },

  async getPatientStatistics() {
    const { data } = await api.get('/patients/statistics');
    return data;
  },
};
