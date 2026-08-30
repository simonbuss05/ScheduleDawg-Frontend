// src/api/gradeCategoryApi.js
import api from './axiosConfig';

export const getGradeCategories = (courseId) => api.get(`/courses/${courseId}/gradeCategories`);
export const createGradeCategory = (courseId, data) => api.post(`/courses/${courseId}/gradeCategories`, data);
export const updateGradeCategory = (courseId, categoryId, data) =>
  api.put(`/courses/${courseId}/gradeCategories/${categoryId}`, data);
export const deleteGradeCategory = (courseId, categoryId) =>
  api.delete(`/courses/${courseId}/gradeCategories/${categoryId}`);