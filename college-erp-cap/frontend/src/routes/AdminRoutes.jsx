import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import CourseManagement from "../pages/admin/CourseManagement";
import DepartmentManagement from "../pages/admin/DepartmentManagement";
import SystemSettings from "../pages/admin/SystemSettings";
import InternalMarks from "../pages/faculty/InternalMarks";
import ServiceRequestsApproval from "../pages/faculty/ServiceRequestsApproval";
import StudentUploadsApproval from "../pages/faculty/StudentUploadsApproval";
import GatepassApprovals from "../pages/faculty/GatepassApprovals";
import LatecomerApprovals from "../pages/faculty/LatecomerApprovals";
import CourseRegistration from "../pages/CourseRegistration";
import NominalRoll from "../pages/NominalRoll";
import NominalRollCourses from "../pages/NominalRollCourses";
import Waiver from "../pages/Waiver";
import AttendanceManage from "../pages/faculty/AttendanceManage";
import AoServiceApprovals from "../pages/faculty/AoServiceApprovals";
import FusionSpaceApprovals from "../pages/faculty/FusionSpaceApprovals";
import HallTicket from "../pages/HallTicket";
import DigitalAssets from "../pages/DigitalAssets";
import Events from "../pages/student/Events";
import GymSubscription from "../pages/student/GymSubscription";
import IBoxComplaints from "../pages/student/IBoxComplaints";
import IdCardReissueRequests from "../pages/student/IdCardReissueRequests";
import WiFiRequests from "../pages/student/WiFiRequests";
import FeedbackUsers from "../pages/feedback/FeedbackUsers";
import NdcAchievementsPage from "../pages/ndc/NdcAchievementsPage";
import BonafideApplicationsPage from "../pages/bonafide/BonafideApplicationsPage";
import HostelApplicationsPage from "../pages/hostel/HostelApplicationsPage";
import HostelStayPermissionPage from "../pages/hostel/HostelStayPermissionPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="internal-marks" element={<InternalMarks />} />
        <Route path="booking-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="cfac-course-registrations" element={<CourseRegistration />} />
        <Route path="coe-requests" element={<NominalRoll />} />
        <Route path="common-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="iqac-feedback-requests" element={<ServiceRequestsApproval />} />
        <Route path="main-gate-requests" element={<GatepassApprovals />} />
        <Route path="latecomer-approvals" element={<LatecomerApprovals />} />
        <Route path="ndc-upload-reviews" element={<NdcAchievementsPage />} />
        <Route path="student-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="user-service-requests" element={<ServiceRequestsApproval />} />
        <Route path="academics-attendance-control" element={<AttendanceManage />} />
        <Route path="final-year-project-control" element={<ServiceRequestsApproval />} />
        <Route path="ao-service-approvals" element={<AoServiceApprovals />} />
        <Route path="fusion-space-approvals" element={<FusionSpaceApprovals />} />
        <Route path="nominal-roll-approvals" element={<NominalRoll />} />
        <Route path="nominal-roll-course-approvals" element={<NominalRollCourses />} />
        <Route path="waiver-approvals" element={<Waiver />} />
        <Route path="hall-ticket-control" element={<HallTicket mode="admin" />} />
        <Route path="common-service-approvals" element={<ServiceRequestsApproval />} />
        <Route path="feedback-approvals" element={<FeedbackUsers />} />
        <Route path="ndc-achievement-approvals" element={<NdcAchievementsPage />} />
        <Route path="bonafide-approvals" element={<BonafideApplicationsPage />} />
        <Route path="hostel-app-approvals" element={<HostelApplicationsPage />} />
        <Route path="hostel-permission-approvals" element={<HostelStayPermissionPage />} />
        <Route path="digital-assets" element={<DigitalAssets />} />
        <Route path="events" element={<Events />} />
        <Route path="gym" element={<GymSubscription />} />
        <Route path="complaints" element={<IBoxComplaints />} />
        <Route path="id-card" element={<IdCardReissueRequests />} />
        <Route path="wifi-request" element={<WiFiRequests />} />
      </Route>
    </Routes>
  );
}
