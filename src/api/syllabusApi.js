// src/api/syllabusApi.js
import api from './axiosConfig';

export const getSyllabiByCourse = (courseId) => api.get(`/courses/${courseId}/syllabi`);
export const getAllSyllabi = () => api.get('/syllabi');
export const deleteSyllabus = (syllabusId) => api.delete(`/syllabi/${syllabusId}`);

export const getSyllabusFile = (syllabusId) =>
  api.get(`/syllabi/${syllabusId}/download`, { responseType: 'blob' });

export const uploadSyllabus = (courseId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/courses/${courseId}/syllabi`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};