import apiClient from '../../config/api';

export const analyzeExamResults = (payload) =>
  apiClient.post('/ai/analyze', payload);

export const generateQuestions = (payload) =>
  apiClient.post('/ai/generate-questions', payload);

export const generateReport = (payload) =>
  apiClient.post('/ai/generate-report', payload);