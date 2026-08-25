// src/api/courseApi.js
import api from './axiosConfig';

export const getCourses = () => api.get('/courses');
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const createCourse = (courseData) => api.post('/courses', courseData);
export const updateCourse = (id, courseData) => api.put(`/courses/${id}`, courseData);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);