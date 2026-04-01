import React, { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaPlus, FaSearch, FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { createEvent, deleteEvent, getEvents, registerEvent, unregisterEvent, updateEvent } from "../../services/bookingService";
import "./BookingFeature.css";
import "./Events.css";

const EVENT_TYPES = [
  { key: "local_department", label: "Local Department Events" },
  { key: "club_community", label: "Club / Community Events" },
];

const toDatetimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Failed to read poster file"));
  reader.readAsDataURL(file);
});

const MAX_POSTER_SIZE_MB = 2;
const MAX_POSTER_SIZE_BYTES = MAX_POSTER_SIZE_MB * 1024 * 1024;

const loadImageElement = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("Invalid image file"));
  };
  image.src = objectUrl;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error("Failed to compress image"));
      return;
    }
    resolve(blob);
  }, type, quality);
});

const compressImageFile = async (file, maxBytes = MAX_POSTER_SIZE_BYTES) => {
  if (file.size <= maxBytes) {
    return file;
  }

  const image = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not supported in this browser");
  }

  const maxDimension = 1600;
  const widthScale = maxDimension / image.width;
  const heightScale = maxDimension / image.height;
  const scale = Math.min(1, widthScale, heightScale);
  canvas.width = Math.max(1, Math.floor(image.width * scale));
  canvas.height = Math.max(1, Math.floor(image.height * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  let quality = 0.85;
  let outputBlob = await canvasToBlob(canvas, mimeType, quality);

  while (outputBlob.size > maxBytes && quality > 0.4) {
    quality -= 0.1;
    outputBlob = await canvasToBlob(canvas, mimeType, quality);
  }

  if (outputBlob.size > maxBytes) {
    throw new Error(`Poster must be ${MAX_POSTER_SIZE_MB}MB or smaller after compression`);
  }

  const extension = mimeType === "image/png" ? "png" : "jpg";
  const baseName = String(file.name || "poster").replace(/\.[^.]+$/, "");
  return new File([outputBlob], `${baseName}-compressed.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
};

export default function Events() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const role = String(user?.role || "student").toLowerCase();
  const isStudent = role === "student";
  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";
  const canCreate = isFaculty || isAdmin;

  const dashboardPath = role === "admin" ? "/admin/dashboard" : role === "faculty" ? "/faculty/dashboard" : "/student/dashboard";

  const [eventType, setEventType] = useState("local_department");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [posterUploadMessage, setPosterUploadMessage] = useState("");
  const [posterUploadMessageType, setPosterUploadMessageType] = useState("info");
  const [form, setForm] = useState({
    eventType: isFaculty ? "local_department" : "local_department",
    eventName: "",
    venue: "",
    eventDateTime: "",
    department: user?.department || "",
    maxParticipants: 30,
    posterUrl: "",
    posterFile: null,
    posterFileName: "",
    posterFileBase64: "",
  });

  const canManageEvent = (row) => {
    if (isAdmin) return true;
    return isFaculty && row?.eventType === "local_department" && Number(row?.createdBy || 0) === Number(user?.id || 0);
  };

  const loadEvents = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getEvents(token, {
        eventType,
        search,
        date: dateFilter,
      });
      setRows(Array.isArray(response?.events) ? response.events : []);
    } catch (error) {
      alert(error?.message || "Failed to load events");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [token, eventType, dateFilter]);

  const displayedRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      return (
        String(row.ticket).toLowerCase().includes(q) ||
        String(row.eventName).toLowerCase().includes(q) ||
        String(row.venue).toLowerCase().includes(q) ||
        String(row.department).toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const resetForm = () => {
    setPosterUploadMessage("");
    setPosterUploadMessageType("info");
    setForm({
      eventType: isFaculty ? "local_department" : "local_department",
      eventName: "",
      venue: "",
      eventDateTime: "",
      department: user?.department || "",
      maxParticipants: 30,
      posterUrl: "",
      posterFile: null,
      posterFileName: "",
      posterFileBase64: "",
    });
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (row) => {
    setEditingEventId(row.id);
    setPosterUploadMessage("");
    setPosterUploadMessageType("info");
    setForm({
      eventType: row.eventType,
      eventName: row.eventName || "",
      venue: row.venue || "",
      eventDateTime: row.eventDateTime ? String(row.eventDateTime).slice(0, 16) : "",
      department: row.department || user?.department || "",
      maxParticipants: row.maxParticipants || 30,
      posterUrl: row.posterUrl || "",
      posterFile: null,
      posterFileName: "",
      posterFileBase64: "",
    });
    setShowModal(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      if (!form.eventName.trim() || !form.venue.trim() || !form.eventDateTime) {
        alert("Event name, venue and date-time are required");
        return;
      }

      const payload = {
        eventType: isFaculty ? "local_department" : form.eventType,
        eventName: form.eventName.trim(),
        venue: form.venue.trim(),
        eventDateTime: form.eventDateTime,
        department: form.department.trim(),
        maxParticipants: Number(form.maxParticipants || 0),
        posterUrl: form.posterUrl.trim(),
        fileName: form.posterFileName || undefined,
        mimeType: form.posterFile?.type || undefined,
        fileBase64: form.posterFileBase64 || undefined,
      };

      if (editingEventId) {
        await updateEvent(editingEventId, payload, token);
      } else {
        await createEvent(payload, token);
      }

      setShowModal(false);
      setEditingEventId(null);
      resetForm();
      await loadEvents();
    } catch (error) {
      alert(error?.message || "Failed to save event");
    }
  };

  const handleDelete = async (eventId) => {
    try {
      if (!window.confirm("Delete this event and all registrations?")) {
        return;
      }
      await deleteEvent(eventId, token);
      await loadEvents();
    } catch (error) {
      alert(error?.message || "Failed to delete event");
    }
  };

  const onPosterFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setPosterUploadMessage("");
      setPosterUploadMessageType("info");
      setForm((prev) => ({ ...prev, posterFile: null, posterFileName: "", posterFileBase64: "" }));
      return;
    }

    if (!String(file.type || "").startsWith("image/")) {
      setPosterUploadMessage("Please select an image file for poster");
      setPosterUploadMessageType("error");
      event.target.value = "";
      return;
    }

    try {
      const optimizedFile = await compressImageFile(file);
      const encoded = await fileToBase64(optimizedFile);
      setForm((prev) => ({
        ...prev,
        posterFile: optimizedFile,
        posterFileName: optimizedFile.name,
        posterFileBase64: encoded,
      }));

      if (optimizedFile.size !== file.size) {
        const originalMb = (file.size / (1024 * 1024)).toFixed(2);
        const compressedMb = (optimizedFile.size / (1024 * 1024)).toFixed(2);
        setPosterUploadMessage(`Poster compressed from ${originalMb}MB to ${compressedMb}MB`);
        setPosterUploadMessageType("info");
      } else {
        const selectedMb = (optimizedFile.size / (1024 * 1024)).toFixed(2);
        setPosterUploadMessage(`Selected poster size: ${selectedMb}MB`);
        setPosterUploadMessageType("success");
      }
    } catch (error) {
      setPosterUploadMessage(error?.message || "Failed to process poster file");
      setPosterUploadMessageType("error");
      event.target.value = "";
    }
  };

  const handleRegister = async (eventId, alreadyRegistered) => {
    try {
      if (alreadyRegistered) {
        await unregisterEvent(eventId, token);
      } else {
        await registerEvent(eventId, token);
      }
      await loadEvents();
    } catch (error) {
      alert(error?.message || "Failed to update registration");
    }
  };

  return (
    <div className="booking-feature-page event-feature-page max-w-[1450px] mx-auto animate-fadeIn">
      <button type="button" className="feature-back-btn" onClick={() => navigate(dashboardPath)}>
        <FaArrowLeft /> Back
      </button>

      <section className="booking-feature-card">
        <header className="booking-feature-toolbar event-feature-toolbar">
          <h1 className="booking-feature-title">Event List & Registrations</h1>

          <div className="booking-feature-toolbar-right event-toolbar-right">
            <input
              type="date"
              className="booking-feature-input"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />

            <div className="booking-feature-search-wrap">
              <FaSearch className="booking-feature-search-icon" />
              <input
                className="booking-feature-input booking-feature-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
              />
            </div>

            {canCreate ? (
              <button className="booking-feature-btn" type="button" onClick={openCreateModal}>
                <FaPlus /> Create Event
              </button>
            ) : null}
          </div>
        </header>

        <div className="event-type-tabs">
          {EVENT_TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`event-type-tab ${eventType === item.key ? "active" : ""}`}
              onClick={() => setEventType(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="booking-feature-table-wrap">
          <table className="booking-feature-table event-feature-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Event Name</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Dept.</th>
                <th>Poster</th>
                <th>Max.</th>
                <th>Reg.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="booking-feature-empty">
                    {loading ? "Loading events..." : "No data available"}
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => {
                  const isFull = Number(row.vacancy || 0) <= 0;
                  const status = row.isRegistered ? "Registered" : isFull ? "Full" : "Open";

                  return (
                    <tr key={row.id}>
                      <td>{row.ticket}</td>
                      <td>
                        <button type="button" className="event-name-link" onClick={() => setSelectedEvent(row)}>
                          {row.eventName}
                        </button>
                      </td>
                      <td>{row.venue}</td>
                      <td>{formatDate(row.eventDateTime)}</td>
                      <td>{formatTime(row.eventDateTime)}</td>
                      <td>{row.department || "-"}</td>
                      <td>
                        {row.posterUrl ? (
                          <a className="event-poster-link" href={row.posterUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{row.maxParticipants}</td>
                      <td>{row.registeredCount}</td>
                      <td>
                        <span className={`booking-status-pill ${status.toLowerCase()}`}>{status}</span>
                      </td>
                      <td>
                        {isStudent ? (
                          row.isRegistered ? (
                            <button
                              type="button"
                              className="booking-feature-row-action"
                              onClick={() => handleRegister(row.id, true)}
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="booking-feature-row-action"
                              onClick={() => handleRegister(row.id, false)}
                              disabled={isFull}
                            >
                              {isFull ? "Closed" : "Register"}
                            </button>
                          )
                        ) : canManageEvent(row) ? (
                          <div className="event-action-group">
                            <button
                              type="button"
                              className="booking-feature-row-action"
                              onClick={() => openEditModal(row)}
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              type="button"
                              className="booking-feature-row-action"
                              onClick={() => handleDelete(row.id)}
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">View</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal ? (
        <div className="booking-feature-modal-backdrop">
          <div className="booking-feature-modal">
            <div className="booking-feature-modal-head">
              <h3>Create Event</h3>
              <button type="button" className="booking-feature-close" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form className="booking-feature-form" onSubmit={handleCreate}>
              <label>
                Event Type
                <select
                  className="booking-feature-select"
                  value={isFaculty ? "local_department" : form.eventType}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventType: event.target.value }))}
                  disabled={isFaculty}
                >
                  <option value="local_department">Local Department</option>
                  <option value="club_community">Club / Community</option>
                </select>
              </label>

              <label>
                Max Participants
                <input
                  type="number"
                  min={1}
                  className="booking-feature-input"
                  value={form.maxParticipants}
                  onChange={(event) => setForm((prev) => ({ ...prev, maxParticipants: event.target.value }))}
                />
              </label>

              <label>
                Event Name
                <input
                  className="booking-feature-input"
                  value={form.eventName}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventName: event.target.value }))}
                />
              </label>

              <label>
                Venue
                <input
                  className="booking-feature-input"
                  value={form.venue}
                  onChange={(event) => setForm((prev) => ({ ...prev, venue: event.target.value }))}
                />
              </label>

              <label>
                Date & Time
                <input
                  type="datetime-local"
                  className="booking-feature-input"
                  value={toDatetimeLocal(form.eventDateTime)}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventDateTime: event.target.value }))}
                />
              </label>

              <label>
                Department / Unit
                <input
                  className="booking-feature-input"
                  value={isFaculty ? (user?.department || "") : form.department}
                  onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                  disabled={isFaculty}
                />
              </label>

              <label className="full-width">
                Poster URL (optional)
                <input
                  className="booking-feature-input"
                  value={form.posterUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, posterUrl: event.target.value }))}
                />
              </label>

              <label className="full-width">
                Poster Upload (optional)
                <input
                  className="booking-feature-input"
                  type="file"
                  accept="image/*"
                  onChange={onPosterFileChange}
                />
                {form.posterFileName ? <small>Selected: {form.posterFileName}</small> : null}
                {posterUploadMessage ? (
                  <small className={`event-upload-${posterUploadMessageType}`}>{posterUploadMessage}</small>
                ) : null}
              </label>

              <div className="booking-feature-modal-actions">
                <button type="button" className="booking-feature-muted-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="booking-feature-btn">
                  {editingEventId ? "Update Event" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedEvent ? (
        <div className="booking-feature-modal-backdrop">
          <div className="booking-feature-modal event-detail-modal">
            <div className="booking-feature-modal-head">
              <h3>Event Details</h3>
              <button type="button" className="booking-feature-close" onClick={() => setSelectedEvent(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="event-detail-body">
              {selectedEvent.posterUrl ? (
                <img src={selectedEvent.posterUrl} alt={selectedEvent.eventName} className="event-detail-poster" />
              ) : null}

              <div className="event-detail-grid">
                <div><span>Ticket</span><strong>{selectedEvent.ticket}</strong></div>
                <div><span>Type</span><strong>{selectedEvent.eventType === "club_community" ? "Club / Community" : "Local Department"}</strong></div>
                <div><span>Event Name</span><strong>{selectedEvent.eventName}</strong></div>
                <div><span>Venue</span><strong>{selectedEvent.venue}</strong></div>
                <div><span>Date</span><strong>{formatDate(selectedEvent.eventDateTime)}</strong></div>
                <div><span>Time</span><strong>{formatTime(selectedEvent.eventDateTime)}</strong></div>
                <div><span>Department / Unit</span><strong>{selectedEvent.department || "-"}</strong></div>
                <div><span>Capacity</span><strong>{selectedEvent.registeredCount}/{selectedEvent.maxParticipants}</strong></div>
                <div><span>Created By</span><strong>{selectedEvent.createdByName || "-"}</strong></div>
                <div><span>Role</span><strong>{selectedEvent.createdByRole || "-"}</strong></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
