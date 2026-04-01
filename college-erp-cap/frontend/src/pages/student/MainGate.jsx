import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { createGatepass, getGatepassRequests } from "../../services/gatepassService";
import "./MainGate.css";

const today = () => new Date().toISOString().slice(0, 10);
const toInputValue = (value) => String(value || "").slice(0, 16);
const toDisplay = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export default function MainGate() {
  return <StudentPassRequestPage mode="gatepass" category="day-scholar" />;
}

export function StudentPassRequestPage({
  mode = "gatepass",
  category,
  titleOverride,
  subtitleOverride,
}) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [fromDate, setFromDate] = useState(`${today()}T09:00`);
  const [toDate, setToDate] = useState(`${today()}T17:00`);
  const [reasonType, setReasonType] = useState("Medical");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const residentType = String(user?.residentType || category || "day-scholar").toLowerCase();
  const normalizedCategory = residentType === "hosteller" ? "hosteller" : "day-scholar";
  const passType = normalizedCategory === "hosteller" ? "Free Outing" : "Gate Pass";
  const fallbackTitle = normalizedCategory === "hosteller" ? "Free Outing" : "Gatepass";
  const fallbackSubtitle =
    normalizedCategory === "hosteller"
      ? "Hosteller students can submit free outing requests and track approval."
      : "Day scholar students can submit gatepass requests and track faculty approval status.";
  const pageTitle = titleOverride || fallbackTitle;
  const pageSubtitle = subtitleOverride || fallbackSubtitle;

  const loadGatepass = async () => {
    try {
      setLoading(true);
      const res = await getGatepassRequests(token, {
        status: statusFilter || undefined,
        type: passType,
        passCategory: normalizedCategory,
      });
      setRows(res?.requests || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load gatepass requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadGatepass();
    }
  }, [token, statusFilter]);

  const submitRequest = async () => {
    if (!reason.trim()) {
      setMessage("Reason is required");
      return;
    }

    try {
      await createGatepass(
        {
          fromDate,
          toDate,
          reason: `${reasonType}: ${reason}`,
          type: passType,
          passCategory: normalizedCategory,
          remarks,
          studentName: user?.name,
          rollNo: user?.rollNo,
        },
        token
      );
      setReason("");
      setRemarks("");
      setMessage(`${pageTitle} request sent for faculty approval.`);
      await loadGatepass();
    } catch (err) {
      setMessage(err?.message || "Failed to create gatepass request");
    }
  };

  return (
    <div className="main-gate-page">
      <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
        <FaArrowLeft /> Back
      </button>
      <h1 className="main-gate-title">{pageTitle}</h1>
      <p className="main-gate-subtitle">{pageSubtitle}</p>

      <section className="main-gate-card">
        <h2>New {pageTitle} Request</h2>
        <div className="main-gate-form-grid">
          <label>
            Departure Date & Time
            <input type="datetime-local" value={toInputValue(fromDate)} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            Return Date & Time
            <input type="datetime-local" value={toInputValue(toDate)} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label>
            Reason Category
            <select value={reasonType} onChange={(e) => setReasonType(e.target.value)}>
              <option value="Medical">Medical</option>
              <option value="Industry Visit">Industry Visit</option>
              <option value="Event Participation">Event Participation</option>
              <option value="Personal">Personal</option>
              <option value="Emergency">Emergency</option>
            </select>
          </label>
          <label className="full-width">
            Reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for gatepass request"
            />
          </label>
          <label className="full-width">
            Additional Notes
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
            />
          </label>
        </div>
        <div className="main-gate-action-row">
          <button type="button" className="main-gate-primary-btn" onClick={submitRequest}>
            Save & Send to Faculty
          </button>
        </div>
      </section>

      <section className="main-gate-card">
        <div className="main-gate-header-row">
          <h2>My {pageTitle} Requests</h2>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="main-gate-table-wrap">
          <table className="main-gate-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Reason</th>
                <th>Departure</th>
                <th>Return</th>
                <th>Status</th>
                <th>Last Change</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="no-data">Loading requests...</td>
                </tr>
              ) : (
                rows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No {pageTitle.toLowerCase()} requests yet.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.ticketNo || row.id}</td>
                      <td>{row.reason}</td>
                      <td>{toDisplay(row.fromDate)}</td>
                      <td>{toDisplay(row.toDate)}</td>
                      <td>
                        <span className={`status-pill ${row.status}`}>{row.status}</span>
                      </td>
                      <td>{toDisplay(row.updatedAt)}</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {message && <p className="main-gate-message">{message}</p>}
    </div>
  );
}
