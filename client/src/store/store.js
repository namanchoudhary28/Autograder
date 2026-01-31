import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth.slice";
import problemsReducer from "./problems.slice";
import submissionsReducer from "./submissions.slice"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemsReducer,
        submissions: submissionsReducer // 🔥 THIS WAS MISSING

  },
});
