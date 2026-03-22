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
