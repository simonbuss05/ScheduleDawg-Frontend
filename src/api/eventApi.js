// src/api/eventApi.js
import api from './axiosConfig';

export const getEvents = (meetingId) => api.get(`/meetings/${meetingId}/events`);
export const createEvent = (meetingId, data) => api.post(`/meetings/${meetingId}/events`, data);
export const deleteEvent = (meetingId, eventId) =>
  api.delete(`/meetings/${meetingId}/events/${eventId}`);