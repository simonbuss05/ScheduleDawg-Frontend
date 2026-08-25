// src/api/meetingApi.js
import api from './axiosConfig';

export const getMeetings = (courseId) => api.get(`/courses/${courseId}/meetings`);
export const createMeeting = (courseId, data) => api.post(`/courses/${courseId}/meetings`, data);
export const deleteMeeting = (courseId, meetingId) =>
  api.delete(`/courses/${courseId}/meetings/${meetingId}`);