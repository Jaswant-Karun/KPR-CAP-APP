import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import AdminSidebar from "../components/AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <div className="admin-shell-grid" aria-hidden="true" />

      <header className="admin-topbar">
        <div className="admin-brand-wrap">
          <p className="admin-brand">KPRIET <span>PORTAL</span></p>
          <p className="admin-brand-sub">Admin Master Control Console</p>
        </div>

        <button type="button" className="admin-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>

      <AdminSidebar />

      <main className="admin-content-wrap">
        <div className="admin-content-card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
