import api from './api';

export const dashboardService = {
  async getDashboardData() {
    const { data } = await api.get('/dashboard/overview');
    return data;
  },

  async getTrendData() {
    const { data } = await api.get('/dashboard/trends');
    return data;
  },

  async getRiskDistribution() {
    const { data } = await api.get('/dashboard/risk-distribution');
    return data;
  },

  async getInsights() {
    const { data } = await api.get('/dashboard/insights');
    return data;
  },

  async getRecentActivities() {
    const { data } = await api.get('/dashboard/recent-activities');
    return data;
  },

  async getUpcomingTasks() {
    const { data } = await api.get('/dashboard/upcoming-tasks');
    return data;
  },
};
