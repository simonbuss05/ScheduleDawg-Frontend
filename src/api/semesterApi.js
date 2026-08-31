// src/api/semesterApi.js
import api from './axiosConfig';

export const getSemesters = () => api.get('/semesters');
export const getActiveSemester = () => api.get('/semesters/active');
export const createSemester = (name) => api.post('/semesters', { name });
export const activateSemester = (id) => api.post(`/semesters/${id}/activate`);
