// src/api/finalApi.js
import api from './axiosConfig';

export const getFinals = (courseId) => api.get(`/courses/${courseId}/finals`);
export const createFinal = (courseId, data) => api.post(`/courses/${courseId}/finals`, data);
export const updateFinal = (courseId, finalId, data) =>
  api.put(`/courses/${courseId}/finals/${finalId}`, data);
export const deleteFinal = (courseId, finalId) =>
  api.delete(`/courses/${courseId}/finals/${finalId}`);