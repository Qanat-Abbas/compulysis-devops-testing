import api from './api';

export const dataExplorerService = {
  async getDemographicsData(source, filters) {
    const { data } = await api.post('/data-explorer/demographics', { source, filters });
    return data;
  },

  async getOcdAnalysisData(source, filters) {
    const { data } = await api.post('/data-explorer/ocd-analysis', { source, filters });
    return data;
  },

  async getCorrelationData(source, filters) {
    const { data } = await api.post('/data-explorer/correlations', { source, filters });
    return data;
  },

  async getDataCounts(source, filters) {
    const { data } = await api.post('/data-explorer/counts', { source, filters });
    return data;
  },
};
