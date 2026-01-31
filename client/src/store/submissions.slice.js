import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../shared/api/axios";

export const fetchMySubmissions = createAsyncThunk(
  "submissions/my",
  async () => {
    const res = await api.get("/submission/getSubmission");
    return res.data;
  }
);

const submissionsSlice = createSlice({
  name: "submissions",
  initialState: {
    list: [],
    loading: false
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMySubmissions.rejected, (state) => {
        state.loading = false;
      });
  }
});

export default submissionsSlice.reducer;
