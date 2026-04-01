import { useEffect, useMemo, useState } from "react";
import { FiClock, FiFilter, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { createLatecomerRequest, getLatecomerRequests } from "../../services/latecomerService";
import "./Latecomers.css";

const toDisplay = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export default function Latecomers() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [arrivedAt, setArrivedAt] = useState(new Date().toISOString().slice(0, 16));
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLatecomers = async () => {
    try {
      setLoading(true);
      const res = await getLatecomerRequests(token, {
        status: statusFilter || undefined,
      });
      setRows(res?.requests || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load latecomer requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadLatecomers();
    }
  }, [token, statusFilter]);

  const submitRequest = async () => {
    if (!reason.trim()) {
      setMessage("Reason is required");
      return;
    }

    try {
      await createLatecomerRequest(
        {
          arrivedAt,
          reason,
          remarks,
        },
        token
      );
      setReason("");
      setRemarks("");
      setMessage("Latecomer permission request sent to faculty.");
      await loadLatecomers();
    } catch (err) {
      setMessage(err?.message || "Failed to create latecomer request");
    }
  };

  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((item) => {
      const textOk =
        !text ||
        String(item.ticketNo || "").toLowerCase().includes(text) ||
        String(item.studentName || "").toLowerCase().includes(text) ||
        String(item.rollNo || "").toLowerCase().includes(text) ||
        String(item.department || "").toLowerCase().includes(text) ||
        String(item.reason || "").toLowerCase().includes(text);
      return textOk;
    });
  }, [query, rows]);

  return (
    <div className="latecomers-page">
      <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
        <FaArrowLeft /> Back
      </button>

      <div className="latecomers-header">
        <div>
          <h1>Latecomers</h1>
          <p>Send latecomer permission requests to faculty and track approval state.</p>
        </div>
        <div className="latecomers-meta">
          <FiClock /> {filteredRows.length} Records
        </div>
      </div>

      <section className="latecomers-toolbar" style={{ gridTemplateColumns: "2fr 2fr 1.5fr auto" }}>
        <input
          type="datetime-local"
          value={arrivedAt}
          onChange={(event) => setArrivedAt(event.target.value)}
        />
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason for late arrival"
        />
        <input
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Optional remarks"
        />
        <button type="button" className="main-gate-primary-btn" onClick={submitRequest}>
          Send Request
        </button>
      </section>

      <section className="latecomers-toolbar">
        <div className="latecomers-search">
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ticket, code, name, department"
          />
        </div>

        <label>
          <FiFilter />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </section>

      <section className="latecomers-table-wrap">
        <table className="latecomers-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Name</th>
              <th>Roll No</th>
              <th>Department</th>
              <th>Arrived At</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="no-data">Loading requests...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No latecomer requests available</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.ticketNo || row.id}</td>
                  <td>{row.studentName || "Student"}</td>
                  <td>{row.rollNo || "--"}</td>
                  <td>{row.department}</td>
                  <td>{toDisplay(row.arrivedAt)}</td>
                  <td>{row.reason}</td>
                  <td>
                    <span className={`latecomers-status ${row.status}`}>{row.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {message && <p className="attendance-message">{message}</p>}
    </div>
  );
}
