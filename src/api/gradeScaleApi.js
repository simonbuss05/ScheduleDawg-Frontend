// src/api/gradeScaleApi.js
import api from './axiosConfig';

export const getGradeScale = (courseId) => api.get(`/courses/${courseId}/scale`);
export const createGradeScaleEntry = (courseId, data) => api.post(`/courses/${courseId}/scale`, data);
export const updateGradeScaleEntry = (courseId, scaleId, data) =>
  api.put(`/courses/${courseId}/scale/${scaleId}`, data);
export const deleteGradeScaleEntry = (courseId, scaleId) =>
  api.delete(`/courses/${courseId}/scale/${scaleId}`);