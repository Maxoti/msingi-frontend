/**
 * src/modules/staff/api.js
 * API calls for staff management
 */

import api from '../../config/api';

export const getAllStaff  = (params = {}) => api.get('/staff', { params });
export const getStaffById = (id)          => api.get(`/staff/${id}`);
export const createStaff  = (data)        => api.post('/staff', data);
export const updateStaff  = (id, data)    => api.put(`/staff/${id}`, data);
export const deactivateStaff = (id)       => api.delete(`/staff/${id}`);
export const searchStaff  = (q, params={})=> api.get('/staff/search', { params: { q, ...params } });