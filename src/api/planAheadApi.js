// src/api/planAheadApi.js
import api from './axiosConfig';

export const getPlannedCourses = () => api.get('/plan-ahead/courses');
export const createPlannedCourse = (data) => api.post('/plan-ahead/courses', data);
export const deletePlannedCourse = (id) => api.delete(`/plan-ahead/courses/${id}`);

export const getInstructors = (plannedCourseId) =>
  api.get(`/plan-ahead/courses/${plannedCourseId}/instructors`);

export const getInstructorSyllabusFile = (instructorId) =>
  api.get(`/plan-ahead/instructors/${instructorId}/syllabus`, { responseType: 'blob' });

export const getInstructorGradingSchema = (instructorId) =>
  api.get(`/plan-ahead/instructors/${instructorId}/grading-schema`);
