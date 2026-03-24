import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

const BASE_URL = '/terms'; // Base URL for academic terms API

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchAllTerms = createAsyncThunk(
  'terms/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      const { data } = await api.get(`${BASE_URL}?${params.toString()}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch terms');
    }
  }
);

export const fetchTermById = createAsyncThunk(
  'terms/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${BASE_URL}/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch term');
    }
  }
);

export const fetchActiveTerm = createAsyncThunk(
  'terms/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${BASE_URL}/active`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'No active term found');
    }
  }
);

export const fetchTermsByYear = createAsyncThunk(
  'terms/fetchByYear',
  async (year, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${BASE_URL}/year/${year}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch terms by year');
    }
  }
);

export const fetchAllYears = createAsyncThunk(
  'terms/fetchAllYears',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${BASE_URL}/years`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch years');
    }
  }
);

export const fetchTermStatistics = createAsyncThunk(
  'terms/fetchStatistics',
  async (termId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${BASE_URL}/${termId}/statistics`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const createTerm = createAsyncThunk(
  'terms/create',
  async (termData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(BASE_URL, termData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create term');
    }
  }
);

export const updateTerm = createAsyncThunk(
  'terms/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`${BASE_URL}/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update term');
    }
  }
);

export const setActiveTerm = createAsyncThunk(
  'terms/setActive',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`${BASE_URL}/${id}/activate`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to set active term');
    }
  }
);

export const deleteTerm = createAsyncThunk(
  'terms/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete term');
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  terms: [],
  activeTerm: null,
  selectedTerm: null,
  termStatistics: null,
  years: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },
  filters: {
    year: null,
    is_active: undefined,
  },
  loading: {
    list: false,
    single: false,
    active: false,
    years: false,
    statistics: false,
    create: false,
    update: false,
    delete: false,
    setActive: false,
  },
  error: null,
  successMessage: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const termsSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSelectedTerm(state) {
      state.selectedTerm = null;
    },
    clearTermStatistics(state) {
      state.termStatistics = null;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = { year: null, is_active: undefined };
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── fetchAllTerms ──
    builder
     .addCase(fetchAllTerms.fulfilled, (state, action) => {
  state.loading.list = false;
  const payload = action.payload;

  // API returns { success: true, data: [...] } or { success: true, data: { terms: [], pagination: {} } }
  if (Array.isArray(payload.data)) {
    // shape: { data: [...] }
    state.terms      = payload.data;
    state.pagination = payload.pagination ?? state.pagination;
  } else {
    // shape: { data: { terms: [...], pagination: {} } }
    state.terms      = payload.data?.terms      ?? [];
    state.pagination = payload.data?.pagination ?? state.pagination;
  }
})
    
      .addCase(fetchAllTerms.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload;
      });

    // ── fetchTermById ──
    builder
      .addCase(fetchTermById.pending, (state) => {
        state.loading.single = true;
        state.error = null;
      })
      .addCase(fetchTermById.fulfilled, (state, action) => {
        state.loading.single = false;
        state.selectedTerm = action.payload;
      })
      .addCase(fetchTermById.rejected, (state, action) => {
        state.loading.single = false;
        state.error = action.payload;
      });

    // ── fetchActiveTerm ──
    builder
      .addCase(fetchActiveTerm.pending, (state) => {
        state.loading.active = true;
        state.error = null;
      })
      .addCase(fetchActiveTerm.fulfilled, (state, action) => {
        state.loading.active = false;
        state.activeTerm = action.payload;
      })
      .addCase(fetchActiveTerm.rejected, (state, action) => {
        state.loading.active = false;
        state.activeTerm = null;
        state.error = action.payload;
      });

    // ── fetchAllYears ──
    builder
      .addCase(fetchAllYears.pending, (state) => {
        state.loading.years = true;
      })
      .addCase(fetchAllYears.fulfilled, (state, action) => {
        state.loading.years = false;
        state.years = action.payload;
      })
      .addCase(fetchAllYears.rejected, (state, action) => {
        state.loading.years = false;
        state.error = action.payload;
      });

    // ── fetchTermStatistics ──
    builder
      .addCase(fetchTermStatistics.pending, (state) => {
        state.loading.statistics = true;
        state.error = null;
      })
      .addCase(fetchTermStatistics.fulfilled, (state, action) => {
        state.loading.statistics = false;
        state.termStatistics = action.payload;
      })
      .addCase(fetchTermStatistics.rejected, (state, action) => {
        state.loading.statistics = false;
        state.error = action.payload;
      });

    // ── createTerm ──
    builder
      .addCase(createTerm.pending, (state) => {
        state.loading.create = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createTerm.fulfilled, (state, action) => {
        state.loading.create = false;
        state.terms.unshift(action.payload);
        state.pagination.total += 1;
        state.successMessage = 'Academic term created successfully';
      })
      .addCase(createTerm.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      });

    // ── updateTerm ──
    builder
      .addCase(updateTerm.pending, (state) => {
        state.loading.update = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateTerm.fulfilled, (state, action) => {
        state.loading.update = false;
        const idx = state.terms.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.terms[idx] = action.payload;
        if (state.selectedTerm?.id === action.payload.id) {
          state.selectedTerm = action.payload;
        }
        state.successMessage = 'Academic term updated successfully';
      })
      .addCase(updateTerm.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      });

    // ── setActiveTerm ──
    builder
      .addCase(setActiveTerm.pending, (state) => {
        state.loading.setActive = true;
        state.error = null;
      })
      .addCase(setActiveTerm.fulfilled, (state, action) => {
        state.loading.setActive = false;
        // Deactivate all, then activate the returned one
        state.terms = state.terms.map((t) => ({ ...t, is_active: false }));
        const idx = state.terms.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.terms[idx] = action.payload;
        state.activeTerm = action.payload;
        state.successMessage = `Term ${action.payload.term} (${action.payload.year}) is now active`;
      })
      .addCase(setActiveTerm.rejected, (state, action) => {
        state.loading.setActive = false;
        state.error = action.payload;
      });

    // ── deleteTerm ──
    builder
      .addCase(deleteTerm.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteTerm.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.terms = state.terms.filter((t) => t.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        if (state.selectedTerm?.id === action.payload) state.selectedTerm = null;
        state.successMessage = 'Academic term deleted successfully';
      })
      .addCase(deleteTerm.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export const {
  clearError,
  clearSuccessMessage,
  clearSelectedTerm,
  clearTermStatistics,
  setFilters,
  resetFilters,
  setPage,
} = termsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

// Change all selectors from state.terms.* to state.academicTerms.*

export const selectAllTerms      = (state) => state.academicTerms.terms ;
export const selectActiveTerm    = (state) => state.academicTerms.activeTerm;
export const selectSelectedTerm  = (state) => state.academicTerms.selectedTerm ;
export const selectTermStatistics= (state) => state.academicTerms.termStatistics ;
export const selectYears         = (state) => state.academicTerms.years;
export const selectPagination    = (state) => state.academicTerms.pagination;
export const selectFilters       = (state) => state.academicTerms.filters;
export const selectTermsLoading  = (state) => state.academicTerms.loading;
export const selectTermsError    = (state) => state.academicTerms.error;
export const selectTermsSuccess  = (state) => state.academicTerms.successMessage;

export default termsSlice.reducer;
