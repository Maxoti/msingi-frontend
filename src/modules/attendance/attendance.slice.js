/**
 * attendance.slice.js
 * Redux Toolkit state management for attendance
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

const BASE = '/attendance';

export const fetchClassAttendanceByDate = createAsyncThunk(
  'attendance/fetchClassByDate',
  async ({ classId, date }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/classes/${classId}/date/${date}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSchoolAttendance = createAsyncThunk(
  'attendance/fetchSchool',
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/school/${date}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchStudentAttendance = createAsyncThunk(
  'attendance/fetchStudent',
  async ({ studentId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate)   params.append('end_date', endDate);
      const res = await api.get(`${BASE}/students/${studentId}/stats?${params}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchClassAttendanceSummary = createAsyncThunk(
  'attendance/fetchClassSummary',
  async ({ classId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate)   params.append('end_date', endDate);
      const res = await api.get(`${BASE}/classes/${classId}/stats?${params}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchLowAttendanceStudents = createAsyncThunk(
  'attendance/fetchLowAttendance',
  async ({ startDate, endDate, threshold = 75 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate, threshold });
      const res = await api.get(`${BASE}/low-attendance?${params}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const bulkMarkAttendance = createAsyncThunk(
  'attendance/bulkMark',
  async ({ records, markedBy }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${BASE}/bulk`, {
        attendance_records: records,
        marked_by: markedBy,
      });
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const markSingleAttendance = createAsyncThunk(
  'attendance/markSingle',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(BASE, data);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAttendance = createAsyncThunk(
  'attendance/update',
  async ({ id, status, remarks }, { rejectWithValue }) => {
    try {
      const res = await api.put(`${BASE}/${id}`, { status, remarks });
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    classAttendance:   null,
    schoolAttendance:  null,
    studentAttendance: null,
    classSummary:      null,
    lowAttendance:     [],
    draft: {},
    loading: {
      classAttendance:   false,
      schoolAttendance:  false,
      studentAttendance: false,
      classSummary:      false,
      lowAttendance:     false,
      saving:            false,
    },
    errors: {
      classAttendance:   null,
      schoolAttendance:  null,
      studentAttendance: null,
      classSummary:      null,
      lowAttendance:     null,
      saving:            null,
    },
    lastSaved: null,
  },

  reducers: {
    setDraftStatus(state, { payload: { studentId, status } }) {
      state.draft[studentId] = status;
    },
    setAllDraftStatus(state, { payload: status }) {
      if (state.classAttendance?.students) {
        state.classAttendance.students.forEach(s => {
          state.draft[s.student_id] = status;
        });
      }
    },
    clearDraft(state) {
      state.draft = {};
    },
    clearError(state, { payload: key }) {
      if (state.errors[key] !== undefined) state.errors[key] = null;
    },
    clearAllErrors(state) {
      Object.keys(state.errors).forEach(k => { state.errors[k] = null; });
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchClassAttendanceByDate.pending, (state) => {
        state.loading.classAttendance = true;
        state.errors.classAttendance  = null;
        state.draft = {};
      })
      .addCase(fetchClassAttendanceByDate.fulfilled, (state, { payload }) => {
        state.loading.classAttendance = false;
        state.classAttendance = payload;
        state.draft = {};
        payload.students?.forEach(s => {
          if (s.status) state.draft[s.student_id] = s.status;
        });
      })
      .addCase(fetchClassAttendanceByDate.rejected, (state, { payload }) => {
        state.loading.classAttendance = false;
        state.errors.classAttendance  = payload;
      });

    builder
      .addCase(fetchSchoolAttendance.pending,   (state)           => { state.loading.schoolAttendance = true;  state.errors.schoolAttendance = null; })
      .addCase(fetchSchoolAttendance.fulfilled, (state, { payload }) => { state.loading.schoolAttendance = false; state.schoolAttendance = payload; })
      .addCase(fetchSchoolAttendance.rejected,  (state, { payload }) => { state.loading.schoolAttendance = false; state.errors.schoolAttendance = payload; });

    builder
      .addCase(fetchStudentAttendance.pending,   (state)           => { state.loading.studentAttendance = true;  state.errors.studentAttendance = null; })
      .addCase(fetchStudentAttendance.fulfilled, (state, { payload }) => { state.loading.studentAttendance = false; state.studentAttendance = payload; })
      .addCase(fetchStudentAttendance.rejected,  (state, { payload }) => { state.loading.studentAttendance = false; state.errors.studentAttendance = payload; });

    builder
      .addCase(fetchClassAttendanceSummary.pending,   (state)           => { state.loading.classSummary = true;  state.errors.classSummary = null; })
      .addCase(fetchClassAttendanceSummary.fulfilled, (state, { payload }) => { state.loading.classSummary = false; state.classSummary = payload; })
      .addCase(fetchClassAttendanceSummary.rejected,  (state, { payload }) => { state.loading.classSummary = false; state.errors.classSummary = payload; });

    builder
      .addCase(fetchLowAttendanceStudents.pending,   (state)           => { state.loading.lowAttendance = true;  state.errors.lowAttendance = null; })
      .addCase(fetchLowAttendanceStudents.fulfilled, (state, { payload }) => { state.loading.lowAttendance = false; state.lowAttendance = payload; })
      .addCase(fetchLowAttendanceStudents.rejected,  (state, { payload }) => { state.loading.lowAttendance = false; state.errors.lowAttendance = payload; });

    [bulkMarkAttendance, markSingleAttendance, updateAttendance].forEach(thunk => {
      builder
        .addCase(thunk.pending,   (state)           => { state.loading.saving = true;  state.errors.saving = null; })
        .addCase(thunk.fulfilled, (state) => {
          state.loading.saving = false;
          state.lastSaved      = new Date().toISOString();
          state.draft          = {};
        })
        .addCase(thunk.rejected,  (state, { payload }) => { state.loading.saving = false; state.errors.saving = payload; });
    });
  },
});

export const {
  setDraftStatus,
  setAllDraftStatus,
  clearDraft,
  clearError,
  clearAllErrors,
} = attendanceSlice.actions;

export const selectClassAttendance   = (state) => state.attendance.classAttendance;
export const selectSchoolAttendance  = (state) => state.attendance.schoolAttendance;
export const selectStudentAttendance = (state) => state.attendance.studentAttendance;
export const selectClassSummary      = (state) => state.attendance.classSummary;
export const selectLowAttendance     = (state) => state.attendance.lowAttendance;
export const selectAttendanceDraft   = (state) => state.attendance.draft;
export const selectAttendanceLoading = (state) => state.attendance.loading;
export const selectAttendanceErrors  = (state) => state.attendance.errors;
export const selectLastSaved         = (state) => state.attendance.lastSaved;

export default attendanceSlice.reducer;