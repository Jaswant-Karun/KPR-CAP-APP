import { Routes, Route } from 'react-router-dom';
import StudentLayout from '../layouts/StudentLayout';
import Dashboard from '../pages/student/Dashboard';
import Profile from '../pages/student/Profile';
import Academics from '../pages/student/Academics';
import Attendance from '../pages/student/Attendance';
import Project from '../pages/student/Project';
import Booking from '../pages/student/Booking';
import CFAC from '../pages/student/CFAC';
import COE from '../pages/student/COE';
import Common from '../pages/student/Common';
import IQAC from '../pages/student/IQAC';
import MainGate from '../pages/student/MainGate';
import NDC from '../pages/student/NDC';
import StudentService from '../pages/student/StudentService';
import TimetableView from '../pages/student/TimetableView';
import NotFound from '../pages/error/NotFound';
import Unauthorized from '../pages/error/Unauthorized';

export default function StudentRoutes() {
  return (
    <Routes>
      <Route element={<StudentLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="academics" element={<Academics />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="project" element={<Project />} />
        <Route path="booking" element={<Booking />} />
        <Route path="cfac" element={<CFAC />} />
        <Route path="coe" element={<COE />} />
        <Route path="common" element={<Common />} />
        <Route path="iqac" element={<IQAC />} />
        <Route path="main-gate" element={<MainGate />} />
        <Route path="ndc" element={<NDC />} />
        <Route path="student-service" element={<StudentService />} />
        <Route path="user-service" element={<Profile />} />
        <Route path="timetable" element={<TimetableView />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
