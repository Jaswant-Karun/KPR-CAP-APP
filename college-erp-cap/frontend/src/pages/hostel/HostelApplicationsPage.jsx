import { useEffect, useMemo, useState } from "react";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaBan,
  FaCheck,
  FaEye,
  FaFilter,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  createHostelApplicationRequest,
  getHostelApplicationRequests,
  updateHostelApplicationStatus,
} from "../../services/bookingService";
import "./HostelApplicationsPage.css";

const STATUS_OPTIONS = ["all", "open", "approved", "rejected"];
const HOSTEL_TYPE_OPTIONS = ["Boys Hostel", "Girls Hostel"];
const STAY_TYPE_OPTIONS = ["Regular", "Temporary", "Semester"];

const emptyForm = {
  hostelType: "",
  stayType: "",
  joiningDate: "",
  leavingDate: "",
  guardianName: "",
  guardianPhone: "",
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

const statusLabel = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "open") return "Pending";
  if (!normalized) return "-";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function HostelApplicationsPage() {
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
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [selected, setSelected] = useState(null);
  const [facultyRemark, setFacultyRemark] = useState("");

  const pageTitle = isStudent
    ? "Hostel Applications"
    : isFaculty
      ? "Hostel Application Approvals"
      : "Hostel Application View";

  const pageSubtitle = isStudent
    ? "Submit hostel application requests and track faculty approval"
    : isFaculty
      ? "Approve or reject student hostel application requests"
      : "View hostel application requests across departments";

  const loadRows = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await getHostelApplicationRequests(token, { status: statusFilter });
      const requests = Array.isArray(response?.requests) ? response.requests : [];
      setRows(requests);
    } catch (error) {
      setMessage(error?.message || "Failed to load hostel applications");
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
      const title = String(item.title || "").toLowerCase();
      const createdByName = String(item.createdByName || "").toLowerCase();
      const createdByRollNo = String(item.createdByRollNo || "").toLowerCase();
      const hostelType = String(item.metadata?.hostelType || "").toLowerCase();
      return (
        ticket.includes(query) ||
        title.includes(query) ||
        createdByName.includes(query) ||
        createdByRollNo.includes(query) ||
        hostelType.includes(query)
      );
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

  const closeCreate = () => {
    setForm(emptyForm);
    setShowCreateModal(false);
  };

  const submitCreate = async (event) => {
    event.preventDefault();

    if (
      !form.hostelType ||
      !form.stayType ||
      !form.joiningDate ||
      !form.guardianName.trim() ||
      !form.guardianPhone.trim() ||
      !form.reason.trim()
    ) {
      setMessage("All required hostel fields must be completed");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await createHostelApplicationRequest({
        title: `Hostel Application - ${form.hostelType}`,
        description: form.reason.trim(),
        metadata: {
          hostelType: form.hostelType,
          stayType: form.stayType,
          joiningDate: form.joiningDate,
          leavingDate: form.leavingDate,
          guardianName: form.guardianName.trim(),
          guardianPhone: form.guardianPhone.trim(),
        },
      }, token);

      setMessage("Hostel application submitted");
      setMessageType("success");
      closeCreate();
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to submit hostel application");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const submitStatus = async (status) => {
    if (!selected?.id) return;
    setLoading(true);
    setMessage("");

    try {
      await updateHostelApplicationStatus(selected.id, {
        status,
        remarks: facultyRemark.trim(),
      }, token);

      setMessage(`Hostel application ${status}`);
      setMessageType("success");
      closeView();
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to update hostel application");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const canFacultyReview = isFaculty && String(selected?.status || "").toLowerCase() === "open";

  return (
    <div className="hostel-page">
      <header className="hostel-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageSubtitle}</p>
        </div>
      </header>

      <section className="hostel-toolbar">
        <label className="hostel-search">
          <FaSearch />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ticket, student or hostel type"
          />
        </label>

        <div className="hostel-toolbar-actions">
          <div className="hostel-filter-wrap">
            <button
              type="button"
              className={`hostel-icon-btn ${statusFilter !== "all" ? "active" : ""}`}
              onClick={() => setShowStatusFilter((value) => !value)}
              title="Filter"
            >
              <FaFilter />
            </button>

            {showStatusFilter ? (
              <div className="hostel-filter-popover">
                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setShowStatusFilter(false);
                    }}
                  >
                    {STATUS_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value === "all" ? "All Status" : statusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>

          <button type="button" className="hostel-icon-btn" onClick={loadRows} disabled={loading} title="Refresh">
            <FaSyncAlt />
          </button>

          {isStudent ? (
            <button
              type="button"
              className="hostel-btn hostel-btn-primary hostel-add-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus /> New
            </button>
          ) : null}
        </div>
      </section>

      {message ? <div className={`hostel-msg ${messageType}`}>{message}</div> : null}

      <section className="hostel-table-wrap">
        <table className="hostel-table">
          <thead>
            <tr>
              <th className="w-ticket">Ticket</th>
              <th className="w-status">Status</th>
              <th className="w-user">User</th>
              <th className="w-particular">Particular</th>
              <th className="w-apply">Hostel Type</th>
              <th className="w-date">Applied At</th>
              <th className="w-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="hostel-empty">Loading...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="hostel-empty">No records found</td>
              </tr>
            ) : (
              pagedRows.map((item) => {
                const displayStatus = String(item.status || "open").toLowerCase();
                const badgeStatus = displayStatus === "open" ? "pending" : displayStatus;
                return (
                  <tr key={item.id}>
                    <td>HST-{String(item.id).padStart(4, "0")}</td>
                    <td>
                      <span className={`hostel-status ${statusClassName(badgeStatus)}`}>
                        {statusLabel(displayStatus)}
                      </span>
                    </td>
                    <td>
                      <strong>{item.createdByName || "-"}</strong>
                      <small>{item.createdByRollNo || item.createdByEmail || "-"}</small>
                    </td>
                    <td>{item.title || "Hostel Application"}</td>
                    <td>{item.metadata?.hostelType || "-"}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <button type="button" className="hostel-icon-btn" onClick={() => openView(item)}>
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="hostel-card-list" aria-live="polite">
        {loading ? (
          <article className="hostel-card hostel-card-empty">Loading...</article>
        ) : filteredRows.length === 0 ? (
          <article className="hostel-card hostel-card-empty">No records found</article>
        ) : (
          pagedRows.map((item) => {
            const displayStatus = String(item.status || "open").toLowerCase();
            const badgeStatus = displayStatus === "open" ? "pending" : displayStatus;
            return (
              <details key={`card-${item.id}`} className="hostel-dropdown-card">
                <summary className="hostel-card-top">
                  <div className="hostel-card-ticket-wrap">
                    <strong>HST-{String(item.id).padStart(4, "0")}</strong>
                    <small>{item.createdByName || "-"}</small>
                  </div>
                  <span className={`hostel-status ${statusClassName(badgeStatus)}`}>
                    {statusLabel(displayStatus)}
                  </span>
                </summary>

                <div className="hostel-card-body">
                  <p>
                    <span>User</span>
                    <strong>{item.createdByName || "-"}</strong>
                    <small>{item.createdByRollNo || item.createdByEmail || "-"}</small>
                  </p>
                  <p>
                    <span>Particular</span>
                    <strong>{item.title || "Hostel Application"}</strong>
                  </p>
                  <p>
                    <span>Hostel Type</span>
                    <strong>{item.metadata?.hostelType || "-"}</strong>
                  </p>
                  <p>
                    <span>Applied At</span>
                    <strong>{formatDateTime(item.createdAt)}</strong>
                  </p>
                </div>

                <div className="hostel-card-actions">
                  <button type="button" className="hostel-icon-btn" onClick={() => openView(item)} title="View details">
                    <FaEye />
                  </button>
                </div>
              </details>
            );
          })
        )}
      </section>

      <footer className="hostel-pagination">
        <div className="hostel-page-size">
          <span>Items per page:</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) || 10)}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="hostel-page-count">{pageFrom}-{pageTo} of {totalItems}</div>

        <div className="hostel-page-controls">
          <button type="button" onClick={() => setPage(1)} disabled={currentPage <= 1} aria-label="First page">
            <FaAngleDoubleLeft />
          </button>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} aria-label="Previous page">
            <FaAngleLeft />
          </button>
          <span>{currentPage}</span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <FaAngleRight />
          </button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} aria-label="Last page">
            <FaAngleDoubleRight />
          </button>
        </div>
      </footer>

      {showCreateModal ? (
        <div className="hostel-modal-backdrop" onClick={closeCreate}>
          <div className="hostel-modal" onClick={(event) => event.stopPropagation()}>
            <header className="hostel-modal-head">
              <h2>New Hostel Application</h2>
              <button type="button" className="hostel-icon-btn danger" onClick={closeCreate}>
                <FaTimes />
              </button>
            </header>

            <form className="hostel-form" onSubmit={submitCreate}>
              <label>
                Hostel Type
                <select
                  required
                  value={form.hostelType}
                  onChange={(event) => setForm((prev) => ({ ...prev, hostelType: event.target.value }))}
                >
                  <option value="">Select hostel type</option>
                  {HOSTEL_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Stay Type
                <select
                  required
                  value={form.stayType}
                  onChange={(event) => setForm((prev) => ({ ...prev, stayType: event.target.value }))}
                >
                  <option value="">Select stay type</option>
                  {STAY_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Joining Date
                <input
                  type="date"
                  required
                  value={form.joiningDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, joiningDate: event.target.value }))}
                />
              </label>

              <label>
                Leaving Date
                <input
                  type="date"
                  value={form.leavingDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, leavingDate: event.target.value }))}
                />
              </label>

              <label>
                Guardian Name
                <input
                  type="text"
                  required
                  value={form.guardianName}
                  onChange={(event) => setForm((prev) => ({ ...prev, guardianName: event.target.value }))}
                />
              </label>

              <label>
                Guardian Phone
                <input
                  type="text"
                  required
                  value={form.guardianPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, guardianPhone: event.target.value }))}
                />
              </label>

              <label className="full-width">
                Purpose / Reason
                <textarea
                  required
                  rows={4}
                  value={form.reason}
                  onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Explain hostel accommodation requirement"
                />
              </label>

              <footer className="hostel-form-actions">
                <button type="button" className="hostel-btn" onClick={closeCreate}>Cancel</button>
                <button type="submit" className="hostel-btn hostel-btn-primary" disabled={loading}>Submit</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {showViewModal && selected ? (
        <div className="hostel-modal-backdrop" onClick={closeView}>
          <div className="hostel-modal" onClick={(event) => event.stopPropagation()}>
            <header className="hostel-modal-head">
              <h2>Hostel Application</h2>
              <button type="button" className="hostel-icon-btn danger" onClick={closeView}>
                <FaTimes />
              </button>
            </header>

            <div className="hostel-details">
              <div>
                <span>Ticket</span>
                <strong>HST-{String(selected.id).padStart(4, "0")}</strong>
              </div>
              <div>
                <span>Student</span>
                <strong>{selected.createdByName || "-"}</strong>
              </div>
              <div>
                <span>Hostel Type</span>
                <strong>{selected.metadata?.hostelType || "-"}</strong>
              </div>
              <div>
                <span>Stay Type</span>
                <strong>{selected.metadata?.stayType || "-"}</strong>
              </div>
              <div>
                <span>Joining Date</span>
                <strong>{selected.metadata?.joiningDate || "-"}</strong>
              </div>
              <div>
                <span>Leaving Date</span>
                <strong>{selected.metadata?.leavingDate || "-"}</strong>
              </div>
              <div>
                <span>Guardian Name</span>
                <strong>{selected.metadata?.guardianName || "-"}</strong>
              </div>
              <div>
                <span>Guardian Phone</span>
                <strong>{selected.metadata?.guardianPhone || "-"}</strong>
              </div>
              <div className="full-width">
                <span>Reason</span>
                <p>{selected.description || "-"}</p>
              </div>
            </div>

            <div className="hostel-review-box">
              <label>
                Faculty Remark
                <textarea
                  rows={3}
                  value={facultyRemark}
                  onChange={(event) => setFacultyRemark(event.target.value)}
                  disabled={!isFaculty}
                  placeholder={isFaculty ? "Add optional note" : "Faculty remark"}
                />
              </label>

              {canFacultyReview ? (
                <div className="hostel-review-actions">
                  <button type="button" className="hostel-btn hostel-btn-danger" onClick={() => submitStatus("rejected")}>
                    <FaBan /> Reject
                  </button>
                  <button type="button" className="hostel-btn hostel-btn-success" onClick={() => submitStatus("approved")}>
                    <FaCheck /> Approve
                  </button>
                </div>
              ) : null}
            </div>

            {isAdmin ? (
              <small className="hostel-admin-note">Admin has view-only access for hostel applications.</small>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
