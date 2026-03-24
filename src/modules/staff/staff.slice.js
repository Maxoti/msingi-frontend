/**
 * src/modules/staff/staff.slice.js
 * Redux slice for staff management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as staffApi from './api';

/* ── Thunks ─────────────────────────────────────────────────── */

export const fetchAllStaffThunk = createAsyncThunk(
  'staff/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await staffApi.getAllStaff(params);
      return res.data?.data || res.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createStaffThunk = createAsyncThunk(
  'staff/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await staffApi.createStaff(data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateStaffThunk = createAsyncThunk(
  'staff/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await staffApi.updateStaff(id, data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deactivateStaffThunk = createAsyncThunk(
  'staff/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      await staffApi.deactivateStaff(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ── Slice ──────────────────────────────────────────────────── */

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    list:       [],
    loading:    false,
    saving:     false,
    error:      null,
    saveError:  null,
    pagination: { total: 0, page: 1, limit: 50, pages: 1 },
  },
  reducers: {
    clearSaveError: (state) => { state.saveError = null; },
    clearError:     (state) => { state.error     = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllStaffThunk.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllStaffThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (Array.isArray(payload)) {
          state.list = payload;
        } else {
          state.list       = payload.staff || payload.data || [];
          state.pagination = payload.pagination || state.pagination;
        }
      })
      .addCase(fetchAllStaffThunk.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })

      // create
      .addCase(createStaffThunk.pending,   (state) => { state.saving = true; state.saveError = null; })
      .addCase(createStaffThunk.fulfilled, (state, { payload }) => {
        state.saving = false;
        const member = payload?.staff || payload;
        if (member?.id) state.list.unshift(member);
      })
      .addCase(createStaffThunk.rejected,  (state, { payload }) => { state.saving = false; state.saveError = payload; })

      // update
      .addCase(updateStaffThunk.pending,   (state) => { state.saving = true; state.saveError = null; })
      .addCase(updateStaffThunk.fulfilled, (state, { payload }) => {
        state.saving = false;
        const updated = payload?.staff || payload;
        if (updated?.id) {
          const idx = state.list.findIndex(s => s.id === updated.id);
          if (idx !== -1) state.list[idx] = updated;
        }
      })
      .addCase(updateStaffThunk.rejected,  (state, { payload }) => { state.saving = false; state.saveError = payload; })

      // deactivate — mark as inactive in list instead of removing
      .addCase(deactivateStaffThunk.fulfilled, (state, { payload: id }) => {
        const idx = state.list.findIndex(s => s.id === id);
        if (idx !== -1) state.list[idx].isActive = false;
      });
  },
});

export const { clearSaveError, clearError } = staffSlice.actions;

/* ── Selectors ──────────────────────────────────────────────── */
export const selectStaffList    = (state) => state.staff.list;
export const selectStaffLoading = (state) => state.staff.loading;
export const selectStaffSaving  = (state) => state.staff.saving;
export const selectSaveError    = (state) => state.staff.saveError;
export const selectStaffError   = (state) => state.staff.error;
export const selectPagination   = (state) => state.staff.pagination;

export default staffSlice.reducer;