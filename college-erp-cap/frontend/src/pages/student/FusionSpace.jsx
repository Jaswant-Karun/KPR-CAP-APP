import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { createFusionBooking, deleteFusionBooking, getFusionBookings, updateFusionBookingStatus } from "../../services/bookingService";
import "./BookingFeature.css";

export default function FusionSpace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  const isFacultyStudentView = location.pathname.startsWith("/faculty/");
  const dashboardPath = isFacultyStudentView ? "/faculty/student/dashboard" : "/student/dashboard";

  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    status: "pending",
    event: "",
    count: 1,
    cooking: "No",
    date: "",
    duration: "",
    details: "",
  });

  const loadBookings = async () => {
    if (!token) return;
    try {
      const response = await getFusionBookings(token);
      const data = Array.isArray(response?.bookings) ? response.bookings : [];
      setRows(data);
    } catch (error) {
      alert(error?.message || "Failed to load Fusion bookings");
      setRows([]);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [token]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!q) return true;
      return (
        String(row.ticket).toLowerCase().includes(q) ||
        String(row.user).toLowerCase().includes(q) ||
        String(row.event).toLowerCase().includes(q) ||
        String(row.details).toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const handleAdd = (event) => {
    event.preventDefault();
    if (!form.event.trim()) {
      alert("Please enter event");
      return;
    }

    createFusionBooking(
      {
        status: form.status,
        event: form.event.trim(),
        count: Number(form.count) || 1,
        cooking: form.cooking,
        date: form.date,
        duration: form.duration,
        details: form.details,
      },
      token
    )
      .then(() => {
        setForm({
          status: "pending",
          event: "",
          count: 1,
          cooking: "No",
          date: "",
          duration: "",
          details: "",
        });
        setShowModal(false);
        loadBookings();
      })
      .catch((error) => {
        alert(error?.message || "Failed to save Fusion booking");
      });
  };

  const deleteRow = (id) => {
    deleteFusionBooking(id, token)
      .then(() => loadBookings())
      .catch((error) => alert(error?.message || "Failed to delete Fusion booking"));
  };

  const setStatus = (id, nextStatus) => {
    updateFusionBookingStatus(id, { status: nextStatus }, token)
      .then(() => loadBookings())
      .catch((error) => alert(error?.message || "Failed to update Fusion booking"));
  };

  return (
    <div className="booking-feature-page max-w-[1400px] mx-auto animate-fadeIn">
      <button type="button" className="feature-back-btn" onClick={() => navigate(dashboardPath)}>
        <FaArrowLeft /> Back
      </button>

      <section className="booking-feature-card">
        <header className="booking-feature-toolbar">
          <h1 className="booking-feature-title">Fusion Space Bookings</h1>

          <div className="booking-feature-toolbar-right">
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
                <th>Event</th>
                <th>Count</th>
                <th>Cooking</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="booking-feature-empty">No data available</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.ticket}</td>
                    <td>
                      <span className={`booking-status-pill ${row.status}`}>{row.status}</span>
                    </td>
                    <td>{row.user}</td>
                    <td>{row.event}</td>
                    <td>{row.count}</td>
                    <td>{row.cooking}</td>
                    <td>{row.date}</td>
                    <td>{row.duration}</td>
                    <td>{row.details}</td>
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
              <h3>Add Fusion Space Booking</h3>
              <button type="button" className="booking-feature-close" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form className="booking-feature-form" onSubmit={handleAdd}>
              <label>
                Event
                <input
                  className="booking-feature-input"
                  value={form.event}
                  onChange={(event) => setForm((prev) => ({ ...prev, event: event.target.value }))}
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

              <label>
                Count
                <input
                  className="booking-feature-input"
                  type="number"
                  min={1}
                  value={form.count}
                  onChange={(event) => setForm((prev) => ({ ...prev, count: event.target.value }))}
                />
              </label>

              <label>
                Cooking
                <select
                  className="booking-feature-select"
                  value={form.cooking}
                  onChange={(event) => setForm((prev) => ({ ...prev, cooking: event.target.value }))}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>

              <label>
                Date
                <input
                  className="booking-feature-input"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                />
              </label>

              <label>
                Duration
                <input
                  className="booking-feature-input"
                  placeholder="e.g. 2 hours"
                  value={form.duration}
                  onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                />
              </label>

              <label className="full-width">
                Details
                <textarea
                  className="booking-feature-textarea"
                  value={form.details}
                  onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
                  placeholder="Additional details"
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
