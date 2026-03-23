import { Routes, Route } from "react-router-dom";
import FacultyLayout from "../layouts/FacultyLayout";

import Dashboard from "../pages/faculty/Dashboard";
import AttendanceManage from "../pages/faculty/AttendanceManage";
import PeriodScheduling from "../pages/faculty/PeriodScheduling";
import Reports from "../pages/faculty/Reports";
import TimetableScheduler from "../pages/faculty/TimetableScheduler";
import GatepassApprovals from "../pages/faculty/GatepassApprovals";

import StudentDashboard from "../pages/student/Dashboard";
import Profile from "../pages/student/Profile";
import Academics from "../pages/student/Academics";
import Attendance from "../pages/student/Attendance";
import Project from "../pages/student/Project";
import Booking from "../pages/student/Booking";
import CFAC from "../pages/student/CFAC";
import COE from "../pages/student/COE";
import Common from "../pages/student/Common";
import IQAC from "../pages/student/IQAC";
import MainGate from "../pages/student/MainGate";
import NDC from "../pages/student/NDC";
import StudentService from "../pages/student/StudentService";
import TimetableView from "../pages/student/TimetableView";
import NotFound from "../pages/error/NotFound";

export default function FacultyRoutes() {
  return (
    <Routes>
      <Route element={<FacultyLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<AttendanceManage />} />
        <Route path="schedule" element={<PeriodScheduling />} />
        <Route path="timetable-scheduler" element={<TimetableScheduler />} />
        <Route path="reports" element={<Reports />} />
        <Route path="gatepass-approvals" element={<GatepassApprovals />} />

        <Route path="student/dashboard" element={<StudentDashboard />} />
        <Route path="student/profile" element={<Profile />} />
        <Route path="student/academics" element={<Academics />} />
        <Route path="student/attendance" element={<Attendance />} />
        <Route path="student/project" element={<Project />} />
        <Route path="student/booking" element={<Booking />} />
        <Route path="student/cfac" element={<CFAC />} />
        <Route path="student/coe" element={<COE />} />
        <Route path="student/common" element={<Common />} />
        <Route path="student/iqac" element={<IQAC />} />
        <Route path="student/main-gate" element={<MainGate />} />
        <Route path="student/ndc" element={<NDC />} />
        <Route path="student/student-service" element={<StudentService />} />
        <Route path="student/timetable" element={<TimetableView />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
