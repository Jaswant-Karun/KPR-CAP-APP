import React from "react";
import { Outlet, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function AdminLayout() {
  // Sidebar items for admin
  const adminMenu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "User Management", path: "/admin/users" },
    { name: "Course Management", path: "/admin/courses" },
    { name: "Department Management", path: "/admin/departments" },
    { name: "System Settings", path: "/admin/settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-64 bg-gray-100 min-h-screen p-4">
          <ul className="flex flex-col gap-2">
            {adminMenu.map((item) => (
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
