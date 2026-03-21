import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaBell,
  FaBookOpen,
  FaCalendarCheck,
  FaChevronDown,
  FaCog,
  FaFileAlt,
  FaHome,
  FaRegLightbulb,
  FaSignOutAlt,
  FaTimes,
  FaUniversity,
  FaUserGraduate,
  FaUserTie,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import "./Sidebar.css";

const menuItems = [
  { name: "Academics", path: "/student/academics", icon: FaUserGraduate },
  { name: "Booking Service", path: "/student/booking", icon: FaCalendarCheck },
  { name: "CFAC", path: "/student/cfac", icon: FaUniversity },
  { name: "COE", path: "/student/coe", icon: FaFileAlt },
  { name: "Common Service", path: "/student/common", icon: FaBookOpen },
  { name: "IQAC", path: "/student/iqac", icon: FaRegLightbulb },
  { name: "Main Gate", path: "/student/main-gate", icon: FaHome },
  { name: "NDC", path: "/student/ndc", icon: FaFileAlt },
  { name: "Student Service", path: "/student/student-service", icon: FaUserGraduate },
  { name: "User Service", path: "/student/user-service", icon: FaUserTie },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const displayName = user?.name || "Student";
  const displayRollNo = user?.rollNo || "24CB023";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="cap-sidebar">
      <div className="cap-sidebar-header">
        <div className="cap-avatar">{displayInitial}</div>
        <div>
          <p className="cap-rollno">{displayRollNo}</p>
          <p className="cap-version">Version 2.0.7</p>
        </div>
        <button className="cap-icon-button" type="button" aria-label="Settings">
          <FaCog />
        </button>
      </div>

      <div className="cap-shortcuts">
        <button type="button" className="cap-circle-btn" aria-label="Refresh"><FaCalendarCheck /></button>
        <button type="button" className="cap-circle-btn" aria-label="Theme"><FaRegLightbulb /></button>
        <button type="button" className="cap-circle-btn" aria-label="Notifications"><FaBell /></button>
        <NavLink to="/student/dashboard" className="cap-circle-btn" aria-label="Dashboard"><FaHome /></NavLink>
        <button type="button" className="cap-circle-btn cap-danger" aria-label="Close"><FaTimes /></button>
      </div>

      <nav className="cap-sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `cap-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="cap-nav-left">
                <Icon className="cap-nav-icon" />
                <span>{item.name}</span>
              </span>
              <FaChevronDown className="cap-nav-arrow" />
            </NavLink>
          );
        })}
      </nav>

      <button className="cap-logout-btn" type="button" onClick={logout}>
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}
