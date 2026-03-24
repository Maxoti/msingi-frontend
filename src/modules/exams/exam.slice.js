/**
 * exam.slice.js
 * Redux Toolkit state management for exams
 */

import { createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit';
import api from '../../config/api';

const BASE = '/exams';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchAllExams = createAsyncThunk(
  'exams/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`${BASE}${params ? `?${params}` : ''}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchExamById = createAsyncThunk(
  'exams/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/${id}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUpcomingExams = createAsyncThunk(
  'exams/fetchUpcoming',
  async (days = 30, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/upcoming?days=${days}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createExam = createAsyncThunk(
  'exams/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(BASE, data);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateExam = createAsyncThunk(
  'exams/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`${BASE}/${id}`, data);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const publishExam = createAsyncThunk(
  'exams/publish',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`${BASE}/${id}/publish`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const archiveExam = createAsyncThunk(
  'exams/archive',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${BASE}/${id}/archive`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteExam = createAsyncThunk(
  'exams/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${BASE}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Subjects ──────────────────────────────────────────────────────────────────

export const fetchExamSubjects = createAsyncThunk(
  'exams/fetchSubjects',
  async (examId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/${examId}/subjects`);
      return { examId, subjects: res.data.data ?? res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addExamSubject = createAsyncThunk(
  'exams/addSubject',
  async ({ examId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${BASE}/${examId}/subjects`, data);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteExamSubject = createAsyncThunk(
  'exams/deleteSubject',
  async ({ examId, subjectId }, { rejectWithValue }) => {
    try {
      await api.delete(`${BASE}/${examId}/subjects/${subjectId}`);
      return subjectId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Results ───────────────────────────────────────────────────────────────────

export const fetchExamResults = createAsyncThunk(
  'exams/fetchResults',
  async ({ examId, filters = {} }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`${BASE}/${examId}/results${params ? `?${params}` : ''}`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const upsertResult = createAsyncThunk(
  'exams/upsertResult',
  async ({ examId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${BASE}/${examId}/results`, data);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchExamStatistics = createAsyncThunk(
  'exams/fetchStatistics',
  async (examId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/${examId}/statistics`);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const examSlice = createSlice({
  name: 'exams',
  initialState: {
    list:           [],
    selectedExam:   null,
    subjects:       [],   // subjects for selected exam
    results:        [],   // results for selected exam
    statistics:     null,

    loading: {
      fetch:       false,
      create:      false,
      update:      false,
      delete:      false,
      publish:     false,
      subjects:    false,
      results:     false,
      statistics:  false,
    },

    errors: {
      fetch:       null,
      create:      null,
      update:      null,
      delete:      null,
      publish:     null,
      subjects:    null,
      results:     null,
      statistics:  null,
    },

    ui: {
      showForm:          false,
      showDeleteConfirm: false,
      showSubjectForm:   false,
      showResultsModal:  false,
      editingId:         null,
    },

    filters: {
      status:    '',
      exam_type: '',
      search:    '',
    },
  },

  reducers: {
    openCreateForm(state) {
      state.ui.showForm   = true;
      state.ui.editingId  = null;
      state.selectedExam  = null;
      state.errors.create = null;
    },
    openEditForm(state, { payload }) {
      state.ui.showForm   = true;
      state.ui.editingId  = payload.id;
      state.selectedExam  = payload;
      state.errors.update = null;
    },
    closeForm(state) {
      state.ui.showForm  = false;
      state.ui.editingId = null;
    },
    openDeleteConfirm(state, { payload }) {
      state.ui.showDeleteConfirm = true;
      state.selectedExam         = payload;
    },
    closeDeleteConfirm(state) {
      state.ui.showDeleteConfirm = false;
    },
    openSubjectForm(state, { payload }) {
      state.ui.showSubjectForm = true;
      state.selectedExam       = payload;
      state.errors.subjects    = null;
    },
    closeSubjectForm(state) {
      state.ui.showSubjectForm = false;
    },
    openResultsModal(state, { payload }) {
      state.ui.showResultsModal = true;
      state.selectedExam        = payload;
    },
    closeResultsModal(state) {
      state.ui.showResultsModal = false;
    },
    setFilter(state, { payload: { key, value } }) {
      state.filters[key] = value;
    },
    resetFilters(state) {
      state.filters = { status: '', exam_type: '', search: '' };
    },
    clearError(state, { payload: key }) {
      if (state.errors[key] !== undefined) state.errors[key] = null;
    },
  },

  extraReducers: (builder) => {

    // fetchAllExams
    builder
      .addCase(fetchAllExams.pending,   (state)           => { state.loading.fetch = true;  state.errors.fetch = null; })
      .addCase(fetchAllExams.fulfilled, (state, { payload }) => {
        state.loading.fetch = false;
        state.list = Array.isArray(payload) ? payload : payload.exams ?? [];
      })
      .addCase(fetchAllExams.rejected,  (state, { payload }) => { state.loading.fetch = false; state.errors.fetch = payload; });

    // fetchExamById
    builder
      .addCase(fetchExamById.fulfilled, (state, { payload }) => { state.selectedExam = payload; });

    // fetchUpcomingExams
    builder
      .addCase(fetchUpcomingExams.pending,   (state)           => { state.loading.fetch = true; })
      .addCase(fetchUpcomingExams.fulfilled, (state, { payload }) => { state.loading.fetch = false; state.list = Array.isArray(payload) ? payload : []; })
      .addCase(fetchUpcomingExams.rejected,  (state, { payload }) => { state.loading.fetch = false; state.errors.fetch = payload; });

    // createExam
    builder
      .addCase(createExam.pending,   (state)           => { state.loading.create = true;  state.errors.create = null; })
      .addCase(createExam.fulfilled, (state, { payload }) => {
        state.loading.create = false;
        state.list.unshift(payload);
        state.ui.showForm = false;
      })
      .addCase(createExam.rejected,  (state, { payload }) => { state.loading.create = false; state.errors.create = payload; });

    // updateExam
    builder
      .addCase(updateExam.pending,   (state)           => { state.loading.update = true;  state.errors.update = null; })
      .addCase(updateExam.fulfilled, (state, { payload }) => {
        state.loading.update = false;
        const idx = state.list.findIndex(e => e.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
         if (state.selectedExam?.id === payload.id) state.selectedExam = payload;
        state.ui.showForm = false;
      })
      .addCase(updateExam.rejected,  (state, { payload }) => { state.loading.update = false; state.errors.update = payload; });

    // publishExam
    builder
      .addCase(publishExam.pending,   (state)           => { state.loading.publish = true;  state.errors.publish = null; })
      .addCase(publishExam.fulfilled, (state, { payload }) => {
        state.loading.publish = false;
        const idx = state.list.findIndex(e => e.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(publishExam.rejected,  (state, { payload }) => { state.loading.publish = false; state.errors.publish = payload; });

    // archiveExam
    builder
      .addCase(archiveExam.pending,   (state)           => { state.loading.update = true; })
      .addCase(archiveExam.fulfilled, (state, { payload }) => {
        state.loading.update = false;
        const idx = state.list.findIndex(e => e.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(archiveExam.rejected,  (state, { payload }) => { state.loading.update = false; state.errors.update = payload; });

    // deleteExam
    builder
      .addCase(deleteExam.pending,   (state)              => { state.loading.delete = true;  state.errors.delete = null; })
      .addCase(deleteExam.fulfilled, (state, { payload: id }) => {
        state.loading.delete       = false;
        state.list                 = state.list.filter(e => e.id !== id);
        state.ui.showDeleteConfirm = false;
        state.selectedExam         = null;
      })
      .addCase(deleteExam.rejected,  (state, { payload }) => { state.loading.delete = false; state.errors.delete = payload; });

    // fetchExamSubjects
    builder
      .addCase(fetchExamSubjects.pending,   (state)           => { state.loading.subjects = true;  state.errors.subjects = null; })
      .addCase(fetchExamSubjects.fulfilled, (state, { payload }) => { state.loading.subjects = false; state.subjects = payload.subjects; })
      .addCase(fetchExamSubjects.rejected,  (state, { payload }) => { state.loading.subjects = false; state.errors.subjects = payload; });

    // addExamSubject
    builder
      .addCase(addExamSubject.pending,   (state)           => { state.loading.subjects = true;  state.errors.subjects = null; })
      .addCase(addExamSubject.fulfilled, (state, { payload }) => {
        state.loading.subjects = false;
        state.subjects.push(payload);
        state.ui.showSubjectForm = false;
      })
      .addCase(addExamSubject.rejected,  (state, { payload }) => { state.loading.subjects = false; state.errors.subjects = payload; });

    // deleteExamSubject
    builder
      .addCase(deleteExamSubject.fulfilled, (state, { payload: subjectId }) => {
        state.subjects = state.subjects.filter(s => s.id !== subjectId);
      });

    // fetchExamResults
    builder
      .addCase(fetchExamResults.pending,   (state)           => { state.loading.results = true;  state.errors.results = null; })
      .addCase(fetchExamResults.fulfilled, (state, { payload }) => { state.loading.results = false; state.results = Array.isArray(payload) ? payload : payload.results ?? []; })
      .addCase(fetchExamResults.rejected,  (state, { payload }) => { state.loading.results = false; state.errors.results = payload; });

    // upsertResult
    builder
      .addCase(upsertResult.pending,   (state)           => { state.loading.results = true;  state.errors.results = null; })
      .addCase(upsertResult.fulfilled, (state, { payload }) => { state.loading.results = false; })
      .addCase(upsertResult.rejected,  (state, { payload }) => { state.loading.results = false; state.errors.results = payload; });

    // fetchExamStatistics
    builder
      .addCase(fetchExamStatistics.pending,   (state)           => { state.loading.statistics = true;  state.errors.statistics = null; })
      .addCase(fetchExamStatistics.fulfilled, (state, { payload }) => { state.loading.statistics = false; state.statistics = payload; })
      .addCase(fetchExamStatistics.rejected,  (state, { payload }) => { state.loading.statistics = false; state.errors.statistics = payload; });
  },
});

export const {
  openCreateForm, openEditForm, closeForm,
  openDeleteConfirm, closeDeleteConfirm,
  openSubjectForm, closeSubjectForm,
  openResultsModal, closeResultsModal,
  setFilter, resetFilters, clearError,
} = examSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectExamList       = (state) => state.exams.list;
export const selectSelectedExam   = (state) => state.exams.selectedExam;
export const selectExamSubjects   = (state) => state.exams.subjects;
export const selectExamResults    = (state) => state.exams.results;
export const selectExamStatistics = (state) => state.exams.statistics;
export const selectExamLoading    = (state) => state.exams.loading;
export const selectExamErrors     = (state) => state.exams.errors;
export const selectExamUI         = (state) => state.exams.ui;
export const selectExamFilters    = (state) => state.exams.filters;

export const selectFilteredExams = createSelector(
  [(state) => state.exams.list, (state) => state.exams.filters],
  (list, filters) => {
    const q = filters.search.toLowerCase();
    return list.filter(e => {
      if (filters.status    && e.status    !== filters.status)    return false;
      if (filters.exam_type && e.exam_type !== filters.exam_type) return false;
      if (q && !e.name.toLowerCase().includes(q))                 return false;
      return true;
    });
  }
);
export default examSlice.reducer;