import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import CourseManagement from "../pages/admin/CourseManagement";
import DepartmentManagement from "../pages/admin/DepartmentManagement";
import SystemSettings from "../pages/admin/SystemSettings";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>
    </Routes>
  );
}
