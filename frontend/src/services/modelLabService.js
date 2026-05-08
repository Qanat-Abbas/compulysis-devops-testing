import api from './api';

export const modelLabService = {
  async getSummary() {
    const { data } = await api.get('/model-lab/summary');
    return data;
  },
};
