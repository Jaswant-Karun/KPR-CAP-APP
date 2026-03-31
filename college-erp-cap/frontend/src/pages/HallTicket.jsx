import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiClock, FiDownload, FiSearch, FiUploadCloud, FiXCircle } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getStudents } from "../services/adminService";
import {
  deleteHallTicket,
  downloadHallTicket,
  listHallTicketAudit,
  listHallTickets,
  replaceHallTicket,
  uploadHallTicket,
  verifyHallTicket,
} from "../services/hallTicketService";
import "./HallTicket.css";

const statusClassName = {
  pending: "is-pending",
  verified: "is-verified",
  rejected: "is-rejected",
};

export default function HallTicket({ mode = "student" }) {
  const { token, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [residentTypeFilter, setResidentTypeFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedResidentType, setSelectedResidentType] = useState("day-scholar");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [auditRows, setAuditRows] = useState([]);
  const [replaceTargetId, setReplaceTargetId] = useState(null);
  const replaceInputRef = useRef(null);

  const isAdmin = mode === "admin";
  const isFaculty = mode === "faculty";

  const loadRows = async () => {
    if (!token) return;
    setLoading(true);
    try {
      setError("");
      const response = await listHallTickets(token, {
        status: statusFilter === "all" ? "" : statusFilter,
        residentType: residentTypeFilter === "all" ? "" : residentTypeFilter,
        search: query.trim(),
      });
      setRows(response?.hallTickets || []);
    } catch (err) {
      setRows([]);
      setError(err?.message || "Failed to load hall tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    if (!token || !isAdmin) return;
    try {
      const response = await listHallTicketAudit(token);
      setAuditRows(response?.audit || []);
    } catch {
      setAuditRows([]);
    }
  };

  useEffect(() => {
    loadRows();
  }, [token, statusFilter, residentTypeFilter]);

  useEffect(() => {
    if (!isAdmin || !token) return;

    const loadStudents = async () => {
      try {
        const response = await getStudents(token);
        setStudents(response?.students || []);
      } catch {
        setStudents([]);
      }
    };

    loadStudents();
  }, [isAdmin, token]);

  useEffect(() => {
    loadAudit();
  }, [isAdmin, token]);

  const headerText = useMemo(() => {
    if (isAdmin) {
      return {
        title: "Hall Ticket Control",
        subtitle: "Upload hall tickets for students. Faculty will verify these tickets.",
      };
    }

    if (isFaculty) {
      return {
        title: "Hall Ticket Verification",
        subtitle: "Review hall tickets uploaded by admin and verify or reject them.",
      };
    }

    return {
      title: "Hall Ticket View & Download",
      subtitle: "View your hall ticket status and download official copies.",
    };
  }, [isAdmin, isFaculty]);

  const onSearchSubmit = (event) => {
    event.preventDefault();
    loadRows();
  };

  const handleUpload = async () => {
    if (!selectedStudentId) {
      setError("Select a student before uploading");
      return;
    }

    if (!selectedFile) {
      setError("Select a hall ticket file to upload");
      return;
    }

    const selectedStudent = students.find((item) => Number(item.id) === Number(selectedStudentId));

    setSubmitting(true);
    try {
      setError("");
      setSuccess("");
      await uploadHallTicket(
        {
          studentId: Number(selectedStudentId),
          studentName: selectedStudent?.name,
          rollNo: selectedStudent?.roll_no,
          residentType: selectedResidentType,
          file: selectedFile,
        },
        token
      );
      setSuccess("Hall ticket uploaded successfully");
      setSelectedFile(null);
      setSelectedResidentType("day-scholar");
      await loadRows();
      await loadAudit();
    } catch (err) {
      setError(err?.message || "Failed to upload hall ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (row) => {
    try {
      const response = await downloadHallTicket(row.id, token);
      const fileUrl = response?.hallTicket?.fileUrl;
      if (!fileUrl) {
        throw new Error("Hall ticket URL is missing");
      }
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.message || "Failed to download hall ticket");
    }
  };

  const handleVerify = async (row, status) => {
    try {
      const remarks = status === "rejected" ? window.prompt("Enter rejection reason") || "" : "Verified by faculty";
      await verifyHallTicket(row.id, { status, remarks }, token);
      await loadRows();
      await loadAudit();
    } catch (err) {
      setError(err?.message || "Failed to update verification status");
    }
  };

  const triggerReplace = (row) => {
    setReplaceTargetId(row.id);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const onReplaceSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !replaceTargetId) return;

    try {
      setError("");
      setSuccess("");
      await replaceHallTicket(replaceTargetId, file, token);
      setSuccess("Hall ticket replaced successfully");
      await loadRows();
      await loadAudit();
    } catch (err) {
      setError(err?.message || "Failed to replace hall ticket");
    } finally {
      setReplaceTargetId(null);
    }
  };

  const handleDelete = async (row) => {
    const okay = window.confirm(`Delete hall ticket ${row.ticketNo}?`);
    if (!okay) return;

    try {
      setError("");
      setSuccess("");
      await deleteHallTicket(row.id, token);
      setSuccess("Hall ticket deleted");
      await loadRows();
      await loadAudit();
    } catch (err) {
      setError(err?.message || "Failed to delete hall ticket");
    }
  };

  const visibleRows = useMemo(() => {
    if (!isFaculty && !isAdmin && user?.role === "student") {
      return rows.filter((item) => Number(item.studentId) === Number(user?.id));
    }
    return rows;
  }, [isFaculty, isAdmin, rows, user?.id, user?.role]);

  const facultySplitCounts = useMemo(() => {
    if (!isFaculty) {
      return { dayScholar: 0, hosteller: 0 };
    }

    return visibleRows.reduce(
      (acc, item) => {
        const type = String(item?.residentType || "day-scholar").toLowerCase();
        if (type === "hosteller") {
          acc.hosteller += 1;
        } else {
          acc.dayScholar += 1;
        }
        return acc;
      },
      { dayScholar: 0, hosteller: 0 }
    );
  }, [isFaculty, visibleRows]);

  const facultyDayScholarRows = useMemo(
    () => visibleRows.filter((row) => String(row?.residentType || "day-scholar").toLowerCase() !== "hosteller"),
    [visibleRows]
  );

  const facultyHostellerRows = useMemo(
    () => visibleRows.filter((row) => String(row?.residentType || "day-scholar").toLowerCase() === "hosteller"),
    [visibleRows]
  );

  const renderHallTicketTable = (tableRows, emptyText) => (
    <div className="hall-ticket-table-wrap">
      <table className="hall-ticket-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Student</th>
            <th>Roll No</th>
            <th>Type</th>
            <th>File</th>
            <th>Status</th>
            <th>Verified By</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="9">Loading hall tickets...</td>
            </tr>
          ) : tableRows.length === 0 ? (
            <tr>
              <td colSpan="9">{emptyText}</td>
            </tr>
          ) : (
            tableRows.map((row) => (
              <tr key={row.id}>
                <td>{row.ticketNo}</td>
                <td>{row.studentName || "Student"}</td>
                <td>{row.rollNo || "--"}</td>
                <td>{row.residentType === "hosteller" ? "Hosteller" : "Day Scholar"}</td>
                <td>{row.fileName}</td>
                <td>
                  <span className={`hall-ticket-status ${statusClassName[row.status] || "is-pending"}`}>
                    {row.status === "verified" ? <FiCheckCircle /> : row.status === "rejected" ? <FiXCircle /> : <FiClock />} {row.status}
                  </span>
                </td>
                <td>{row.verifiedByName || "--"}</td>
                <td>{new Date(row.updatedAt || row.createdAt).toLocaleString()}</td>
                <td>
                  <div className="hall-ticket-actions">
                    <button type="button" onClick={() => handleDownload(row)}>
                      <FiDownload /> Download
                    </button>

                    {isFaculty && (
                      <>
                        <button
                          type="button"
                          className="verify"
                          onClick={() => handleVerify(row, "verified")}
                          disabled={row.status === "verified"}
                        >
                          <FiCheckCircle /> Verify
                        </button>
                        <button
                          type="button"
                          className="reject"
                          onClick={() => handleVerify(row, "rejected")}
                          disabled={row.status === "rejected"}
                        >
                          <FiXCircle /> Reject
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <button type="button" className="replace" onClick={() => triggerReplace(row)}>
                          Replace
                        </button>
                        <button type="button" className="delete" onClick={() => handleDelete(row)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="hall-ticket-page">
      <div className="hall-ticket-header">
        <div>
          <h1>{headerText.title}</h1>
          <p>{headerText.subtitle}</p>
        </div>
        <div className="hall-ticket-meta">Total: {visibleRows.length}</div>
      </div>

      {isAdmin && (
        <section className="hall-ticket-upload-panel">
          <h2>Upload Hall Ticket</h2>
          <div className="hall-ticket-upload-grid">
            <label>
              <span>Student</span>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                disabled={submitting}
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.roll_no || student.email})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Student Type</span>
              <select
                value={selectedResidentType}
                onChange={(event) => setSelectedResidentType(event.target.value)}
                disabled={submitting}
              >
                <option value="day-scholar">Day Scholar</option>
                <option value="hosteller">Hosteller</option>
              </select>
            </label>

            <label>
              <span>Hall Ticket File (PDF/Image)</span>
              <input
                type="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                disabled={submitting}
              />
            </label>

            <button type="button" className="hall-ticket-upload-btn" onClick={handleUpload} disabled={submitting}>
              <FiUploadCloud /> {submitting ? "Uploading..." : "Upload Hall Ticket"}
            </button>
          </div>
        </section>
      )}

      <section className="hall-ticket-toolbar">
        <form className="hall-ticket-search" onSubmit={onSearchSubmit}>
          <FiSearch />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ticket, student, roll no, file"
          />
        </form>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>

        {(isFaculty || isAdmin) && (
          <select value={residentTypeFilter} onChange={(event) => setResidentTypeFilter(event.target.value)}>
            <option value="all">All Students</option>
            <option value="day-scholar">Day Scholar</option>
            <option value="hosteller">Hosteller</option>
          </select>
        )}

        <button type="button" onClick={loadRows}>Refresh</button>
      </section>

      {isFaculty && (
        <section className="hall-ticket-split-panel">
          <div className="hall-ticket-split-card">
            <p>Day Scholar</p>
            <h3>{facultySplitCounts.dayScholar}</h3>
            <button
              type="button"
              onClick={() => setResidentTypeFilter("day-scholar")}
              className={residentTypeFilter === "day-scholar" ? "active" : ""}
            >
              Show Day Scholar
            </button>
          </div>
          <div className="hall-ticket-split-card">
            <p>Hosteller</p>
            <h3>{facultySplitCounts.hosteller}</h3>
            <button
              type="button"
              onClick={() => setResidentTypeFilter("hosteller")}
              className={residentTypeFilter === "hosteller" ? "active" : ""}
            >
              Show Hosteller
            </button>
          </div>
          <div className="hall-ticket-split-card">
            <p>Total</p>
            <h3>{visibleRows.length}</h3>
            <button
              type="button"
              onClick={() => setResidentTypeFilter("all")}
              className={residentTypeFilter === "all" ? "active" : ""}
            >
              Show All
            </button>
          </div>
        </section>
      )}

      {error && <p className="hall-ticket-message error">{error}</p>}
      {success && <p className="hall-ticket-message success">{success}</p>}

      <input
        ref={replaceInputRef}
        type="file"
        className="hall-ticket-hidden-input"
        onChange={onReplaceSelected}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
      />

      {isFaculty && residentTypeFilter === "all" ? (
        <section className="hall-ticket-split-tables">
          <div className="hall-ticket-split-table-block">
            <h2>Day Scholar Students</h2>
            {renderHallTicketTable(facultyDayScholarRows, "No day scholar hall tickets found")}
          </div>
          <div className="hall-ticket-split-table-block">
            <h2>Hosteller Students</h2>
            {renderHallTicketTable(facultyHostellerRows, "No hosteller hall tickets found")}
          </div>
        </section>
      ) : (
        renderHallTicketTable(visibleRows, "No hall tickets found")
      )}

      {isAdmin && (
        <section className="hall-ticket-audit-panel">
          <h2>Hall Ticket Audit History</h2>
          <div className="hall-ticket-audit-wrap">
            <table className="hall-ticket-audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Ticket</th>
                  <th>Student ID</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.length === 0 ? (
                  <tr>
                    <td colSpan="7">No audit logs available</td>
                  </tr>
                ) : (
                  auditRows.map((item) => (
                    <tr key={`${item.id}-${item.createdAt}`}>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                      <td>{item.action}</td>
                      <td>{item.ticketNo || "--"}</td>
                      <td>{item.studentId || "--"}</td>
                      <td>{item.actorName || "--"}</td>
                      <td>{item.actorRole || "--"}</td>
                      <td>{item.remarks || "--"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
