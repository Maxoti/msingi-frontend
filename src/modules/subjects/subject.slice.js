/**
 * Subject Slice
 * Redux Toolkit state management for subjects (CBC curriculum)
 */

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../config/api';

const API_BASE = '/subjects';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchSubjects = createAsyncThunk(
  'subjects/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`${API_BASE}${params ? `?${params}` : ''}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSubjectById = createAsyncThunk(
  'subjects/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_BASE}/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSubjectsByGradeLevel = createAsyncThunk(
  'subjects/fetchByGradeLevel',
  async (gradeLevel, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_BASE}/grade/${gradeLevel}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSubjectsByCategory = createAsyncThunk(
  'subjects/fetchByCategory',
  async (category, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_BASE}/category/${category}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSubjectsForClass = createAsyncThunk(
  'subjects/fetchForClass',
  async (classId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_BASE}/class/${classId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSubjectsStatistics = createAsyncThunk(
  'subjects/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_BASE}/statistics`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createSubject = createAsyncThunk(
  'subjects/create',
  async (subjectData, { rejectWithValue }) => {
    try {
      const res = await api.post(API_BASE, subjectData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateSubject = createAsyncThunk(
  'subjects/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await api.put(`${API_BASE}/${id}`, updates);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteSubject = createAsyncThunk(
  'subjects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_BASE}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const activateSubject = createAsyncThunk(
  'subjects/activate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${API_BASE}/${id}/activate`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deactivateSubject = createAsyncThunk(
  'subjects/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${API_BASE}/${id}/deactivate`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Constants ───────────────────────────────────────────────────────────────

export const VALID_GRADE_LEVELS = [
  'GRADE_1', 'GRADE_2', 'GRADE_3',
  'GRADE_4', 'GRADE_5', 'GRADE_6',
  'GRADE_7', 'GRADE_8', 'GRADE_9',
];

export const VALID_CATEGORIES = [
  'LANGUAGES',
  'MATHEMATICS',
  'SCIENCES',
  'SOCIAL_STUDIES',
  'RELIGIOUS_EDUCATION',
  'CREATIVE_ARTS',
  'TECHNICAL',
  'AGRICULTURE',
  'ENVIRONMENTAL',
  'PASTORAL',
];

export const GRADE_LEVEL_LABELS = {
  GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3',
  GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6',
  GRADE_7: 'Grade 7', GRADE_8: 'Grade 8', GRADE_9: 'Grade 9',
};

export const CATEGORY_LABELS = {
  LANGUAGES:           'Languages',
  MATHEMATICS:         'Mathematics',
  SCIENCES:            'Sciences',
  SOCIAL_STUDIES:      'Social Studies',
  RELIGIOUS_EDUCATION: 'Religious Education',
  CREATIVE_ARTS:       'Creative Arts',
  TECHNICAL:           'Technical',
  AGRICULTURE:         'Agriculture',
  ENVIRONMENTAL:       'Environmental',
  PASTORAL:            'Pastoral',
};

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  subjects:        [],
  selectedSubject: null,
  statistics:      null,

  filters: {
    gradeLevel: '',
    category:   '',
    is_active:  '',
    search:     '',
  },

  loading: {
    fetch:      false,
    create:     false,
    update:     false,
    delete:     false,
    activate:   false,
    statistics: false,
  },

  errors: {
    fetch:      null,
    create:     null,
    update:     null,
    delete:     null,
    activate:   null,
    statistics: null,
  },

  ui: {
    showForm:          false,
    showDeleteConfirm: false,
    editingId:         null,
  },
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const subjectSlice = createSlice({
  name: 'subjects',
  initialState,

  reducers: {
    setFilter(state, { payload: { key, value } }) {
      state.filters[key] = value;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },

    openCreateForm(state) {
      state.ui.showForm     = true;
      state.ui.editingId    = null;
      state.selectedSubject = null;
      state.errors.create   = null;
    },
    openEditForm(state, { payload: subject }) {
      state.ui.showForm     = true;
      state.ui.editingId    = subject.id;
      state.selectedSubject = subject;
      state.errors.update   = null;
    },
    closeForm(state) {
      state.ui.showForm     = false;
      state.ui.editingId    = null;
      state.selectedSubject = null;
    },
    openDeleteConfirm(state, { payload: subject }) {
      state.ui.showDeleteConfirm = true;
      state.selectedSubject      = subject;
    },
    closeDeleteConfirm(state) {
      state.ui.showDeleteConfirm = false;
      state.selectedSubject      = null;
    },

    clearError(state, { payload: operation }) {
      if (state.errors[operation] !== undefined) state.errors[operation] = null;
    },
    clearAllErrors(state) {
      Object.keys(state.errors).forEach(k => { state.errors[k] = null; });
    },
  },

  extraReducers: (builder) => {

    // fetchSubjects
    builder
      .addCase(fetchSubjects.pending,   (state)           => { state.loading.fetch = true;  state.errors.fetch = null; })
      .addCase(fetchSubjects.fulfilled, (state, { payload }) => { state.loading.fetch = false; state.subjects = payload.data ?? payload; })
      .addCase(fetchSubjects.rejected,  (state, { payload }) => { state.loading.fetch = false; state.errors.fetch = payload; });

    // fetchSubjectById
    builder
      .addCase(fetchSubjectById.fulfilled, (state, { payload }) => { state.selectedSubject = payload.data ?? payload; });

    // fetchByGradeLevel / fetchByCategory / fetchForClass
    [fetchSubjectsByGradeLevel, fetchSubjectsByCategory, fetchSubjectsForClass].forEach(thunk => {
      builder
        .addCase(thunk.pending,   (state)           => { state.loading.fetch = true;  state.errors.fetch = null; })
        .addCase(thunk.fulfilled, (state, { payload }) => { state.loading.fetch = false; state.subjects = payload.data ?? payload; })
        .addCase(thunk.rejected,  (state, { payload }) => { state.loading.fetch = false; state.errors.fetch = payload; });
    });

    // fetchSubjectsStatistics
    builder
      .addCase(fetchSubjectsStatistics.pending,   (state)           => { state.loading.statistics = true;  state.errors.statistics = null; })
      .addCase(fetchSubjectsStatistics.fulfilled, (state, { payload }) => { state.loading.statistics = false; state.statistics = payload.data ?? payload; })
      .addCase(fetchSubjectsStatistics.rejected,  (state, { payload }) => { state.loading.statistics = false; state.errors.statistics = payload; });

    // createSubject
    builder
      .addCase(createSubject.pending,   (state)           => { state.loading.create = true;  state.errors.create = null; })
      .addCase(createSubject.fulfilled, (state, { payload }) => {
        state.loading.create = false;
        state.subjects.unshift(payload.data ?? payload);
        state.ui.showForm    = false;
      })
      .addCase(createSubject.rejected,  (state, { payload }) => { state.loading.create = false; state.errors.create = payload; });

    // updateSubject
    builder
      .addCase(updateSubject.pending,   (state)           => { state.loading.update = true;  state.errors.update = null; })
      .addCase(updateSubject.fulfilled, (state, { payload }) => {
        state.loading.update = false;
        const updated = payload.data ?? payload;
        const idx = state.subjects.findIndex(s => s.id === updated.id);
        if (idx !== -1) state.subjects[idx] = updated;
        state.ui.showForm  = false;
        state.ui.editingId = null;
      })
      .addCase(updateSubject.rejected,  (state, { payload }) => { state.loading.update = false; state.errors.update = payload; });

    // deleteSubject
    builder
      .addCase(deleteSubject.pending,   (state)             => { state.loading.delete = true;  state.errors.delete = null; })
      .addCase(deleteSubject.fulfilled, (state, { payload: id }) => {
        state.loading.delete       = false;
        state.subjects             = state.subjects.filter(s => s.id !== id);
        state.ui.showDeleteConfirm = false;
        state.selectedSubject      = null;
      })
      .addCase(deleteSubject.rejected,  (state, { payload }) => { state.loading.delete = false; state.errors.delete = payload; });

    // activate / deactivate
    [activateSubject, deactivateSubject].forEach(thunk => {
      builder
        .addCase(thunk.pending,   (state)           => { state.loading.activate = true;  state.errors.activate = null; })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.loading.activate = false;
          const updated = payload.data ?? payload;
          const idx = state.subjects.findIndex(s => s.id === updated.id);
          if (idx !== -1) state.subjects[idx] = updated;
        })
        .addCase(thunk.rejected,  (state, { payload }) => { state.loading.activate = false; state.errors.activate = payload; });
    });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export const {
  setFilter, resetFilters,
  openCreateForm, openEditForm, closeForm,
  openDeleteConfirm, closeDeleteConfirm,
  clearError, clearAllErrors,
} = subjectSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAllSubjects       = (state) => state.subjects.subjects;
export const selectSelectedSubject   = (state) => state.subjects.selectedSubject;
export const selectSubjectFilters    = (state) => state.subjects.filters;
export const selectSubjectLoading    = (state) => state.subjects.loading;
export const selectSubjectErrors     = (state) => state.subjects.errors;
export const selectSubjectUI         = (state) => state.subjects.ui;
export const selectSubjectStatistics = (state) => state.subjects.statistics;

export const selectFilteredSubjects = createSelector(
  [(state) => state.subjects.subjects, (state) => state.subjects.filters],
  (subjects, filters) => {
    const q = filters.search.toLowerCase();
    return subjects.filter(s => {
      if (filters.gradeLevel && !s.grade_levels?.includes(filters.gradeLevel)) return false;
      if (filters.category   && s.category !== filters.category)               return false;
      if (filters.is_active !== '' && String(s.is_active) !== filters.is_active) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }
);

export default subjectSlice.reducer;