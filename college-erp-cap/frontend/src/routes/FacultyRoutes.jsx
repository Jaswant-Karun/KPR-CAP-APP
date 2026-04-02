import { Routes, Route } from "react-router-dom";
import FacultyLayout from "../layouts/FacultyLayout";

import Dashboard from "../pages/faculty/Dashboard";
import AttendanceManage from "../pages/faculty/AttendanceManage";
import PeriodScheduling from "../pages/faculty/PeriodScheduling";
import Reports from "../pages/faculty/Reports";
import TimetableScheduler from "../pages/faculty/TimetableScheduler";
import GatepassApprovals from "../pages/faculty/GatepassApprovals";
import LatecomerApprovals from "../pages/faculty/LatecomerApprovals";
import IdCardUpload from "../pages/faculty/IdCardUpload";
import InternalMarks from "../pages/faculty/InternalMarks";
import ServiceRequestsApproval from "../pages/faculty/ServiceRequestsApproval";
import StudentUploadsApproval from "../pages/faculty/StudentUploadsApproval";
import AoServiceApprovals from "../pages/faculty/AoServiceApprovals";
import FusionSpaceApprovals from "../pages/faculty/FusionSpaceApprovals";
import FacultyCourseMgmt from "../pages/faculty/FacultyCourseMgmt";
import GymSubscription from "../pages/student/GymSubscription";
import IBoxComplaints from "../pages/student/IBoxComplaints";
import IdCardReissueRequests from "../pages/student/IdCardReissueRequests";
import WiFiRequests from "../pages/student/WiFiRequests";

import CourseRegistration from "../pages/CourseRegistration";
import NominalRoll from "../pages/NominalRoll";
import NominalRollCourses from "../pages/NominalRollCourses";
import Waiver from "../pages/Waiver";
import HallTicket from "../pages/HallTicket";
import DigitalAssets from "../pages/DigitalAssets";
import Events from "../pages/student/Events";
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
        <Route path="latecomer-approvals" element={<LatecomerApprovals />} />
        <Route path="id-card-upload" element={<IdCardUpload />} />
        <Route path="internal-marks" element={<InternalMarks />} />
        <Route path="service-requests-approval" element={<ServiceRequestsApproval />} />
        <Route path="student-uploads-approval" element={<StudentUploadsApproval />} />
        <Route path="booking-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="cfac-course-registrations" element={<CourseRegistration />} />
        <Route path="coe-requests" element={<NominalRoll />} />
        <Route path="common-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="iqac-feedback-requests" element={<ServiceRequestsApproval />} />
        <Route path="main-gate-requests" element={<GatepassApprovals />} />
        <Route path="ndc-upload-reviews" element={<StudentUploadsApproval />} />
        <Route path="student-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="user-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="academics-attendance-control" element={<AttendanceManage />} />
        <Route path="final-year-project-control" element={<ServiceRequestsApproval />} />
        <Route path="ao-service-approvals" element={<AoServiceApprovals />} />
        <Route path="fusion-space-approvals" element={<FusionSpaceApprovals />} />
        <Route path="course-management" element={<FacultyCourseMgmt />} />
        <Route path="nominal-roll-approvals" element={<NominalRoll />} />
        <Route path="nominal-roll-course-approvals" element={<NominalRollCourses />} />
        <Route path="waiver-approvals" element={<Waiver />} />
        <Route path="common-service-approvals" element={<ServiceRequestsApproval />} />
        <Route path="feedback-approvals" element={<ServiceRequestsApproval />} />
        <Route path="ndc-achievement-approvals" element={<StudentUploadsApproval />} />
        <Route path="bonafide-approvals" element={<ServiceRequestsApproval />} />
        <Route path="hostel-app-approvals" element={<ServiceRequestsApproval />} />
        <Route path="hostel-permission-approvals" element={<ServiceRequestsApproval />} />
        <Route path="digital-assets" element={<DigitalAssets />} />
        <Route path="events" element={<Events />} />
        <Route path="gym" element={<GymSubscription />} />
        <Route path="complaints" element={<IBoxComplaints />} />
        <Route path="id-card" element={<IdCardReissueRequests />} />
        <Route path="wifi-request" element={<WiFiRequests />} />
        <Route path="course-registration" element={<CourseRegistration />} />
        <Route path="nominal-roll" element={<NominalRoll />} />
        <Route path="nominal-roll-courses" element={<NominalRollCourses />} />
        <Route path="waiver" element={<Waiver />} />
        <Route path="hall-ticket-verify" element={<HallTicket mode="faculty" />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
