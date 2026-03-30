import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getFusionBookings, updateFusionBookingStatus } from "../../services/bookingService";
import { FiFilter, FiRefreshCw, FiX } from "react-icons/fi";
import { FaCheck, FaTimes } from "react-icons/fa";
import "./FusionSpaceApprovals.css";

const STATUSES = ["all", "pending", "approved", "rejected"];

export default function FusionSpaceApprovals() {
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
      const response = await getFusionBookings(token);
      const bookings = (response?.bookings || [])
        .filter((b) => statusFilter === "all" || b.status === statusFilter)
        .map((b) => ({
          id: b.id,
          ticket: b.ticket,
          studentId: b.studentId,
          user: b.user,
          event: b.event,
          count: b.count,
          cooking: b.cooking,
          date: b.date,
          duration: b.duration,
          details: b.details,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        }));
      setRows(bookings);
      setMessage("");
    } catch (error) {
      console.error("Error loading Fusion bookings:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = rows;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ticket?.toLowerCase().includes(q) ||
          r.user?.toLowerCase().includes(q) ||
          r.event?.toLowerCase().includes(q) ||
          r.details?.toLowerCase().includes(q)
      );
    }

    setFilteredRows(filtered);
  }, [rows, searchTerm]);

  const toStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A";
  };

  const updateFusionStatus = async (bookingId, status) => {
    try {
      if (!token) {
        setMessage("Authentication token missing");
        setMessageType("error");
        return;
      }

      setLoading(true);
      const response = await updateFusionBookingStatus(bookingId, { status }, token);
      const updated = response?.booking;

      if (updated?.id) {
        setRows((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
      }

      setMessage(`Fusion booking ${updated?.ticket || bookingId} marked as ${toStatusLabel(status)}.`);
      setMessageType("success");
    } catch (error) {
      setMessage(error?.message || "Failed to update Fusion booking status");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadBookings();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <div className="fusion-approvals-container">
      <div className="fusion-approvals-header">
        <h1>Fusion Space Approvals</h1>
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

      <div className="fusion-approvals-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search ticket, student, event, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-group">
          <FiFilter size={16} />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
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

      <div className="fusion-approvals-table-wrapper">
        <table className="fusion-approvals-table">
          <thead>
            <tr>
              <th>Ticket No</th>
              <th>Student</th>
              <th>Event</th>
              <th>Attendees</th>
              <th>Cooking</th>
              <th>Date</th>
              <th>Status</th>
              {canApprove && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} className={`status-${row.status}`}>
                  <td className="ticket">{row.ticket}</td>
                  <td>{row.user}</td>
                  <td>{row.event}</td>
                  <td className="center">{row.count}</td>
                  <td className="center">{row.cooking ? "Yes" : "No"}</td>
                  <td className="date">{row.date}</td>
                  <td className={`status ${row.status}`}>{toStatusLabel(row.status)}</td>
                  {canApprove && (
                    <td className="actions">
                      {row.status === "pending" ? (
                        <div className="action-group">
                          <button
                            className="btn-approve"
                            onClick={() => updateFusionStatus(row.id, "approved")}
                            disabled={loading}
                            title="Approve this Fusion booking"
                          >
                            <FaCheck size={12} /> Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => updateFusionStatus(row.id, "rejected")}
                            disabled={loading}
                            title="Reject this Fusion booking"
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
                <td colSpan={canApprove ? 8 : 7} className="empty-message">
                  {loading ? "Loading..." : "No Fusion bookings found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
