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
  createBonafideRequest,
  getBonafideRequests,
  updateBonafideStatus,
} from "../../services/bookingService";
import "./BonafideApplicationsPage.css";

const STATUS_OPTIONS = ["all", "open", "approved", "rejected"];
const APPLY_FOR_OPTIONS = [
  "Bank Account",
  "Scholarship",
  "Passport",
  "Education Loan",
  "Internship",
  "Industrial Visit",
  "Hostel",
  "Other",
];

const emptyForm = {
  applyFor: "",
  purpose: "",
  requiredDate: "",
  additionalNote: "",
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

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const statusLabel = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "open") return "Pending";
  if (!normalized) return "-";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function BonafideApplicationsPage() {
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
    ? "Bonafide Applications"
    : isFaculty
      ? "Bonafide Approval"
      : "Bonafide View";

  const pageSubtitle = isStudent
    ? "Create bonafide requests and track faculty approval"
    : isFaculty
      ? "Approve or reject bonafide requests submitted by students"
      : "View bonafide requests across departments";

  const loadRows = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await getBonafideRequests(token, { status: statusFilter });
      const requests = Array.isArray(response?.requests) ? response.requests : [];
      setRows(requests);
    } catch (error) {
      setMessage(error?.message || "Failed to load bonafide requests");
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
      const applyFor = String(item.metadata?.applyFor || "").toLowerCase();
      return (
        ticket.includes(query) ||
        title.includes(query) ||
        createdByName.includes(query) ||
        createdByRollNo.includes(query) ||
        applyFor.includes(query)
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

    if (!form.applyFor || !form.purpose.trim() || !form.requiredDate) {
      setMessage("Apply For, Purpose, and Required Date are mandatory");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await createBonafideRequest({
        title: `Bonafide - ${form.applyFor}`,
        description: form.purpose.trim(),
        metadata: {
          applyFor: form.applyFor,
          requiredDate: form.requiredDate,
          additionalNote: form.additionalNote.trim(),
        },
      }, token);

      setMessage("Bonafide request submitted");
      setMessageType("success");
      closeCreate();
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to submit bonafide request");
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
      await updateBonafideStatus(selected.id, {
        status,
        remarks: facultyRemark.trim(),
      }, token);

      setMessage(`Bonafide request ${status}`);
      setMessageType("success");
      closeView();
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to update bonafide request");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const canFacultyReview = isFaculty && String(selected?.status || "").toLowerCase() === "open";

  return (
    <div className="bonafide-page">
      <header className="bonafide-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageSubtitle}</p>
        </div>
      </header>

      <section className="bonafide-toolbar">
        <label className="bonafide-search">
          <FaSearch />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ticket, student or apply for"
          />
        </label>

        <div className="bonafide-toolbar-actions">
          <div className="bonafide-filter-wrap">
            <button
              type="button"
              className={`bonafide-icon-btn ${statusFilter !== "all" ? "active" : ""}`}
              onClick={() => setShowStatusFilter((value) => !value)}
              title="Filter"
            >
              <FaFilter />
            </button>

            {showStatusFilter ? (
              <div className="bonafide-filter-popover">
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

          <button type="button" className="bonafide-icon-btn" onClick={loadRows} disabled={loading} title="Refresh">
            <FaSyncAlt />
          </button>

          {isStudent ? (
            <button
              type="button"
              className="bonafide-btn bonafide-btn-primary bonafide-add-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus /> New
            </button>
          ) : null}
        </div>
      </section>

      {message ? <div className={`bonafide-msg ${messageType}`}>{message}</div> : null}

      <section className="bonafide-table-wrap">
        <table className="bonafide-table">
          <thead>
            <tr>
              <th className="w-ticket">Ticket</th>
              <th className="w-status">Status</th>
              <th className="w-user">User</th>
              <th className="w-particular">Particular</th>
              <th className="w-apply">Apply For</th>
              <th className="w-date">Applied At</th>
              <th className="w-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="bonafide-empty">Loading...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="bonafide-empty">No records found</td>
              </tr>
            ) : (
              pagedRows.map((item) => {
                const displayStatus = String(item.status || "open").toLowerCase();
                const badgeStatus = displayStatus === "open" ? "pending" : displayStatus;
                return (
                  <tr key={item.id}>
                    <td>BNF-{String(item.id).padStart(4, "0")}</td>
                    <td>
                      <span className={`bonafide-status ${statusClassName(badgeStatus)}`}>
                        {statusLabel(displayStatus)}
                      </span>
                    </td>
                    <td>
                      <strong>{item.createdByName || "-"}</strong>
                      <small>{item.createdByRollNo || item.createdByEmail || "-"}</small>
                    </td>
                    <td>{item.title || "Bonafide Request"}</td>
                    <td>{item.metadata?.applyFor || "-"}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <button type="button" className="bonafide-icon-btn" onClick={() => openView(item)}>
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

      <footer className="bonafide-pagination">
        <div className="bonafide-page-size">
          <span>Items per page:</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) || 10)}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="bonafide-page-count">{pageFrom}-{pageTo} of {totalItems}</div>

        <div className="bonafide-page-controls">
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
        <div className="bonafide-modal-backdrop" onClick={closeCreate}>
          <div className="bonafide-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bonafide-modal-head">
              <h2>New Bonafide Application</h2>
              <button type="button" className="bonafide-icon-btn danger" onClick={closeCreate}>
                <FaTimes />
              </button>
            </header>

            <form className="bonafide-form" onSubmit={submitCreate}>
              <label>
                Apply For
                <select
                  required
                  value={form.applyFor}
                  onChange={(event) => setForm((prev) => ({ ...prev, applyFor: event.target.value }))}
                >
                  <option value="">Select apply for</option>
                  {APPLY_FOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Required Date
                <input
                  type="date"
                  required
                  value={form.requiredDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, requiredDate: event.target.value }))}
                />
              </label>

              <label className="full-width">
                Purpose / Particular
                <textarea
                  required
                  rows={4}
                  value={form.purpose}
                  onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))}
                  placeholder="Write why bonafide certificate is required"
                />
              </label>

              <label className="full-width">
                Additional Note
                <textarea
                  rows={3}
                  value={form.additionalNote}
                  onChange={(event) => setForm((prev) => ({ ...prev, additionalNote: event.target.value }))}
                  placeholder="Optional"
                />
              </label>

              <footer className="bonafide-form-actions">
                <button type="button" className="bonafide-btn" onClick={closeCreate}>Cancel</button>
                <button type="submit" className="bonafide-btn bonafide-btn-primary" disabled={loading}>Submit</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {showViewModal && selected ? (
        <div className="bonafide-modal-backdrop" onClick={closeView}>
          <div className="bonafide-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bonafide-modal-head">
              <h2>Bonafide Request</h2>
              <button type="button" className="bonafide-icon-btn danger" onClick={closeView}>
                <FaTimes />
              </button>
            </header>

            <div className="bonafide-details">
              <div>
                <span>Ticket</span>
                <strong>BNF-{String(selected.id).padStart(4, "0")}</strong>
              </div>
              <div>
                <span>Student</span>
                <strong>{selected.createdByName || "-"}</strong>
              </div>
              <div>
                <span>Apply For</span>
                <strong>{selected.metadata?.applyFor || "-"}</strong>
              </div>
              <div>
                <span>Required Date</span>
                <strong>{selected.metadata?.requiredDate || "-"}</strong>
              </div>
              <div className="full-width">
                <span>Purpose</span>
                <p>{selected.description || "-"}</p>
              </div>
              <div className="full-width">
                <span>Additional Note</span>
                <p>{selected.metadata?.additionalNote || "-"}</p>
              </div>
            </div>

            <div className="bonafide-review-box">
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
                <div className="bonafide-review-actions">
                  <button type="button" className="bonafide-btn bonafide-btn-danger" onClick={() => submitStatus("rejected")}>
                    <FaBan /> Reject
                  </button>
                  <button type="button" className="bonafide-btn bonafide-btn-success" onClick={() => submitStatus("approved")}>
                    <FaCheck /> Approve
                  </button>
                </div>
              ) : null}
            </div>

            {isAdmin ? (
              <small className="bonafide-admin-note">Admin has view-only access for bonafide applications.</small>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
