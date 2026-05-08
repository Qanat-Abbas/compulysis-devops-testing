import api from './api';

const DIMENSION_KEYS = [
  'Contamination_and_Washing',
  'Checking_Behavior',
  'Ordering_Symmetry',
  'Hoarding_Collecting',
  'Intrusive_Thoughts',
  'Mental_Compulsions_and_Rituals',
  'Avoidance_Behavior',
  'Emotional_Awareness_and_Insights',
  'Functioning_Behavior',
];

const normalizePayload = (payload) => {
  const demographics = payload?.demographics || {};
  const responses = payload?.responses || {};

  const normalizedResponses = DIMENSION_KEYS.reduce((acc, key) => {
    const value = Number(responses[key]);
    acc[key] = Number.isFinite(value) ? value : 0;
    return acc;
  }, {});

  const ageValue = Number(demographics.age);
  const normalizedDemographics = {
    age: Number.isFinite(ageValue) ? ageValue : 25,
    gender: demographics.gender || 'Prefer not to say',
    education: demographics.education || 'Undergraduate',
  };

  return {
    patientId: payload?.patientId ?? null,
    demographics: normalizedDemographics,
    responses: normalizedResponses,
  };
};

export const assessmentService = {
  async submitAssessment(payload) {
    const { data } = await api.post('/assessments', normalizePayload(payload));
    return data;
  },
};
