import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../config/api';
// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchClasses = createAsyncThunk(
  'classes/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/classes${params ? `?${params}` : ''}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch classes');
    }
  }
);

export const fetchClassById = createAsyncThunk(
  'classes/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/classes/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch class');
    }
  }
);

export const createClass = createAsyncThunk(
  'classes/create',
  async (classData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/classes', classData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create class');
    }
  }
);

export const updateClass = createAsyncThunk(
  'classes/update',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/classes/${id}`, updateData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update class');
    }
  }
);

export const deleteClass = createAsyncThunk(
  'classes/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/classes/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete class');
    }
  }
);

export const fetchClassStudents = createAsyncThunk(
  'classes/fetchStudents',
  async (classId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/classes/${classId}/students`);
      return { classId, students: data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch students');
    }
  }
);

export const assignTeacher = createAsyncThunk(
  'classes/assignTeacher',
  async ({ classId, teacherId }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/classes/${classId}/teacher`, { teacher_id: teacherId });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to assign teacher');
    }
  }
);

export const removeTeacher = createAsyncThunk(
  'classes/removeTeacher',
  async (classId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/classes/${classId}/teacher`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove teacher');
    }
  }
);

export const fetchClassesByTeacher = createAsyncThunk(
  'classes/fetchByTeacher',
  async (teacherId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/classes/teacher/${teacherId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch teacher classes');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  list: [],
  selectedClass: null,
  classStudents: {},        // { [classId]: [...students] }
  teacherClasses: [],
  filters: {
    grade_level: '',
    search: '',
  },
  loading: {
    list: false,
    selected: false,
    create: false,
    update: false,
    delete: false,
    students: false,
    teacher: false,
  },
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    clearSelectedClass(state) {
      state.selectedClass = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchClasses ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading.list = false;
        const payload = action.payload;
        state.list = Array.isArray(payload)
          ? payload
          : (payload?.data ?? payload?.classes ?? payload?.results ?? []);
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload;
      });

    // ── fetchClassById ────────────────────────────────────────────────────────
    builder
      .addCase(fetchClassById.pending, (state) => {
        state.loading.selected = true;
        state.error = null;
      })
      .addCase(fetchClassById.fulfilled, (state, action) => {
        state.loading.selected = false;
        state.selectedClass = action.payload;
      })
      .addCase(fetchClassById.rejected, (state, action) => {
        state.loading.selected = false;
        state.error = action.payload;
      });

    // ── createClass ───────────────────────────────────────────────────────────
    builder
      .addCase(createClass.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading.create = false;
        const raw = action.payload;
        const cls = Array.isArray(raw) ? raw[0] : (raw?.data ?? raw?.class ?? raw);
        state.list.unshift(cls);
        state.successMessage = 'Class created successfully';
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      });

    // ── updateClass ───────────────────────────────────────────────────────────
    builder
      .addCase(updateClass.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.loading.update = false;
        const raw = action.payload;
        const cls = Array.isArray(raw) ? raw[0] : (raw?.data ?? raw?.class ?? raw);
        const idx = state.list.findIndex((c) => c.id === cls.id);
        if (idx !== -1) state.list[idx] = cls;
        if (state.selectedClass?.id === cls.id) {
          state.selectedClass = { ...state.selectedClass, ...cls };
        }
        state.successMessage = 'Class updated successfully';
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      });

    // ── deleteClass ───────────────────────────────────────────────────────────
    builder
      .addCase(deleteClass.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.list = state.list.filter((c) => c.id !== action.payload);
        if (state.selectedClass?.id === action.payload) state.selectedClass = null;
        state.successMessage = 'Class deleted successfully';
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      });

    // ── fetchClassStudents ────────────────────────────────────────────────────
    builder
      .addCase(fetchClassStudents.pending, (state) => {
        state.loading.students = true;
        state.error = null;
      })
      .addCase(fetchClassStudents.fulfilled, (state, action) => {
        state.loading.students = false;
        const raw = action.payload.students;
        state.classStudents[action.payload.classId] = Array.isArray(raw)
          ? raw
          : (raw?.data ?? raw?.students ?? raw?.results ?? []);
      })
      .addCase(fetchClassStudents.rejected, (state, action) => {
        state.loading.students = false;
        state.error = action.payload;
      });

    // ── assignTeacher ─────────────────────────────────────────────────────────
    builder
      .addCase(assignTeacher.pending, (state) => {
        state.loading.teacher = true;
        state.error = null;
      })
      .addCase(assignTeacher.fulfilled, (state, action) => {
        state.loading.teacher = false;
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedClass?.id === action.payload.id) {
          state.selectedClass = { ...state.selectedClass, ...action.payload };
        }
        state.successMessage = 'Teacher assigned successfully';
      })
      .addCase(assignTeacher.rejected, (state, action) => {
        state.loading.teacher = false;
        state.error = action.payload;
      });

    // ── removeTeacher ─────────────────────────────────────────────────────────
    builder
      .addCase(removeTeacher.pending, (state) => {
        state.loading.teacher = true;
        state.error = null;
      })
      .addCase(removeTeacher.fulfilled, (state, action) => {
        state.loading.teacher = false;
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedClass?.id === action.payload.id) {
          state.selectedClass = { ...state.selectedClass, ...action.payload };
        }
        state.successMessage = 'Teacher removed successfully';
      })
      .addCase(removeTeacher.rejected, (state, action) => {
        state.loading.teacher = false;
        state.error = action.payload;
      });

    // ── fetchClassesByTeacher ─────────────────────────────────────────────────
    builder
      .addCase(fetchClassesByTeacher.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchClassesByTeacher.fulfilled, (state, action) => {
        state.loading.list = false;
        state.teacherClasses = action.payload;
      })
      .addCase(fetchClassesByTeacher.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload;
      });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────
export const {
  setFilters,
  clearFilters,
  clearSelectedClass,
  clearError,
  clearSuccessMessage,
} = classesSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectAllClasses        = (state) => state.classes.list;
export const selectSelectedClass     = (state) => state.classes.selectedClass;
export const selectTeacherClasses    = (state) => state.classes.teacherClasses;
export const selectClassesFilters    = (state) => state.classes.filters;
export const selectClassesLoading    = (state) => state.classes.loading;
export const selectClassesError      = (state) => state.classes.error;
export const selectClassesSuccess    = (state) => state.classes.successMessage;
export const selectClassStudentsMap  = (state) => state.classes.classStudents;

// Stable per-classId selector factory
export const selectClassStudents = (classId) =>
  createSelector(selectClassStudentsMap, (map) => map[classId] ?? []);

// Memoized filtered list — no new reference unless list or filters change
export const selectFilteredClasses = createSelector(
  selectAllClasses,
  selectClassesFilters,
  (list, filters) => {
    if (!Array.isArray(list)) return [];
    return list.filter((cls) => {
      const matchGrade  = !filters.grade_level || cls.grade_level === Number(filters.grade_level);
      const matchSearch = !filters.search ||
        cls.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchGrade && matchSearch;
    });
  }
);

export default classesSlice.reducer;