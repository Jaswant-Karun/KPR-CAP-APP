import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import NotFound from "../pages/error/NotFound";

import StudentRoutes from "./StudentRoutes";
import FacultyRoutes from "./FacultyRoutes";
import AdminRoutes from "./AdminRoutes";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* ROLE ROUTES */}
        <Route path="/student/*" element={<StudentRoutes />} />
        <Route path="/faculty/*" element={<FacultyRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* ERROR */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
