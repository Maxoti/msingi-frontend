import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as aiApi from './api';

export const analyzeResults = createAsyncThunk(
  'ai/analyzeResults',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await aiApi.analyzeExamResults(payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Analysis failed');
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    result:  null,
    metric:  null,
    loading: false,
    error:   null,
  },
  reducers: {
    clearAIResult: (state) => {
      state.result  = null;
      state.error   = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeResults.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(analyzeResults.fulfilled, (state, action) => { state.loading = false; state.result = action.payload; })
      .addCase(analyzeResults.rejected,  (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearAIResult } = aiSlice.actions;
export default aiSlice.reducer;