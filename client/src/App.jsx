import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./shared/ProtectedRoute/ProtectedRoute";
import Layout from "./shared/Layout/Layout";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";

import Problems from "./pages/Problems/Problems";
import ProblemDetail from "./pages/ProblemDetail/ProblemDetail";
import Submissions from "./pages/Submissions/Submissions";
import AddProblem from "./pages/AddProblem/AddProblem";
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/addproblem" element={<AddProblem />} />

        {/* Default protected redirect */}
        <Route index element={<Navigate to="/problems" />} />
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
