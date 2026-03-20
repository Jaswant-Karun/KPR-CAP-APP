import { Routes, Route } from "react-router-dom";
import FacultyLayout from "../layouts/FacultyLayout";

import Dashboard from "../pages/faculty/Dashboard";
import AttendanceManage from "../pages/faculty/AttendanceManage";
import PeriodScheduling from "../pages/faculty/PeriodScheduling";
import Reports from "../pages/faculty/Reports";

export default function FacultyRoutes() {
  return (
    <Routes>
      <Route element={<FacultyLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<AttendanceManage />} />
        <Route path="schedule" element={<PeriodScheduling />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
