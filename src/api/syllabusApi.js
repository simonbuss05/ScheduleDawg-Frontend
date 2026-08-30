// src/api/syllabusApi.js
import axios from 'axios';
import api from './axiosConfig';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const getSyllabiByCourse = (courseId) => api.get(`/courses/${courseId}/syllabi`);
export const getAllSyllabi = () => api.get('/syllabi');
export const deleteSyllabus = (syllabusId) => api.delete(`/syllabi/${syllabusId}`);

export const getSyllabusDownloadUrl = (syllabusId) => `${API_BASE}/syllabi/${syllabusId}/download`;

export const uploadSyllabus = (courseId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return axios.post(`${API_BASE}/courses/${courseId}/syllabi`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};