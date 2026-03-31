import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import NotFound from "../pages/error/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import ButtonSoundInitializer from "../components/common/ButtonSoundInitializer";
import { usePublicSettings } from "../hooks/usePublicSettings";

import StudentRoutes from "./StudentRoutes";
import FacultyRoutes from "./FacultyRoutes";
import AdminRoutes from "./AdminRoutes";

const MaintenanceNotice = ({ message }) => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h2>Maintenance Mode</h2>
    <p>{message}</p>
  </div>
);

export default function AppRoutes() {
  const { settings } = usePublicSettings();
  const maintenanceMode = settings?.maintenanceMode ?? false;

  return (
    <>
      <ButtonSoundInitializer />
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/signup"
        element={
          maintenanceMode ? (
            <MaintenanceNotice message="Signup is temporarily unavailable during maintenance." />
          ) : (
            <Signup />
          )
        }
      />

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
    </>
  );
}
