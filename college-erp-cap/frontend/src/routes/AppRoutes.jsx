import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import NotFound from "../pages/error/NotFound";
import ProtectedRoute from "./ProtectedRoute";

import StudentRoutes from "./StudentRoutes";
import FacultyRoutes from "./FacultyRoutes";
import AdminRoutes from "./AdminRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute role={["student"]}>
            <StudentRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute role={["faculty", "admin"]}>
            <FacultyRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
