// src/api/authApi.js
import api from './axiosConfig';

export const registerUser = (email, password) => api.post('/auth/register', { email, password });
export const loginUser = (email, password) => api.post('/auth/login', { email, password });
export const getCurrentUser = () => api.get('/auth/me');
export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/password', { currentPassword, newPassword });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword });
export const deleteAccount = (password) =>
  api.delete('/auth/account', { data: { password } });
