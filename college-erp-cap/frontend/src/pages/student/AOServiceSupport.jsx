import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { createAoBooking, deleteAoBooking, getAoBookings, updateAoBookingStatus } from "../../services/bookingService";
import "./BookingFeature.css";

export default function AOServiceSupport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  const isFacultyStudentView = location.pathname.startsWith("/faculty/");
  const dashboardPath = isFacultyStudentView ? "/faculty/student/dashboard" : "/student/dashboard";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    service: "AO Service Support",
    subject: "",
    status: "pending",
  });

  const loadBookings = async () => {
    if (!token) return;
    try {
      const response = await getAoBookings(token, { status: statusFilter });
      const data = Array.isArray(response?.bookings) ? response.bookings : [];
      setRows(data);
    } catch (error) {
      alert(error?.message || "Failed to load AO bookings");
      setRows([]);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [token, statusFilter]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusOkay = statusFilter === "all" ? true : row.status === statusFilter;
      const queryOkay =
        !q ||
        String(row.ticket).toLowerCase().includes(q) ||
        String(row.user).toLowerCase().includes(q) ||
        String(row.service).toLowerCase().includes(q) ||
        String(row.subject).toLowerCase().includes(q);
      return statusOkay && queryOkay;
    });
  }, [rows, search, statusFilter]);

  const handleAdd = (event) => {
    event.preventDefault();
    const subject = form.subject.trim();
    if (!subject) {
      alert("Please enter subject");
      return;
    }

    createAoBooking(
      {
        service: form.service,
        subject,
        status: form.status,
      },
      token
    )
      .then(() => {
        setForm({ service: "AO Service Support", subject: "", status: "pending" });
        setShowModal(false);
        loadBookings();
      })
      .catch((error) => {
        alert(error?.message || "Failed to save AO booking");
      });
  };

  const deleteRow = (id) => {
    deleteAoBooking(id, token)
      .then(() => loadBookings())
      .catch((error) => alert(error?.message || "Failed to delete AO booking"));
  };

  const setStatus = (id, nextStatus) => {
    updateAoBookingStatus(id, { status: nextStatus }, token)
      .then(() => loadBookings())
      .catch((error) => alert(error?.message || "Failed to update AO booking"));
  };

  return (
    <div className="booking-feature-page max-w-[1400px] mx-auto animate-fadeIn">
      <button type="button" className="feature-back-btn" onClick={() => navigate(dashboardPath)}>
        <FaArrowLeft /> Back
      </button>

      <section className="booking-feature-card">
        <header className="booking-feature-toolbar">
          <h1 className="booking-feature-title">AO Service Booking</h1>

          <div className="booking-feature-toolbar-right">
            <select
              className="booking-feature-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="booking-feature-search-wrap">
              <FaSearch className="booking-feature-search-icon" />
              <input
                className="booking-feature-input booking-feature-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
              />
            </div>

            <button className="booking-feature-btn" type="button" onClick={() => setShowModal(true)}>
              <FaPlus /> Add
            </button>
          </div>
        </header>

        <div className="booking-feature-table-wrap">
          <table className="booking-feature-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Status</th>
                <th>User</th>
                <th>Service</th>
                <th>Subject</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="booking-feature-empty">No data available</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.ticket}</td>
                    <td>
                      <span className={`booking-status-pill ${row.status}`}>{row.status}</span>
                    </td>
                    <td>{row.user}</td>
                    <td>{row.service}</td>
                    <td>{row.subject}</td>
                    <td>
                      {isFacultyOrAdmin ? (
                        row.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="booking-feature-row-action"
                              onClick={() => setStatus(row.id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="booking-feature-row-action"
                              onClick={() => setStatus(row.id, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">Closed</span>
                        )
                      ) : (
                        <button type="button" className="booking-feature-row-action" onClick={() => deleteRow(row.id)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal ? (
        <div className="booking-feature-modal-backdrop">
          <div className="booking-feature-modal">
            <div className="booking-feature-modal-head">
              <h3>Add AO Service Booking</h3>
              <button type="button" className="booking-feature-close" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form className="booking-feature-form" onSubmit={handleAdd}>
              <label>
                Service
                <input
                  className="booking-feature-input"
                  value={form.service}
                  onChange={(event) => setForm((prev) => ({ ...prev, service: event.target.value }))}
                />
              </label>

              <label>
                Status
                <select
                  className="booking-feature-select"
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="full-width">
                Subject
                <textarea
                  className="booking-feature-textarea"
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Enter request subject"
                />
              </label>

              <div className="booking-feature-modal-actions">
                <button type="button" className="booking-feature-muted-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="booking-feature-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
