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
    children: [{ title: "Gatepass Approvals", path: "/faculty/gatepass-approvals" }],
  },
  {
    title: "Student Features",
    icon: "faculty",
    children: [
      { title: "Student Dashboard", path: "/faculty/student/dashboard" },
      { title: "Profile", path: "/faculty/student/profile" },
      { title: "Academics", path: "/faculty/student/academics" },
      { title: "Attendance View", path: "/faculty/student/attendance" },
      { title: "Project", path: "/faculty/student/project" },
      { title: "Booking", path: "/faculty/student/booking" },
      { title: "CFAC", path: "/faculty/student/cfac" },
      { title: "COE", path: "/faculty/student/coe" },
      { title: "Common", path: "/faculty/student/common" },
      { title: "IQAC", path: "/faculty/student/iqac" },
      { title: "Main Gate", path: "/faculty/student/main-gate" },
      { title: "NDC", path: "/faculty/student/ndc" },
      { title: "Student Service", path: "/faculty/student/student-service" },
      { title: "Timetable", path: "/faculty/student/timetable" },
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
