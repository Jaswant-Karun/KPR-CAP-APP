import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getGatepassRequests, updateGatepassStatus } from "../../services/gatepassService";
import "./GatepassApprovals.css";

const toDisplay = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export default function GatepassApprovals() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [passTypeFilter, setPassTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [remarkMap, setRemarkMap] = useState({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getGatepassRequests(token, {
        status: statusFilter || undefined,
        type: passTypeFilter || undefined,
        passCategory: categoryFilter || undefined,
      });
      setRows(res?.requests || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load gatepass approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token, statusFilter, passTypeFilter, categoryFilter]);

  const updateStatus = async (gatepassId, status, defaultMessage) => {
    try {
      await updateGatepassStatus(
        gatepassId,
        {
          status,
          remarks: remarkMap[gatepassId] || "",
        },
        token
      );
      setMessage(defaultMessage);
      await load();
    } catch (err) {
      setMessage(err?.message || "Unable to update gatepass status");
    }
  };

  return (
    <div className="faculty-page-wrap gatepass-page">
      <h1 className="faculty-title">Gatepass Approval</h1>
      <p className="faculty-subtitle">Faculty can approve or reject student gatepass requests.</p>

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

        <label>
          Request Type
          <select value={passTypeFilter} onChange={(e) => setPassTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="gate pass">Gate Pass</option>
            <option value="free outing">Free Outing</option>
          </select>
        </label>

        <label>
          Student Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            <option value="day-scholar">Day Scholar</option>
            <option value="hosteller">Hosteller</option>
            <option value="lateral">Lateral</option>
          </select>
        </label>
      </div>

      <div className="gatepass-table-wrap">
        <table className="gatepass-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>Type</th>
              <th>Category</th>
              <th>Student</th>
              <th>Reason</th>
              <th>Departure</th>
              <th>Return</th>
              <th>Last Change</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="no-data">Loading gatepass requests...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">No gatepass requests found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.ticketNo || row.id}</td>
                  <td>
                    <span className={`status-pill ${row.status}`}>{row.status}</span>
                  </td>
                  <td>{row.type || "Day Pass"}</td>
                  <td>{row.passCategory || "day-scholar"}</td>
                  <td>
                    <div className="student-name-cell">{row.studentName || "Student"}</div>
                    <div className="student-roll-tag">{row.rollNo || "--"}</div>
                  </td>
                  <td>{row.reason}</td>
                  <td>{toDisplay(row.fromDate)}</td>
                  <td>{toDisplay(row.toDate)}</td>
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
                        onClick={() => updateStatus(row.id, "approved", "Gatepass approved successfully.")}
                        disabled={row.status !== "pending"}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="remove-student-btn"
                        onClick={() => updateStatus(row.id, "rejected", "Gatepass rejected successfully.")}
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
