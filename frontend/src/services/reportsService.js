import api from './api';

export const reportsService = {
  async getReports() {
    const { data } = await api.get('/reports');
    return data;
  },

  async downloadReport(reportId, format = 'pdf') {
    const { data } = await api.get(`/reports/${reportId}/download`, { params: { format } });
    return data;
  },

  async markAsReviewed(reportId) {
    const { data } = await api.post(`/reports/${reportId}/review`);
    return data;
  },

  async emailReport(reportId, patientEmail) {
    const { data } = await api.post(`/reports/${reportId}/email`, { patientEmail });
    return data;
  },

  async getStatistics() {
    const { data } = await api.get('/reports/statistics');
    return data;
  },
};
