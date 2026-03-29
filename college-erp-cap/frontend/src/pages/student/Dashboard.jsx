import React, { useContext, useEffect, useState } from "react";
import "./Dashboard.css";
import {
  FaBook,
  FaCalendarAlt,
  FaClipboardList,
  FaDoorOpen,
  FaFileAlt,
  FaHome,
  FaInfoCircle,
  FaUser,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getFullProfile } from "../../services/studentService";

export default function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [wheelRotating, setWheelRotating] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);

  const displayName = user?.name || "JASWANT KARUN S A";
  const displayRollNo = user?.rollNo || "24CB023";
  const displayEmail = user?.email || "24cb023@kpriet.ac.in";
  const displayDepartment = user?.department || "CSE";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const dashboardDetails = {
    academic: {
      rollNo: displayRollNo,
      batch: "II (2024-2028)",
      section: "A",
    },
    mentor: {
      mentorName: "SIVASANKARI S",
      mentorCode: "CB005",
    },
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;

      try {
        const profile = await getFullProfile(token);
        setStudentProfile(profile || null);
      } catch {
        setStudentProfile(null);
      }
    };

    loadProfile();
  }, [token]);

  const idCardPhotoUrl = studentProfile?.idCardPhoto?.url || "";

  const renderRows = (data) =>
    Object.entries(data).map(([key, value]) => (
      <div className="detail-row" key={key}>
        <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
        <strong>{String(value)}</strong>
      </div>
    ));

  const wheelItems = [
    { label: "Profile", path: "/student/profile", icon: FaUser, accent: true },
    { label: "Events", path: "/student/booking", icon: FaCalendarAlt },
    { label: "Schedule", path: "/student/timetable", icon: FaClipboardList },
    { label: "Workshops", path: "/student/common", icon: FaBook },
    { label: "Papers", path: "/student/coe", icon: FaFileAlt },
    { label: "Services", path: "/student/student-service", icon: FaDoorOpen },
    { label: "About", path: "/student/iqac", icon: FaInfoCircle },
    { label: "Home", path: "/student/dashboard", icon: FaHome },
  ];

  return (
    <div className="cyber-dashboard">
      <div className="cyber-profile-strip">
        <div className="id-card">
          {idCardPhotoUrl ? (
            <img src={idCardPhotoUrl} alt="Student ID Card" className="id-card-photo" />
          ) : (
            <div className="avatar-badge">{displayInitial}</div>
          )}
          <div>
            <p className="id-name">{displayName}</p>
            <p className="id-roll">ID: {displayRollNo}</p>
            <span className="verified-tag">Verified</span>
            {!idCardPhotoUrl && <p className="id-card-missing">ID card photo not uploaded yet.</p>}
          </div>
        </div>

        <div className="quick-meta">
          <p>
            <span>Mail</span>
            <strong>{displayEmail}</strong>
          </p>
          <p>
            <span>Department</span>
            <strong>{displayDepartment}</strong>
          </p>
          <p>
            <span>Status</span>
            <strong className="online-status">Online</strong>
          </p>
        </div>
      </div>

      <div className="cyber-grid">
        <section className="cyber-card left-info">
          <h3>Status: Online</h3>
          <p>LEVEL 2 // PRISM</p>
          <div className="wireframe-glow" />
        </section>

        <section className="wheel-stage">
          <button
            type="button"
            className="wheel-rotate-toggle"
            onClick={() => setWheelRotating((prev) => !prev)}
          >
            {wheelRotating ? "Pause Rotation" : "Rotate Options"}
          </button>

          <div className={`radial-wheel ${wheelRotating ? "is-rotating" : ""}`}>
            <div className="wheel-core" />

            {wheelItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`wheel-action ${item.accent ? "accent" : ""}`}
                  style={{ "--i": index }}
                  onClick={() => navigate(item.path)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="cyber-card right-info">
          <h3>Identity Verification</h3>
          <>
            <p>ID card upload access is restricted to faculty only.</p>
            {idCardPhotoUrl ? (
              <div className="id-verification-preview">
                <img src={idCardPhotoUrl} alt="Uploaded student ID card" className="id-verification-photo" />
                <p className="ok-line">ID card photo uploaded by faculty.</p>
              </div>
            ) : (
              <p className="id-verification-empty">ID card photo not uploaded by faculty yet.</p>
            )}
          </>
        </section>
      </div>

      <div className="details-row">
        <section className="cyber-card detail-panel">
          <h3>Academic Snapshot</h3>
          {renderRows(dashboardDetails.academic)}
        </section>

        <section className="cyber-card detail-panel">
          <h3>Mentor Snapshot</h3>
          {renderRows(dashboardDetails.mentor)}
          <button type="button" className="detail-action-btn" onClick={() => navigate("/student/profile")}>Open Full Profile</button>
        </section>
      </div>
    </div>
  );
}
