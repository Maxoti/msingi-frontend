import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as timetableApi from './api';

export const fetchSlotsThunk = createAsyncThunk(
  'timetable/fetchSlots',
  async (_, { rejectWithValue }) => {
    try {
      const res = await timetableApi.getSlots();
      return res.data?.data || res.data || [];
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

export const createSlotThunk = createAsyncThunk(
  'timetable/createSlot',
  async (data, { rejectWithValue }) => {
    try {
      const res = await timetableApi.createSlot(data);
      return res.data?.data || res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

export const deleteSlotThunk = createAsyncThunk(
  'timetable/deleteSlot',
  async (id, { rejectWithValue }) => {
    try { await timetableApi.deleteSlot(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

export const fetchClassTimetableThunk = createAsyncThunk(
  'timetable/fetchClass',
  async ({ classId, termId }, { rejectWithValue, getState }) => {
    try {
      const res = await timetableApi.getClassTimetable(classId, termId);
      const payload = res.data?.data || res.data;
      // Merge full slots list (which includes breaks) from state
      const allSlots = getState().timetable.slots;
      return { ...payload, allSlots };
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

export const fetchTeacherTimetableThunk = createAsyncThunk(
  'timetable/fetchTeacher',
  async ({ staffId, termId }, { rejectWithValue, getState }) => {
    try {
      const res = await timetableApi.getTeacherTimetable(staffId, termId);
      const payload = res.data?.data || res.data;
      const allSlots = getState().timetable.slots;
      return { ...payload, allSlots };
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

export const createEntryThunk = createAsyncThunk(
  'timetable/createEntry',
  async (data, { rejectWithValue }) => {
    try {
      const res = await timetableApi.createEntry(data);
      return res.data?.data || res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

export const deleteEntryThunk = createAsyncThunk(
  'timetable/deleteEntry',
  async (id, { rejectWithValue }) => {
    try { await timetableApi.deleteEntry(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
  }
);

// ── Merges the API's slots with the full slots list so breaks are never missing.
// Sorted by sort_order so columns appear in the right sequence.
const mergeSlotDefs = (apiSlots = [], allSlots = []) => {
  if (!allSlots.length) return apiSlots;
  const apiIds = new Set(apiSlots.map(s => s.id));
  const missing = allSlots.filter(s => !apiIds.has(s.id));
  return [...apiSlots, ...missing].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
};

const timetableSlice = createSlice({
  name: 'timetable',
  initialState: {
    slots:     [],
    grid:      {},
    slotDefs:  [],
    loading:   false,
    saving:    false,
    error:     null,
    saveError: null,
  },
  reducers: {
    clearSaveError: (state) => { state.saveError = null; },
    clearError:     (state) => { state.error     = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSlotsThunk.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSlotsThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.slots   = payload;
        // If slotDefs is already populated, re-merge so breaks appear immediately
        if (state.slotDefs.length) {
          state.slotDefs = mergeSlotDefs(state.slotDefs, payload);
        }
      })
      .addCase(fetchSlotsThunk.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })

      .addCase(createSlotThunk.pending,   (state) => { state.saving = true; state.saveError = null; })
      .addCase(createSlotThunk.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (payload?.id) {
          state.slots.push(payload);
          // Also add to slotDefs if not already there
          if (!state.slotDefs.find(s => s.id === payload.id)) {
            state.slotDefs = [...state.slotDefs, payload]
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          }
        }
      })
      .addCase(createSlotThunk.rejected,  (state, { payload }) => { state.saving = false; state.saveError = payload; })

      .addCase(deleteSlotThunk.fulfilled, (state, { payload: id }) => {
        state.slots    = state.slots.filter(s => s.id !== id);
        state.slotDefs = state.slotDefs.filter(s => s.id !== id);
      })

      .addCase(fetchClassTimetableThunk.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClassTimetableThunk.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.grid     = payload?.grid  || {};
        // Merge API slots with full slots list so breaks are always included
        state.slotDefs = mergeSlotDefs(payload?.slots || [], payload?.allSlots || state.slots);
      })
      .addCase(fetchClassTimetableThunk.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })

      .addCase(fetchTeacherTimetableThunk.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTeacherTimetableThunk.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.grid     = payload?.grid  || {};
        state.slotDefs = mergeSlotDefs(payload?.slots || [], payload?.allSlots || state.slots);
      })
      .addCase(fetchTeacherTimetableThunk.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })

      .addCase(createEntryThunk.pending,   (state) => { state.saving = true; state.saveError = null; })
      .addCase(createEntryThunk.fulfilled, (state) => { state.saving = false; })
      .addCase(createEntryThunk.rejected,  (state, { payload }) => { state.saving = false; state.saveError = payload; })

      .addCase(deleteEntryThunk.fulfilled, (state) => { state.saving = false; });
  },
});

export const { clearSaveError, clearError } = timetableSlice.actions;

export const selectSlots     = (state) => state.timetable.slots;
export const selectGrid      = (state) => state.timetable.grid;
export const selectSlotDefs  = (state) => state.timetable.slotDefs;
export const selectLoading   = (state) => state.timetable.loading;
export const selectSaving    = (state) => state.timetable.saving;
export const selectError     = (state) => state.timetable.error;
export const selectSaveError = (state) => state.timetable.saveError;

export default timetableSlice.reducer;