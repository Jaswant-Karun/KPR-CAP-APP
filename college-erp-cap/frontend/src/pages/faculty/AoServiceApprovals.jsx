import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAoBookings, updateAoBookingStatus } from "../../services/bookingService";
import { FiFilter, FiRefreshCw, FiX } from "react-icons/fi";
import { FaCheck, FaTimes } from "react-icons/fa";
import "./AoServiceApprovals.css";

const STATUSES = ["all", "pending", "approved", "rejected"];

export default function AoServiceApprovals() {
  const { user, token } = useAuth();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const canApprove = user?.role === "faculty" || user?.role === "admin";

  useEffect(() => {
    loadBookings();
  }, [token]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await getAoBookings(token, { status: statusFilter });
      const bookings = (response?.bookings || []).map((b) => ({
        id: b.id,
        ticket: b.ticket,
        studentId: b.studentId,
        user: b.user,
        service: b.service,
        subject: b.subject,
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));
      setRows(bookings);
      setMessage("");
    } catch (error) {
      console.error("Error loading AO bookings:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = rows;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ticket?.toLowerCase().includes(q) ||
          r.user?.toLowerCase().includes(q) ||
          r.service?.toLowerCase().includes(q) ||
          r.subject?.toLowerCase().includes(q)
      );
    }

    setFilteredRows(filtered);
  }, [rows, searchTerm, statusFilter]);

  const toStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A";
  };

  const updateAoStatus = async (bookingId, status) => {
    try {
      if (!token) {
        setMessage("Authentication token missing");
        setMessageType("error");
        return;
      }

      setLoading(true);
      const response = await updateAoBookingStatus(bookingId, { status }, token);
      const updated = response?.booking;

      if (updated?.id) {
        setRows((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
      }

      setMessage(`AO booking ${updated?.ticket || bookingId} marked as ${toStatusLabel(status)}.`);
      setMessageType("success");
    } catch (error) {
      setMessage(error?.message || "Failed to update AO booking status");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadBookings();
  };

  return (
    <div className="ao-approvals-container">
      <div className="ao-approvals-header">
        <h1>AO Service Approvals</h1>
        <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage("")} className="close-msg">
            <FiX size={14} />
          </button>
        </div>
      )}

      <div className="ao-approvals-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search ticket, student, service, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-group">
          <FiFilter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ao-approvals-table-wrapper">
        <table className="ao-approvals-table">
          <thead>
            <tr>
              <th>Ticket No</th>
              <th>Student</th>
              <th>Service</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Created</th>
              {canApprove && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} className={`status-${row.status}`}>
                  <td className="ticket">{row.ticket}</td>
                  <td>{row.user}</td>
                  <td>{row.service}</td>
                  <td>{row.subject}</td>
                  <td className={`status ${row.status}`}>{toStatusLabel(row.status)}</td>
                  <td className="date">
                    {new Date(row.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  {canApprove && (
                    <td className="actions">
                      {row.status === "pending" ? (
                        <div className="action-group">
                          <button
                            className="btn-approve"
                            onClick={() => updateAoStatus(row.id, "approved")}
                            disabled={loading}
                            title="Approve this AO booking"
                          >
                            <FaCheck size={12} /> Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => updateAoStatus(row.id, "rejected")}
                            disabled={loading}
                            title="Reject this AO booking"
                          >
                            <FaTimes size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="status-fixed">{toStatusLabel(row.status)}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canApprove ? 7 : 6} className="empty-message">
                  {loading ? "Loading..." : "No AO bookings found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
