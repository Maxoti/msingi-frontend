/**
 * src/modules/students/api.js
 * All student-related API calls using the shared axios instance
 * Matches routes in students.routes.js
 */

import api from '../../config/api';

// ── Students CRUD ─────────────────────────────────────────────

// GET /api/v1/students?status=ACTIVE&gender=MALE&classId=xxx
export const getAllStudents = (filters = {}) =>
  api.get('/students', { params: filters });

// GET /api/v1/students/:id
export const getStudentById = (id) =>
  api.get(`/students/${id}`);

// GET /api/v1/students/:id/profile
export const getStudentProfile = (id) =>
  api.get(`/students/${id}/profile`);

// GET /api/v1/students/admission/:admission_no
export const getStudentByAdmissionNo = (admissionNo) =>
  api.get(`/students/admission/${admissionNo}`);

// GET /api/v1/students/search?q=john
export const searchStudents = (term, filters = {}) =>
  api.get('/students/search', { params: { q: term, ...filters } });

// POST /api/v1/students
export const createStudent = (data) =>
  api.post('/students', data);

// PUT /api/v1/students/:id
export const updateStudent = (id, data) =>
  api.put(`/students/${id}`, data);

// DELETE /api/v1/students/:id
export const deleteStudent = (id, hardDelete = false) =>
  api.delete(`/students/${id}`, { params: { hard_delete: hardDelete } });

// POST /api/v1/students/:id/transfer
export const transferStudent = (id, newClassId) =>
  api.post(`/students/${id}/transfer`, { newClassId });

// POST /api/v1/students/:id/deactivate
export const deactivateStudent = (id, reason) =>
  api.post(`/students/${id}/deactivate`, { reason });

// POST /api/v1/students/:id/reactivate
export const reactivateStudent = (id) =>
  api.post(`/students/${id}/reactivate`);

// ── Statistics ────────────────────────────────────────────────

// GET /api/v1/students/statistics
export const getStudentStatistics = () =>
  api.get('/students/statistics');

// GET /api/v1/students/statistics/by-class
export const getCountByClass = () =>
  api.get('/students/statistics/by-class');

// ── Parents / Guardians ───────────────────────────────────────

// GET /api/v1/students/:id/parents
export const getParents = (studentId) =>
  api.get(`/students/${studentId}/parents`);

// POST /api/v1/students/:id/parents
export const addParent = (studentId, data) =>
  api.post(`/students/${studentId}/parents`, data);

// PUT /api/v1/students/:id/parents/:parentId
export const updateParent = (studentId, parentId, data) =>
  api.put(`/students/${studentId}/parents/${parentId}`, data);

// DELETE /api/v1/students/:id/parents/:parentId
export const deleteParent = (studentId, parentId) =>
  api.delete(`/students/${studentId}/parents/${parentId}`);

// ── Bulk Operations ───────────────────────────────────────────

// POST /api/v1/students/bulk-import (JSON body)
export const bulkImportStudents = (students) =>
  api.post('/students/bulk-import', { students });

// POST /api/v1/students/bulk-promote
export const promoteStudents = (studentIds, newClassId) =>
  api.post('/students/bulk-promote', { studentIds, newClassId });