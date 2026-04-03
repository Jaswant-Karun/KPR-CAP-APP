import { useEffect, useMemo, useState } from "react";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaBan,
  FaCheck,
  FaEye,
  FaInfoCircle,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  createHostelPermissionRequest,
  getHostelPermissionRequests,
  updateHostelPermissionStatus,
} from "../../services/bookingService";
import "./HostelStayPermissionPage.css";

const STATUS_OPTIONS = ["all", "open", "approved", "rejected"];

const emptyForm = {
  room: "",
  date: "",
  reason: "",
};

const normalizeRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  if (role === "students") return "student";
  if (["faculties", "faculty-member", "faculty_member", "teacher", "cfac"].includes(role)) {
    return "faculty";
  }
  return role || "student";
};

const statusClassName = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  return "pending";
};

const statusLabel = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "open") return "Pending";
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function HostelStayPermissionPage() {
  const { user, token } = useAuth();
  const role = normalizeRole(user?.role);
  const isStudent = role === "student";
  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [selected, setSelected] = useState(null);
  const [facultyRemark, setFacultyRemark] = useState("");

  const loadRows = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await getHostelPermissionRequests(token, { status: statusFilter });
      setRows(Array.isArray(response?.requests) ? response.requests : []);
    } catch (error) {
      setMessage(error?.message || "Failed to load hostel stay permission records");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((item) => {
      const ticket = String(item.id || "").toLowerCase();
      const createdByName = String(item.createdByName || "").toLowerCase();
      const room = String(item.metadata?.room || "").toLowerCase();
      const reason = String(item.description || "").toLowerCase();
      return ticket.includes(query) || createdByName.includes(query) || room.includes(query) || reason.includes(query);
    });
  }, [rows, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, rows.length]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedRows = filteredRows.slice(pageStart, pageEnd);
  const pageFrom = totalItems === 0 ? 0 : pageStart + 1;
  const pageTo = totalItems === 0 ? 0 : Math.min(pageEnd, totalItems);

  const openView = (row) => {
    setSelected(row);
    setFacultyRemark(String(row?.remarks || ""));
    setShowViewModal(true);
  };

  const closeView = () => {
    setSelected(null);
    setFacultyRemark("");
    setShowViewModal(false);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!form.room.trim() || !form.date || !form.reason.trim()) {
      setMessage("Room, Date and reason are required");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await createHostelPermissionRequest({
        title: `Hostel Stay Permission - ${form.room.trim()}`,
        description: form.reason.trim(),
        metadata: {
          room: form.room.trim(),
          date: form.date,
        },
      }, token);
      setMessage("Hostel stay permission submitted");
      setMessageType("success");
      setForm(emptyForm);
      setShowCreateModal(false);
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to submit hostel stay permission");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const canFacultyReview = isFaculty && String(selected?.status || "").toLowerCase() === "open";

  const submitStatus = async (status) => {
    if (!selected?.id) return;
    setLoading(true);
    setMessage("");
    try {
      await updateHostelPermissionStatus(selected.id, {
        status,
        remarks: facultyRemark.trim(),
      }, token);
      setMessage(`Hostel stay permission ${status}`);
      setMessageType("success");
      closeView();
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to update status");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hsp-page">
      <header className="hsp-header">
        <h1>Hostel Stay Permission</h1>

        <div className="hsp-header-actions">
          <label className="hsp-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
            />
          </label>

          <button type="button" className="hsp-icon-btn" onClick={loadRows} title="Refresh">
            <FaSyncAlt />
          </button>

          {isStudent ? (
            <button type="button" className="hsp-icon-btn hsp-primary" onClick={() => setShowCreateModal(true)} title="Add">
              <FaPlus />
            </button>
          ) : null}
        </div>
      </header>

      <div className="hsp-warning">
        <FaInfoCircle />
        <div>
          <strong>Only for Hostel Students</strong>
          <p>Those who wish to stay in the hostel during working hours must request permission here. Approval is required from a mentor only.</p>
        </div>
      </div>

      <section className="hsp-table-wrap">
        <table className="hsp-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>User</th>
              <th>Room</th>
              <th>Date</th>
              <th>Reason in Detail</th>
              <th>Applied At</th>
              <th>Status</th>
              <th>Actions</th>
              <th className="hsp-col-check">
                <input type="checkbox" aria-label="Select all rows" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="hsp-empty">Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={9} className="hsp-empty">No data available</td></tr>
            ) : (
              pagedRows.map((item) => {
                const displayStatus = String(item.status || "open").toLowerCase();
                const badgeStatus = displayStatus === "open" ? "pending" : displayStatus;
                return (
                  <tr key={item.id}>
                    <td>HSP-{String(item.id).padStart(4, "0")}</td>
                    <td>{item.createdByName || "-"}</td>
                    <td>{item.metadata?.room || "-"}</td>
                    <td>{item.metadata?.date || "-"}</td>
                    <td>{item.description || "-"}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td><span className={`hsp-status ${statusClassName(badgeStatus)}`}>{statusLabel(displayStatus)}</span></td>
                    <td>
                      <button type="button" className="hsp-icon-btn" onClick={() => openView(item)}>
                        <FaEye />
                      </button>
                    </td>
                    <td><input type="checkbox" aria-label={`Select stay permission ${item.id}`} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="hsp-card-list" aria-live="polite">
        {loading ? (
          <article className="hsp-card hsp-card-empty">Loading...</article>
        ) : filteredRows.length === 0 ? (
          <article className="hsp-card hsp-card-empty">No data available</article>
        ) : (
          pagedRows.map((item) => {
            const displayStatus = String(item.status || "open").toLowerCase();
            const badgeStatus = displayStatus === "open" ? "pending" : displayStatus;
            return (
              <article key={`card-${item.id}`} className="hsp-card">
                <div className="hsp-card-top">
                  <strong>HSP-{String(item.id).padStart(4, "0")}</strong>
                  <span className={`hsp-status ${statusClassName(badgeStatus)}`}>{statusLabel(displayStatus)}</span>
                </div>

                <div className="hsp-card-body">
                  <p>
                    <span>User</span>
                    <strong>{item.createdByName || "-"}</strong>
                  </p>
                  <p>
                    <span>Room</span>
                    <strong>{item.metadata?.room || "-"}</strong>
                  </p>
                  <p>
                    <span>Date</span>
                    <strong>{item.metadata?.date || "-"}</strong>
                  </p>
                  <p>
                    <span>Reason in Detail</span>
                    <strong>{item.description || "-"}</strong>
                  </p>
                  <p>
                    <span>Applied At</span>
                    <strong>{formatDateTime(item.createdAt)}</strong>
                  </p>
                </div>

                <div className="hsp-card-actions">
                  <button type="button" className="hsp-icon-btn" onClick={() => openView(item)} title="View details">
                    <FaEye />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <footer className="hsp-footer">
        <div className="hsp-page-size">
          <span>Items per page:</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) || 10)}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="hsp-page-count">{pageFrom}-{pageTo} of {totalItems}</div>

        <div className="hsp-page-controls">
          <button type="button" onClick={() => setPage(1)} disabled={currentPage <= 1} aria-label="First page">
            <FaAngleDoubleLeft />
          </button>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} aria-label="Previous page">
            <FaAngleLeft />
          </button>
          <span>{currentPage}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} aria-label="Next page">
            <FaAngleRight />
          </button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} aria-label="Last page">
            <FaAngleDoubleRight />
          </button>
        </div>
      </footer>

      {showCreateModal ? (
        <div className="hsp-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="hsp-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>New Hostel Stay Permission</h2>
              <button type="button" className="hsp-icon-btn" onClick={() => setShowCreateModal(false)}><FaTimes /></button>
            </header>

            <form className="hsp-form" onSubmit={submitCreate}>
              <label>
                Room
                <input
                  type="text"
                  required
                  value={form.room}
                  onChange={(event) => setForm((prev) => ({ ...prev, room: event.target.value }))}
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                />
              </label>
              <label className="full-width">
                Reason
                <textarea
                  rows={4}
                  required
                  value={form.reason}
                  onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                />
              </label>
              <div className="hsp-form-actions">
                <button type="button" className="hsp-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="hsp-btn hsp-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showViewModal && selected ? (
        <div className="hsp-modal-backdrop" onClick={closeView}>
          <div className="hsp-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>Hostel Stay Permission</h2>
              <button type="button" className="hsp-icon-btn" onClick={closeView}><FaTimes /></button>
            </header>

            <div className="hsp-details">
              <p><strong>Ticket:</strong> HSP-{String(selected.id).padStart(4, "0")}</p>
              <p><strong>User:</strong> {selected.createdByName || "-"}</p>
              <p><strong>Room:</strong> {selected.metadata?.room || "-"}</p>
              <p><strong>Date:</strong> {selected.metadata?.date || "-"}</p>
              <p><strong>Reason:</strong> {selected.description || "-"}</p>
            </div>

            <label className="hsp-remark">
              Faculty Remark
              <textarea
                rows={3}
                value={facultyRemark}
                onChange={(event) => setFacultyRemark(event.target.value)}
                disabled={!isFaculty}
              />
            </label>

            {canFacultyReview ? (
              <div className="hsp-review-actions">
                <button type="button" className="hsp-btn hsp-danger" onClick={() => submitStatus("rejected")}><FaBan /> Reject</button>
                <button type="button" className="hsp-btn hsp-primary" onClick={() => submitStatus("approved")}><FaCheck /> Approve</button>
              </div>
            ) : null}

            {isAdmin ? <small className="hsp-note">Admin has view-only access for hostel stay permission requests.</small> : null}
          </div>
        </div>
      ) : null}

      {message ? <div className={`hsp-msg ${messageType}`}>{message}</div> : null}
    </div>
  );
}
