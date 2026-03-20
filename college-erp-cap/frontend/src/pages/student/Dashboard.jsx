import React, { useState, useContext } from "react";
import "./Dashboard.css";
import { FaCog, FaTimes, FaUser, FaSignOutAlt } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayName = user?.name || "JASWANT KARUN S A";
  const displayRollNo = user?.rollNo || "24CB023";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans dashboard-container relative">

      {/* 1. HEADER SECTION (Logo & Address) */}
      <div className="kpr-header-card justify-center text-center">
        <div>
          <h1 className="text-3xl font-extrabold header-title">KPR Institute of</h1>
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Engineering and Technology</h2>
          <p className="text-xs text-green-600 font-bold tracking-widest uppercase mt-1">(Autonomous, NAAC "A")</p>
          <p className="text-sm font-semibold text-blue-600 mt-2 italic">Learn Beyond</p>
        </div>
      </div>

      <div className="text-center my-4">
        <h3 className="text-xl font-bold text-gray-700 tracking-wide uppercase opacity-80">Combined Admin Panel</h3>
      </div>

      {/* 2. PROFILE SECTION */}
      <div className="profile-card">
        <div className="avatar-circle">
          {displayInitial}
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800 mb-1">{displayRollNo}</h2>
        <p className="text-gray-500 font-semibold mb-8 uppercase tracking-wide">{displayName}</p>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="account-btn cursor-pointer"
        >
          <FaCog className="text-lg" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* 3. I-BOX SECTION */}
      <div className="ibox-card">
        <h2 className="ibox-title">I-BOX</h2>
        <h3 className="text-xl font-medium mb-6 opacity-90 tracking-wide">Online Complaint Management System</h3>

        <div className="bg-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/10 max-w-2xl mx-auto">
          <p className="text-sm text-gray-100 leading-relaxed">
            (Common for all students and staffs)<br /><br />
            Our Online Complaint Management System ensures a safe and supportive platform. Your privacy is our priority, and all your details will remain strictly confidential.
          </p>
        </div>

        <button className="ibox-btn">
          Goto the main page &gt;
        </button>
      </div>

      {/* RIGHT DRAWER / SIDEBAR (Overlay) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-80 bg-white h-full shadow-2xl p-6 flex flex-col animate-slideInRight">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>

            <div className="flex flex-col items-center mt-8 border-b border-gray-100 pb-6">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-md">
                {displayInitial}
              </div>
              <h3 className="text-lg font-bold text-gray-800">{displayRollNo}</h3>
              <p className="text-xs text-gray-500">{displayName}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => navigate('/student/profile')}
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors font-medium text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <FaUser size={14} />
                </div>
                View Profile
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-3 w-full p-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-left mt-2 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                  <FaSignOutAlt size={14} />
                </div>
                Logout
              </button>
            </div>

            <div className="mt-auto text-center text-xs text-gray-400">
              <p>CAP V2.0.7</p>
              <p>powered by ITSIM</p>
              <p>© 2026 KPRIET</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
