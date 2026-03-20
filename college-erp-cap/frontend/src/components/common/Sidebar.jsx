import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaCalendarCheck, FaBuilding, FaGlobe, FaCogs, FaChartLine } from 'react-icons/fa';

export default function Sidebar() {
  const menuItems = [
    { name: "Academics", path: "/student/academics", icon: <FaGraduationCap /> },
    { name: "360 Student Attendance View", path: "/student/attendance", icon: null, sub: true },
    { name: "4.0 Final Year Project - I", path: "/student/project", icon: null, sub: true },
    { name: "Booking Service", path: "/student/booking", icon: <FaCalendarCheck /> },
    { name: "CFAC", path: "/student/cfac", icon: <FaBuilding /> },
    { name: "COE", path: "/student/coe", icon: <FaGlobe /> },
    { name: "Common Service", path: "/student/common", icon: <FaCogs /> },
    { name: "IQAC", path: "/student/iqac", icon: <FaChartLine /> },
  ];

  return (
    <aside className="w-72 bg-[#1e3a5f] text-white min-h-screen flex flex-col font-sans">
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">J</div>
        <div>
          <p className="text-xs font-semibold">24CH023</p>
          <p className="text-[10px] opacity-70">Version 2.0.7</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition-colors ${item.sub ? 'pl-12 text-sm opacity-80' : 'font-medium'}`}
              >
                {item.icon && <span className="text-lg opacity-80">{item.icon}</span>}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
