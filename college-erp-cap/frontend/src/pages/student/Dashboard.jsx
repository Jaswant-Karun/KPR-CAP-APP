import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { getCfacStudents } from "../../services/cfacService";
import { getUploadAudit, uploadFile } from "../../services/fileService";

export default function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const isFacultyView = user?.role === "faculty";

  const [wheelRotating, setWheelRotating] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [lastUploadedFor, setLastUploadedFor] = useState("");
  const [auditRows, setAuditRows] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState("");

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
    const loadStudents = async () => {
      if (!isFacultyView || !token) return;

      try {
        const response = await getCfacStudents(token);
        const list = Array.isArray(response?.students) ? response.students : [];
        setStudents(list);
      } catch {
        setStudents([]);
      }
    };

    loadStudents();
  }, [isFacultyView, token]);

  const loadAudit = async () => {
    if (!isFacultyView || !token) return;

    try {
      setLoadingAudit(true);
      setAuditError("");
      const response = await getUploadAudit(token);
      const rows = Array.isArray(response?.uploads) ? response.uploads : [];
      setAuditRows(rows.slice(0, 6));
    } catch (error) {
      setAuditError(error?.message || "Unable to load upload audit.");
      setAuditRows([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [isFacultyView, token]);

  const selectedStudent = useMemo(
    () => students.find((item) => String(item.id) === String(selectedStudentId)),
    [students, selectedStudentId]
  );

  const handleIdUpload = async () => {
    if (!isFacultyView) {
      setUploadMessage("Only faculty can upload student ID cards.");
      return;
    }

    if (!selectedStudentId) {
      setUploadMessage("Select a student before uploading.");
      return;
    }

    if (!selectedFile) {
      setUploadMessage("Choose an ID card image file.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");
      await uploadFile(selectedFile, token, selectedStudentId);
      setLastUploadedFor(selectedStudent?.name || selectedStudent?.roll_no || `Student #${selectedStudentId}`);
      setUploadMessage("ID card uploaded successfully by faculty.");
      setSelectedFile(null);
      await loadAudit();
    } catch (error) {
      setUploadMessage(error?.message || "ID card upload failed.");
    } finally {
      setUploading(false);
    }
  };

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
          <div className="avatar-badge">{displayInitial}</div>
          <div>
            <p className="id-name">{displayName}</p>
            <p className="id-roll">ID: {displayRollNo}</p>
            <span className="verified-tag">Verified</span>
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
          {isFacultyView ? (
            <>
              <p>Faculty can upload each student ID card photo.</p>
              <div className="id-upload-grid">
                <select
                  className="id-upload-select"
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  <option value="">Select student</option>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {(item.roll_no || item.id)} - {item.name}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="id-upload-file"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />

                <button type="button" onClick={handleIdUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload ID Card"}
                </button>
              </div>
              {uploadMessage && <p className="ok-line">{uploadMessage}</p>}
              {lastUploadedFor && <p>Last uploaded for: {lastUploadedFor}</p>}
            </>
          ) : (
            <>
              <p>ID card upload access is restricted to faculty only.</p>
              <p className="ok-line">Students cannot upload ID cards.</p>
            </>
          )}
        </section>
      </div>

      <div className={`details-row ${isFacultyView ? "with-audit" : ""}`}>
        <section className="cyber-card detail-panel">
          <h3>Academic Snapshot</h3>
          {renderRows(dashboardDetails.academic)}
        </section>

        <section className="cyber-card detail-panel">
          <h3>Mentor Snapshot</h3>
          {renderRows(dashboardDetails.mentor)}
          <button type="button" className="detail-action-btn" onClick={() => navigate("/student/profile")}>Open Full Profile</button>
        </section>

        {isFacultyView && (
          <section className="cyber-card detail-panel">
            <div className="audit-header">
              <h3>Recent ID Uploads</h3>
              <button type="button" className="detail-action-btn" onClick={loadAudit}>
                Refresh
              </button>
            </div>

            {loadingAudit ? (
              <p>Loading upload logs...</p>
            ) : auditError ? (
              <p>{auditError}</p>
            ) : auditRows.length === 0 ? (
              <p>No upload records yet.</p>
            ) : (
              <div className="audit-list">
                {auditRows.map((row) => (
                  <div className="audit-item" key={row.id}>
                    <p><span>Student</span><strong>{row.studentId || "--"}</strong></p>
                    <p><span>Uploader</span><strong>{row.uploadedBy?.name || row.uploadedBy?.email || "Faculty"}</strong></p>
                    <p><span>Time</span><strong>{new Date(row.uploadedAt).toLocaleString()}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
