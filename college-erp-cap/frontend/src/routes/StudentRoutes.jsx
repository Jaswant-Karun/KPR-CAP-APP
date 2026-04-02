import { Routes, Route } from 'react-router-dom';
import StudentLayout from '../layouts/StudentLayout';
import Dashboard from '../pages/student/Dashboard';
import Profile from '../pages/student/Profile';
import Academics from '../pages/student/Academics';
import Attendance from '../pages/student/Attendance';
import Project from '../pages/student/Project';
import Booking from '../pages/student/Booking';
import Events from '../pages/student/Events';
import GymSubscription from '../pages/student/GymSubscription';
import IBoxComplaints from '../pages/student/IBoxComplaints';
import IdCardReissueRequests from '../pages/student/IdCardReissueRequests';
import WiFiRequests from '../pages/student/WiFiRequests';
import AOServiceSupport from '../pages/student/AOServiceSupport';
import FusionSpace from '../pages/student/FusionSpace';
import CFAC from '../pages/student/CFAC';
import COE from '../pages/student/COE';
import Common from '../pages/student/Common';
import IQAC from '../pages/student/IQAC';
import MainGate from '../pages/student/MainGate';
import FreeOuting from '../pages/student/FreeOuting';
import Latecomers from '../pages/student/Latecomers';
import LateralGatepass from '../pages/student/LateralGatepass';
import NDC from '../pages/student/NDC';
import StudentService from '../pages/student/StudentService';
import TimetableView from '../pages/student/TimetableView';
import CourseRegistration from '../pages/CourseRegistration';
import NominalRoll from '../pages/NominalRoll';
import NominalRollCourses from '../pages/NominalRollCourses';
import Waiver from '../pages/Waiver';
import HallTicket from '../pages/HallTicket';
import DigitalAssets from '../pages/DigitalAssets';
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
        <Route path="final-year-project" element={<Project />} />
        <Route path="booking" element={<Booking />} />
        <Route path="events" element={<Events />} />
        <Route path="gym" element={<GymSubscription />} />
        <Route path="complaints" element={<IBoxComplaints />} />
        <Route path="id-card" element={<IdCardReissueRequests />} />
        <Route path="wifi-request" element={<WiFiRequests />} />
        <Route path="ao-service" element={<AOServiceSupport />} />
        <Route path="fusion-space" element={<FusionSpace />} />
        <Route path="cfac" element={<CFAC />} />
        <Route path="coe" element={<COE />} />
        <Route path="common" element={<Common />} />
        <Route path="iqac" element={<IQAC />} />
        <Route path="gatepass" element={<MainGate />} />
        <Route path="main-gate" element={<MainGate />} />
        <Route path="lateral-gatepass" element={<LateralGatepass />} />
        <Route path="free-outing" element={<FreeOuting />} />
        <Route path="latecomers" element={<Latecomers />} />
        <Route path="ndc" element={<NDC />} />
        <Route path="student-service" element={<StudentService />} />
        <Route path="user-service" element={<Profile />} />
        <Route path="timetable" element={<TimetableView />} />
        <Route path="course-registration" element={<CourseRegistration />} />
        <Route path="nominal-roll" element={<NominalRoll />} />
        <Route path="nominal-roll-courses" element={<NominalRollCourses />} />
        <Route path="waiver" element={<Waiver />} />
        <Route path="hall-ticket" element={<HallTicket mode="student" />} />
        <Route path="digital-assets" element={<DigitalAssets />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
