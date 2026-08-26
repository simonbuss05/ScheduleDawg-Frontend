// src/api/settingsApi.js
import api from './axiosConfig';

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);