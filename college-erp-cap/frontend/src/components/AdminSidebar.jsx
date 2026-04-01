import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaUsers,
  FaBook,
  FaBuilding,
  FaSlidersH,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "./AdminSidebar.css";

const adminMenu = [
  {
    title: "Control Center",
    icon: FaChartPie,
    children: [
      { title: "Dashboard", path: "/admin/dashboard" },
      { title: "User Management", path: "/admin/users" },
    ],
  },
  {
    title: "Academic Setup",
    icon: FaBook,
    children: [
      { title: "Course Management", path: "/admin/courses" },
      { title: "Department Management", path: "/admin/departments" },
    ],
  },
  {
    title: "System Governance",
    icon: FaSlidersH,
    children: [{ title: "System Settings", path: "/admin/settings" }],
  },
  {
    title: "Authority",
    icon: FaUsers,
    children: [
      { title: "Admin Full Control", path: "/admin/dashboard" },
      { title: "Open Student Module", path: "/student/dashboard" },
      { title: "Open Faculty Module", path: "/faculty/dashboard" },
      { title: "Institution Units", path: "/admin/departments" },
    ],
  },
  {
    title: "Operations",
    icon: FaBuilding,
    children: [
      { title: "Faculty and Students", path: "/admin/users" },
      { title: "Curriculum and Settings", path: "/admin/courses" },
    ],
  },
  {
    title: "Student Sidebar Controls",
    icon: FaUsers,
    children: [
      { title: "3.2 Student Attendance Control", path: "/admin/academics-attendance-control" },
      { title: "4.0 Final Year Project Control", path: "/admin/final-year-project-control" },
      { title: "AO Service Support Approvals", path: "/admin/ao-service-approvals" },
      { title: "Fusion Space Approvals", path: "/admin/fusion-space-approvals" },
      { title: "CFAC Course Registrations", path: "/admin/cfac-course-registrations" },
      { title: "1.0 Nominal Roll Control", path: "/admin/nominal-roll-approvals" },
      { title: "1.1 Nominal Roll Courses Control", path: "/admin/nominal-roll-course-approvals" },
      { title: "1.2 Waiver Approvals", path: "/admin/waiver-approvals" },
      { title: "2.1 Hall Ticket Control", path: "/admin/hall-ticket-control" },
      { title: "2.2 Digital Assets", path: "/admin/digital-assets" },
      { title: "2.3 Event List & Registrations", path: "/admin/events" },
      { title: "Common Service Requests", path: "/admin/common-service-approvals" },
      { title: "IQAC Feedback Controls", path: "/admin/feedback-approvals" },
      { title: "1. Gatepass Approvals", path: "/admin/main-gate-requests" },
      { title: "1.1 Latecomer Approvals", path: "/admin/latecomer-approvals" },
      { title: "NDC Achievement Upload Reviews", path: "/admin/ndc-achievement-approvals" },
      { title: "Bonafide Approvals", path: "/admin/bonafide-approvals" },
      { title: "Hostel Application Approvals", path: "/admin/hostel-app-approvals" },
      { title: "Hostel Permission Approvals", path: "/admin/hostel-permission-approvals" },
    ],
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav">
        {adminMenu.map((group, idx) => {
          const Icon = group.icon;
          const isOpen = idx === openIndex;

          return (
            <div className="admin-menu-group" key={group.title}>
              <button
                type="button"
                className="admin-menu-parent"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              >
                <span className="admin-menu-icon"><Icon /></span>
                <span className="admin-menu-title">{group.title}</span>
                <span className="admin-menu-toggle">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
              </button>

              {isOpen && (
                <div className="admin-sidebar-children">
                  {group.children.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        className={`admin-child-item ${active ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
