import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import './StudentLayout.css';

export default function StudentLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="student-shell">
      <div className="student-shell-grid" aria-hidden="true" />

      <header className="student-topbar">
        <div className="student-brand-wrap">
          <p className="student-brand">KPRIET <span>PORTAL</span></p>
          <p className="student-brand-sub">Student Management Console</p>
        </div>

        <button type="button" className="student-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>

      <Sidebar />

      <main className="student-content-wrap">
        <div className="student-content-card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
