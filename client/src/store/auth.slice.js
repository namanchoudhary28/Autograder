import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../shared/api/axios";

export const login = createAsyncThunk(
  "auth/login",
  async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data; // { token }
  }
);

// REGISTER
export const register = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }) => {
    const res = await api.post("/auth/register", {
      name,
      email,
      password
    });
    return res.data; // usually success message
  }
);

// FETCH USER INFO
export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async () => {
    const res = await api.get("/auth/user/me");
    return res.data; // user object
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem("token"),
    user: null,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    }
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // FETCH USER
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
