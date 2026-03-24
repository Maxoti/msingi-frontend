/**
 * src/modules/students/students.slice.js
 * Redux slice — response shapes matched to students.controller.js
 *
 * Controller response shapes:
 *   getAllStudents  → { success, data: [...],        pagination }
 *   searchStudents → { success, data: [...],        pagination }
 *   createStudent  → { success, message, data: student }
 *   updateStudent  → { success, message, data: student }
 *   deleteStudent  → { success, message, data: student }
 *   getStatistics  → { success, data: stats }
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as studentsApi from './api';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Extracts the students array from any controller response shape:
 *   { success, data: [...] }           ← getAllStudents / searchStudents
 *   { success, data: { students: [] }} ← alternate shape
 *   [...]                              ← direct array (fallback)
 */
const extractList = (payload) => {
  if (Array.isArray(payload))              return payload;
  if (Array.isArray(payload?.data))        return payload.data;          // ← your controller
  if (Array.isArray(payload?.data?.students)) return payload.data.students;
  if (Array.isArray(payload?.students))    return payload.students;
  return [];
};

/**
 * Extracts a single student from create/update responses:
 *   { success, message, data: student }
 */
const extractStudent = (payload) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload?.student) return payload.student;
  if (payload?.id)      return payload;   // direct student object
  return null;
};

// ── Async Thunks ─────────────────────────────────────────────

export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const res = await studentsApi.getAllStudents(filters);
      return res.data; // { success, data: [...], pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const searchStudentsThunk = createAsyncThunk(
  'students/search',
  async ({ term, filters = {} }, { rejectWithValue }) => {
    try {
      const res = await studentsApi.searchStudents(term, filters);
      return res.data; // { success, data: [...], pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createStudentThunk = createAsyncThunk(
  'students/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await studentsApi.createStudent(data);
      return res.data; // { success, message, data: student }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateStudentThunk = createAsyncThunk(
  'students/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await studentsApi.updateStudent(id, data);
      return res.data; // { success, message, data: student }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteStudentThunk = createAsyncThunk(
  'students/delete',
  async (id, { rejectWithValue }) => {
    try {
      await studentsApi.deleteStudent(id);
      return id; // just return the deleted ID
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchStudentStats = createAsyncThunk(
  'students/stats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await studentsApi.getStudentStatistics();
      return res.data; // { success, data: stats }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────

const studentsSlice = createSlice({
  name: 'students',
  initialState: {
    list:       [],
    pagination: null,
    stats:      null,
    loading:    false,
    saving:     false,
    deleting:   null,   // ID currently being deleted
    error:      null,
    saveError:  null,
  },
  reducers: {
    clearError:     (state) => { state.error     = null; },
    clearSaveError: (state) => { state.saveError = null; },
  },
  extraReducers: (builder) => {

    // ── Fetch / Search ────────────────────────────────────────
    const listPending = (state) => {
      state.loading = true;
      state.error   = null;
    };
    const listFulfilled = (state, action) => {
      state.loading    = false;
      state.list       = extractList(action.payload);
      state.pagination = action.payload?.pagination || null;
    };
    const listRejected = (state, action) => {
      state.loading = false;
      state.error   = action.payload;
    };

    builder
      .addCase(fetchStudents.pending,         listPending)
      .addCase(fetchStudents.fulfilled,       listFulfilled)
      .addCase(fetchStudents.rejected,        listRejected)
      .addCase(searchStudentsThunk.pending,   listPending)
      .addCase(searchStudentsThunk.fulfilled, listFulfilled)
      .addCase(searchStudentsThunk.rejected,  listRejected)

      // ── Create ───────────────────────────────────────────────
      // Controller: { success: true, message, data: student }
      .addCase(createStudentThunk.pending,   (state) => {
        state.saving    = true;
        state.saveError = null;
      })
      .addCase(createStudentThunk.fulfilled, (state, action) => {
        state.saving = false;
        const student = extractStudent(action.payload);
        if (student) state.list.unshift(student);
      })
      .addCase(createStudentThunk.rejected,  (state, action) => {
        state.saving    = false;
        state.saveError = action.payload;
      })

      // ── Update ───────────────────────────────────────────────
      // Controller: { success: true, message, data: student }
      .addCase(updateStudentThunk.pending,   (state) => {
        state.saving    = true;
        state.saveError = null;
      })
      .addCase(updateStudentThunk.fulfilled, (state, action) => {
        state.saving = false;
        const updated = extractStudent(action.payload);
        if (updated) {
          const idx = state.list.findIndex(s => s.id === updated.id);
          if (idx !== -1) state.list[idx] = updated;
          else state.list.unshift(updated); // add if not found
        }
      })
      .addCase(updateStudentThunk.rejected,  (state, action) => {
        state.saving    = false;
        state.saveError = action.payload;
      })

      // ── Delete ───────────────────────────────────────────────
      // Returns the deleted ID
      .addCase(deleteStudentThunk.pending,   (state, action) => {
        state.deleting = action.meta.arg;
      })
      .addCase(deleteStudentThunk.fulfilled, (state, action) => {
        state.deleting = null;
        state.list     = state.list.filter(s => s.id !== action.payload);
      })
      .addCase(deleteStudentThunk.rejected,  (state, action) => {
        state.deleting = null;
        state.error    = action.payload;
      })

      // ── Stats ────────────────────────────────────────────────
      // Controller: { success, data: stats }
      .addCase(fetchStudentStats.fulfilled, (state, action) => {
        state.stats = action.payload?.data || action.payload;
      });
  },
});

export const { clearError, clearSaveError } = studentsSlice.actions;

// ── Selectors ────────────────────────────────────────────────
export const selectStudents   = (state) => state.students.list;
export const selectPagination = (state) => state.students.pagination;
export const selectLoading    = (state) => state.students.loading;
export const selectSaving     = (state) => state.students.saving;
export const selectDeleting   = (state) => state.students.deleting;
export const selectError      = (state) => state.students.error;
export const selectSaveError  = (state) => state.students.saveError;
export const selectStats      = (state) => state.students.stats;

export default studentsSlice.reducer;