// src/api/assignmentApi.js
import api from './axiosConfig';

export const getAssignments = (courseId) => api.get(`/courses/${courseId}/assignments`);
export const createAssignment = (courseId, data) => api.post(`/courses/${courseId}/assignments`, data);
export const deleteAssignment = (courseId, assignmentId) =>
  api.delete(`/courses/${courseId}/assignments/${assignmentId}`);