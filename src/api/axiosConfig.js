// src/api/axiosConfig.js
import axios from 'axios';

export const AUTH_TOKEN_KEY = 'scheduledawg_token';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
