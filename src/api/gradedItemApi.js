// src/api/gradedItemApi.js
import api from './axiosConfig';

export const getGradedItems = (categoryId) => api.get(`/categories/${categoryId}/items`);
export const createGradedItem = (categoryId, data) => api.post(`/categories/${categoryId}/items`, data);
export const updateGradedItem = (categoryId, itemId, data) =>
  api.put(`/categories/${categoryId}/items/${itemId}`, data);
export const deleteGradedItem = (categoryId, itemId) =>
  api.delete(`/categories/${categoryId}/items/${itemId}`);