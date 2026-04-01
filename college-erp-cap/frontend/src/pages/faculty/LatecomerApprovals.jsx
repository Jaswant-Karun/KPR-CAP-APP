import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getLatecomerRequests, updateLatecomerStatus } from "../../services/latecomerService";
import "./GatepassApprovals.css";

const toDisplay = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export default function LatecomerApprovals() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [remarkMap, setRemarkMap] = useState({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getLatecomerRequests(token, {
        status: statusFilter || undefined,
      });
      setRows(res?.requests || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load latecomer approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token, statusFilter]);

  const updateStatus = async (requestId, status, defaultMessage) => {
    try {
      await updateLatecomerStatus(
        requestId,
        {
          status,
          remarks: remarkMap[requestId] || "",
        },
        token
      );
      setMessage(defaultMessage);
      await load();
    } catch (err) {
      setMessage(err?.message || "Unable to update latecomer status");
    }
  };

  return (
    <div className="faculty-page-wrap gatepass-page">
      <h1 className="faculty-title">Latecomer Permission Approval</h1>
      <p className="faculty-subtitle">Faculty can approve or reject latecomer permission requests.</p>

      <div className="gatepass-toolbar">
        <label>
          Filter Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </label>
      </div>

      <div className="gatepass-table-wrap">
        <table className="gatepass-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>Student</th>
              <th>Department</th>
              <th>Arrived At</th>
              <th>Reason</th>
              <th>Last Change</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="no-data">Loading requests...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No latecomer requests found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.ticketNo || row.id}</td>
                  <td>
                    <span className={`status-pill ${row.status}`}>{row.status}</span>
                  </td>
                  <td>
                    <div className="student-name-cell">{row.studentName || "Student"}</div>
                    <div className="student-roll-tag">{row.rollNo || "--"}</div>
                  </td>
                  <td>{row.department || "--"}</td>
                  <td>{toDisplay(row.arrivedAt)}</td>
                  <td>{row.reason}</td>
                  <td>{toDisplay(row.updatedAt)}</td>
                  <td>
                    <input
                      type="text"
                      className="remarks-input"
                      value={remarkMap[row.id] ?? row.remarks ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setRemarkMap((prev) => ({ ...prev, [row.id]: value }));
                      }}
                      placeholder="Optional remark"
                      disabled={row.status !== "pending"}
                    />
                  </td>
                  <td>
                    <div className="gatepass-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => updateStatus(row.id, "approved", "Latecomer request approved successfully.")}
                        disabled={row.status !== "pending"}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="remove-student-btn"
                        onClick={() => updateStatus(row.id, "rejected", "Latecomer request rejected successfully.")}
                        disabled={row.status !== "pending"}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {message && <p className="attendance-message">{message}</p>}
    </div>
  );
}
