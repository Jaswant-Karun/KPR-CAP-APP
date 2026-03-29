import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getCfacStudents } from "../../services/cfacService";
import { deleteStudentIdCard, getStudentIdCard, getUploadAudit, uploadFile } from "../../services/fileService";
import "./IdCardUpload.css";

export default function IdCardUpload() {
  const { user, token } = useAuth();
  const isFacultyUser = String(user?.role || "").toLowerCase() === "faculty";
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [auditRows, setAuditRows] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [loadingCurrentCard, setLoadingCurrentCard] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(selectedStudentId)),
    [students, selectedStudentId]
  );

  useEffect(() => {
    const loadStudents = async () => {
      if (!isFacultyUser || !token) return;

      try {
        const response = await getCfacStudents(token);
        setStudents(Array.isArray(response?.students) ? response.students : []);
      } catch (error) {
        setStudents([]);
        setMessage(error?.message || "Unable to load student list");
      }
    };

    loadStudents();
  }, [isFacultyUser, token]);

  const loadAudit = async () => {
    if (!isFacultyUser || !token) return;

    try {
      setLoadingAudit(true);
      const response = await getUploadAudit(token, selectedStudentId ? { studentId: selectedStudentId } : {});
      setAuditRows(Array.isArray(response?.uploads) ? response.uploads.slice(0, 10) : []);
    } catch (error) {
      setAuditRows([]);
      setMessage(error?.message || "Unable to load upload history");
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [isFacultyUser, token, selectedStudentId]);

  const handleUpload = async () => {
    if (!isFacultyUser) {
      setMessage("Only faculty users can upload student ID cards.");
      return;
    }

    if (!selectedStudentId) {
      setMessage("Please select a student first.");
      return;
    }

    if (!selectedFile) {
      setMessage("Please choose an ID card image.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      await uploadFile(selectedFile, token, selectedStudentId);
      const studentLabel = selectedStudent?.name || selectedStudent?.roll_no || `Student #${selectedStudentId}`;
      setMessage(`ID card uploaded successfully for ${studentLabel}. Existing photo is updated automatically.`);
      setSelectedFile(null);
      await loadCurrentCard();
      await loadAudit();
    } catch (error) {
      setMessage(error?.message || "Failed to upload ID card");
    } finally {
      setUploading(false);
    }
  };

  const loadCurrentCard = async () => {
    if (!isFacultyUser || !token || !selectedStudentId) {
      setCurrentCard(null);
      return;
    }

    try {
      setLoadingCurrentCard(true);
      const response = await getStudentIdCard(selectedStudentId, token);
      setCurrentCard(response?.idCardPhoto || null);
    } catch {
      setCurrentCard(null);
    } finally {
      setLoadingCurrentCard(false);
    }
  };

  useEffect(() => {
    loadCurrentCard();
  }, [isFacultyUser, token, selectedStudentId]);

  const handleDelete = async () => {
    if (!isFacultyUser) {
      setMessage("Only faculty users can delete student ID cards.");
      return;
    }

    if (!selectedStudentId) {
      setMessage("Please select a student first.");
      return;
    }

    try {
      setDeleting(true);
      setMessage("");
      await deleteStudentIdCard(selectedStudentId, token);
      setCurrentCard(null);
      const studentLabel = selectedStudent?.name || selectedStudent?.roll_no || `Student #${selectedStudentId}`;
      setMessage(`ID card deleted for ${studentLabel}.`);
      await loadAudit();
    } catch (error) {
      setMessage(error?.message || "Failed to delete ID card");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="faculty-page-wrap id-upload-page-wrap">
      <div className="id-upload-head-row">
        <h1 className="faculty-title">ID Card Upload</h1>
        <span className={`id-upload-role-pill ${isFacultyUser ? "faculty" : "blocked"}`}>
          {isFacultyUser ? `Logged in as Faculty (${user?.email || "unknown"})` : "Access blocked: Not Faculty"}
        </span>
      </div>
      <p className="faculty-subtitle">
        Upload student ID card photos. Uploaded cards will be visible on each student dashboard.
      </p>

      {!isFacultyUser && (
        <section className="id-upload-panel">
          <p className="id-upload-message">Access denied. Please login with a faculty account (for example: cb001@kpriet.ac.in).</p>
        </section>
      )}

      <section className="id-upload-panel">
        <div className="id-card-current-wrap">
          <h2>Current ID Card</h2>
          {!selectedStudentId ? (
            <p>Select a student to view current ID card.</p>
          ) : loadingCurrentCard ? (
            <p>Loading current ID card...</p>
          ) : currentCard?.url ? (
            <div className="id-card-current-preview">
              <img src={currentCard.url} alt="Current student ID card" />
              <a href={currentCard.url} target="_blank" rel="noreferrer" className="id-photo-link">
                Open Full Image
              </a>
            </div>
          ) : (
            <p>No ID card available for this student.</p>
          )}
        </div>

        <div className="id-upload-grid">
          <label>
            Select Student
            <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} disabled={!isFacultyUser}>
              <option value="">Choose student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {(student.roll_no || student.id)} - {student.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            ID Card Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              disabled={!isFacultyUser}
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>

          <button type="button" className="primary-btn" onClick={handleUpload} disabled={!isFacultyUser || uploading}>
            {uploading ? "Saving..." : currentCard?.url ? "Replace ID Card" : "Upload ID Card"}
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={handleDelete}
            disabled={!isFacultyUser || deleting || !selectedStudentId || !currentCard?.url}
          >
            {deleting ? "Deleting..." : "Delete ID Card"}
          </button>
        </div>

        {message && <p className="id-upload-message">{message}</p>}
      </section>

      <section className="id-audit-panel">
        <div className="id-audit-head">
          <h2>Recent Uploads</h2>
          <button type="button" className="secondary-btn" onClick={loadAudit} disabled={!isFacultyUser || loadingAudit}>
            {loadingAudit ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="id-audit-table-wrap">
          <table className="id-audit-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Uploaded By</th>
                <th>Date & Time</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.length === 0 ? (
                <tr>
                  <td colSpan="4">No ID card uploads yet.</td>
                </tr>
              ) : (
                auditRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.studentId || "-"}</td>
                    <td>{row.uploadedBy?.name || row.uploadedBy?.email || "Faculty"}</td>
                    <td>{row.uploadedAt ? new Date(row.uploadedAt).toLocaleString() : "-"}</td>
                    <td>
                      {row.file?.url ? (
                        <a href={row.file.url} target="_blank" rel="noreferrer" className="id-photo-link">
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
