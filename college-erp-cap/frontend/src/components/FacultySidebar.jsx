import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaCalendarAlt,
  FaTable,
  FaChartBar,
} from "react-icons/fa";
import "./Sidebar.css";

const facultyMenu = [
  {
    title: "Faculty",
    icon: "faculty",
    children: [{ title: "Dashboard", path: "/faculty/dashboard" }],
  },
  {
    title: "Attendance",
    icon: "attendance",
    children: [{ title: "Class Students & Attendance", path: "/faculty/attendance" }],
  },
  {
    title: "Schedule",
    icon: "schedule",
    children: [{ title: "Period Scheduling", path: "/faculty/schedule" }],
  },
  {
    title: "Timetable",
    icon: "timetable",
    children: [{ title: "Editable Timetable", path: "/faculty/timetable-scheduler" }],
  },
  {
    title: "Reports",
    icon: "reports",
    children: [{ title: "Attendance Reports", path: "/faculty/reports" }],
  },
  {
    title: "Gatepass Control",
    icon: "attendance",
    children: [
      { title: "Gatepass Approvals", path: "/faculty/gatepass-approvals" },
      { title: "Latecomer Approvals", path: "/faculty/latecomer-approvals" },
    ],
  },
  {
    title: "ID Card",
    icon: "reports",
    children: [{ title: "ID Card Upload", path: "/faculty/id-card-upload" }],
  },
  {
    title: "Student Management",
    icon: "faculty",
    children: [
      { title: "Internal Marks", path: "/faculty/internal-marks" },
      { title: "Service Requests", path: "/faculty/service-requests-approval" },
      { title: "Upload Approvals", path: "/faculty/student-uploads-approval" },
    ],
  },
  {
    title: "Student Sidebar Controls",
    icon: "attendance",
    children: [
      { title: "3.2 Student Attendance Control", path: "/faculty/academics-attendance-control" },
      { title: "4.0 Final Year Project Control", path: "/faculty/final-year-project-control" },
      { title: "AO Service Support Approvals", path: "/faculty/ao-service-approvals" },
      { title: "Fusion Space Approvals", path: "/faculty/fusion-space-approvals" },
      { title: "CFAC Course Registrations", path: "/faculty/cfac-course-registrations" },
      { title: "1.0 Nominal Roll Control", path: "/faculty/nominal-roll-approvals" },
      { title: "1.1 Nominal Roll Courses Control", path: "/faculty/nominal-roll-course-approvals" },
      { title: "1.2 Waiver Approvals", path: "/faculty/waiver-approvals" },
      { title: "2.1 Hall Ticket Verification", path: "/faculty/hall-ticket-verify" },
      { title: "2.2 Digital Assets", path: "/faculty/digital-assets" },
      { title: "2.3 Event List & Registrations", path: "/faculty/events" },
      { title: "2.4 Gym Subscription", path: "/faculty/gym" },
      { title: "2.5 I-BOX (Internal Complaints)", path: "/faculty/complaints" },
      { title: "2.6 ID Card Reissue Requests", path: "/faculty/id-card" },
      { title: "2.7 WiFi Request", path: "/faculty/wifi-request" },
      { title: "Common Service Requests", path: "/faculty/common-service-approvals" },
      { title: "IQAC Feedback Controls", path: "/faculty/feedback-approvals" },
      { title: "1. Gatepass Approvals", path: "/faculty/gatepass-approvals" },
      { title: "1.1 Latecomer Approvals", path: "/faculty/latecomer-approvals" },
      { title: "NDC Achievement Upload Reviews", path: "/faculty/ndc-achievement-approvals" },
      { title: "Bonafide Approvals", path: "/faculty/bonafide-approvals" },
      { title: "Hostel Application Approvals", path: "/faculty/hostel-app-approvals" },
      { title: "Hostel Permission Approvals", path: "/faculty/hostel-permission-approvals" },
    ],
  },
  {
    title: "Courses",
    icon: "reports",
    children: [
      { title: "Create Courses", path: "/faculty/course-management" },
      { title: "View Student Registrations", path: "/faculty/course-registration" },
      { title: "Nominal Roll", path: "/faculty/nominal-roll" },
      { title: "Nominal Roll Courses", path: "/faculty/nominal-roll-courses" },
      { title: "Waiver", path: "/faculty/waiver" },
    ],
  },
];

const iconMap = {
  faculty: FaChalkboardTeacher,
  attendance: FaClipboardCheck,
  schedule: FaCalendarAlt,
  timetable: FaTable,
  reports: FaChartBar,
};

export default function FacultySidebar() {
  const [openIndex, setOpenIndex] = useState(0);
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {facultyMenu.map((menu, index) => (
          <div key={menu.title} className="sidebar-menu-group">
            <div
              className="sidebar-menu-parent"
              onClick={() => setOpenIndex(index === openIndex ? null : index)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setOpenIndex(index === openIndex ? null : index);
                }
              }}
            >
              <div className="sidebar-menu-icon">{getIcon(menu.icon)}</div>
              <span className="sidebar-menu-title">{menu.title}</span>
              <span className="sidebar-menu-toggle">{openIndex === index ? "▲" : "▼"}</span>
            </div>

            {openIndex === index && (
              <div className="sidebar-children">
                {menu.children.map((child) => (
                  <div
                    key={child.path}
                    className="sidebar-child-item"
                    onClick={() => navigate(child.path)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        navigate(child.path);
                      }
                    }}
                  >
                    <span className="sidebar-child-title">{child.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
