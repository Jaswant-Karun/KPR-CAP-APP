import React from "react";
import { Outlet, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function FacultyLayout() {
  // Example: custom sidebar menu for faculty
  const facultyMenu = [
    { name: "Dashboard", path: "/faculty/dashboard" },
    { name: "Attendance Manage", path: "/faculty/attendance" },
    { name: "Period Scheduling", path: "/faculty/schedule" },
    { name: "Timetable Scheduler", path: "/faculty/timetable-scheduler" },
    { name: "Reports", path: "/faculty/reports" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-64 bg-gray-100 min-h-screen p-4">
          <ul className="flex flex-col gap-2">
            {facultyMenu.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="hover:text-blue-600">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
