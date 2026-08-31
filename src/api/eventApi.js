// src/api/eventApi.js
import api from './axiosConfig';

export const getEvents = (courseId) => api.get(`/courses/${courseId}/events`);
export const createEvent = (courseId, data) => api.post(`/courses/${courseId}/events`, data);
export const deleteEvent = (courseId, eventId) =>
  api.delete(`/courses/${courseId}/events/${eventId}`);
