import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../shared/api/axios";

// Fetch all problems
export const fetchProblems = createAsyncThunk("problems/all", async () => {
  const res = await api.get("/problems/all");
  return res.data;
});
export const fetchProblemById = createAsyncThunk(
  "problems/fetchById",
  async (id) => {
    const res = await api.get(`/problems/${id}`);
    return res.data;
  }
);
const problemsSlice = createSlice({
  name: "problems",
  initialState: {
    list: [],
    loading: false,
    current: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProblemById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProblemById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      });
  },
});

export default problemsSlice.reducer;
