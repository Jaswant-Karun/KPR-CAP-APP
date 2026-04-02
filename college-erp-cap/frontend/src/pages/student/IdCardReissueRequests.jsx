import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaFilter, FaIdCard, FaSearch, FaUserShield } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  acceptIdCardReissueRequest,
  createServiceRequest,
  escalateIdCardReissueRequest,
  getServiceRequests,
} from "../../services/bookingService";
import "./IdCardReissueRequests.css";

const CATEGORY = "idcard-reissue";
const STATUS_OPTIONS = ["all", "open", "pending", "approved", "rejected", "resolved", "escalated"];
const REQUEST_TYPES = ["ID Card Correction", "Photo Update", "Full Reissue", "Accessories Reissue"];
const SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor mistake (faculty can handle)" },
  { value: "major", label: "Major issue/full reissue (admin handles)" },
];

const ROLE_MESSAGE = {
  student: "Submit ID card/accessories reissue requisitions to faculty/admin.",
  faculty: "Faculty can accept minor mistakes; major and full/photo issues must be handled by admin.",
  admin: "Admin can review and accept both minor and major ID card requisitions.",
};

const parseMeta = (item) => {
  const metadata = item?.metadata && typeof item.metadata === "object" ? item.metadata : {};
  return {
    entryType: metadata.entryType || "requisition",
    requestType: metadata.requestType || "ID Card Correction",
    issueSeverity: metadata.issueSeverity || "minor",
    accessoryType: metadata.accessoryType || "-",
    studentName: metadata.studentName || item.createdByName || "-",
    studentRollNo: metadata.studentRollNo || item.createdByRollNo || "-",
    handledByRole: metadata.handledByRole || null,
    handledByName: metadata.handledByName || null,
    handledAt: metadata.handledAt || null,
    escalatedToAdmin: Boolean(metadata.escalatedToAdmin),
    escalatedByName: metadata.escalatedByName || null,
    escalatedAt: metadata.escalatedAt || null,
  };
};

const statusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["open", "pending", "in-progress"].includes(normalized)) return "Pending";
  if (["approved", "resolved"].includes(normalized)) return "Accepted";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const statusTone = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["open", "pending", "in-progress"].includes(normalized)) return "pending";
  if (["approved", "resolved"].includes(normalized)) return "accepted";
  if (normalized === "rejected") return "rejected";
  return "pending";
};

const defaultForm = {
  requestType: REQUEST_TYPES[0],
  issueSeverity: "minor",
  accessoryType: "",
  details: "",
};

export default function IdCardReissueRequests() {
  const { user, token } = useAuth();
  const role = String(user?.role || "student").toLowerCase();
  const isStudent = role === "student";
  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");

  const loadRequests = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getServiceRequests(token, { category: CATEGORY });
      setRows(Array.isArray(response?.requests) ? response.requests : []);
    } catch (error) {
      setMessage(error?.message || "Failed to fetch ID card requests");
      setMessageTone("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token]);

  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (statusFilter === "escalated") {
      data = data.filter((item) => parseMeta(item).escalatedToAdmin);
    } else if (statusFilter !== "all") {
      data = data.filter((item) => String(item.status || "").toLowerCase() === statusFilter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      data = data.filter((item) => {
        const meta = parseMeta(item);
        return [
          item.title,
          item.description,
          item.createdByName,
          meta.studentName,
          meta.studentRollNo,
          meta.requestType,
          meta.issueSeverity,
          meta.accessoryType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
    }

    return data;
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const pending = rows.filter((item) => ["open", "pending", "in-progress"].includes(String(item.status || "").toLowerCase())).length;
    const acceptedByFaculty = rows.filter((item) => parseMeta(item).handledByRole === "faculty").length;
    const acceptedByAdmin = rows.filter((item) => parseMeta(item).handledByRole === "admin").length;
    const escalated = rows.filter((item) => parseMeta(item).escalatedToAdmin).length;
    return { pending, acceptedByFaculty, acceptedByAdmin, escalated };
  }, [rows]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await createServiceRequest(
        {
          title: `ID Reissue - ${form.requestType}`,
          category: CATEGORY,
          description: form.details,
          metadata: {
            entryType: "requisition",
            requestType: form.requestType,
            issueSeverity: form.issueSeverity,
            accessoryType: form.accessoryType || "-",
            studentName: user?.name || "Student",
            studentRollNo: user?.rollNo || "-",
          },
        },
        token
      );

      setForm(defaultForm);
      setShowForm(false);
      setMessage("ID card/accessories requisition submitted.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to submit request");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const acceptRequest = async (item) => {
    if (!isFaculty && !isAdmin) return;

    const meta = parseMeta(item);
    const isMinor = String(meta.issueSeverity || "").toLowerCase() === "minor";
    if (isFaculty && !isMinor) {
      setMessage("Faculty can accept only minor mistakes. Escalate major/photo/full reissue to admin.");
      setMessageTone("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await acceptIdCardReissueRequest(
        item.id,
        {
          remarks: isFaculty ? "Handled by faculty (minor correction)." : "Handled by admin.",
          resolution: {
            decision: "accepted",
            handler: role,
          },
        },
        token
      );
      setMessage(`${isFaculty ? "Faculty" : "Admin"} accepted the requisition.`);
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to accept request");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const escalateRequest = async (item) => {
    if (!isFaculty) return;

    setSubmitting(true);
    setMessage("");

    try {
      await escalateIdCardReissueRequest(
        item.id,
        {
          remarks: "Escalated by faculty: needs admin control (major/photo/full reissue).",
        },
        token
      );

      setMessage("Requisition escalated to admin.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to escalate request");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const actionState = (item) => {
    const normalized = String(item.status || "").toLowerCase();
    const finalized = ["approved", "resolved", "rejected"].includes(normalized);
    if (finalized) {
      return { disabled: true, label: "Finalized", title: "This requisition is already finalized" };
    }

    const meta = parseMeta(item);
    const isMinor = String(meta.issueSeverity || "").toLowerCase() === "minor";

    if (isAdmin) {
      return { disabled: false, label: "Accept (Admin)", title: "Admin can accept this requisition" };
    }

    if (isFaculty && !isMinor) {
      return {
        disabled: true,
        label: "Admin Required",
        title: "Major/photo/full reissue must be accepted by admin",
      };
    }

    return {
      disabled: false,
      label: "Accept (Faculty)",
      title: "Faculty can accept minor mistakes",
    };
  };

  return (
    <div className="id-reissue-page">
      <section className="id-reissue-hero">
        <div>
          <h1>ID Card & Accessories Reissue Requests</h1>
          <p>{ROLE_MESSAGE[role] || ROLE_MESSAGE.student}</p>
        </div>

        <div className="id-reissue-hero-stats">
          <article>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </article>
          <article>
            <span>Faculty Accepted</span>
            <strong>{summary.acceptedByFaculty}</strong>
          </article>
          <article>
            <span>Admin Accepted</span>
            <strong>{summary.acceptedByAdmin}</strong>
          </article>
          <article>
            <span>Escalated</span>
            <strong>{summary.escalated}</strong>
          </article>
        </div>
      </section>

      <section className="id-reissue-actions">
        {isStudent ? (
          <button type="button" className="id-reissue-btn primary" onClick={() => setShowForm((prev) => !prev)}>
            <FaIdCard /> New Requisition
          </button>
        ) : (
          <div className="id-reissue-role-tag">
            <FaUserShield /> Approval Mode
          </div>
        )}
      </section>

      {showForm && isStudent && (
        <form className="id-reissue-form" onSubmit={submitRequest}>
          <h3>Student Requisition</h3>

          <label>
            Request Type
            <select
              value={form.requestType}
              onChange={(event) => setForm((prev) => ({ ...prev, requestType: event.target.value }))}
            >
              {REQUEST_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Issue Severity
            <select
              value={form.issueSeverity}
              onChange={(event) => setForm((prev) => ({ ...prev, issueSeverity: event.target.value }))}
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Accessories (if any)
            <input
              type="text"
              value={form.accessoryType}
              onChange={(event) => setForm((prev) => ({ ...prev, accessoryType: event.target.value }))}
              placeholder="lanyard / holder / clip / none"
            />
          </label>

          <label>
            Request Details
            <textarea
              rows="4"
              required
              value={form.details}
              onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
              placeholder="Explain what is wrong and what correction/reissue is needed"
            />
          </label>

          <div className="id-reissue-form-actions">
            <button type="submit" className="id-reissue-btn primary" disabled={submitting}>
              Submit Requisition
            </button>
          </div>
        </form>
      )}

      <section className="id-reissue-table-card">
        <div className="id-reissue-toolbar">
          <label className="id-reissue-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search student, request type, accessory"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="id-reissue-filter">
            <FaFilter />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? "All Status"
                    : option === "escalated"
                      ? "Escalated Only"
                      : statusLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message && <div className={`id-reissue-message ${messageTone}`}>{message}</div>}

        <div className="id-reissue-table-wrap">
          {loading ? (
            <div className="id-reissue-empty">Loading requests...</div>
          ) : filteredRows.length === 0 ? (
            <div className="id-reissue-empty">No requests found</div>
          ) : (
            <table className="id-reissue-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>Student</th>
                  <th>Request Type</th>
                  <th>Severity</th>
                  <th>Accessories</th>
                  <th>Details</th>
                  <th>Handled By</th>
                  <th>Escalation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item) => {
                  const meta = parseMeta(item);
                  const controls = actionState(item);
                  return (
                    <tr key={item.id}>
                      <td>IDR-{String(item.id).padStart(4, "0")}</td>
                      <td>
                        <span className={`id-reissue-status ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                      </td>
                      <td>
                        <strong>{meta.studentName}</strong>
                        <span>{meta.studentRollNo}</span>
                      </td>
                      <td>{meta.requestType}</td>
                      <td>
                        <span className={`id-reissue-severity ${meta.issueSeverity === "minor" ? "minor" : "major"}`}>
                          {meta.issueSeverity === "minor" ? "Minor" : "Major"}
                        </span>
                      </td>
                      <td>{meta.accessoryType || "-"}</td>
                      <td>{item.description || "-"}</td>
                      <td>
                        {meta.handledByRole ? `${meta.handledByRole} (${meta.handledByName || "-"})` : "Pending"}
                        {meta.handledAt ? <span>{new Date(meta.handledAt).toLocaleString()}</span> : null}
                      </td>
                      <td>
                        {meta.escalatedToAdmin ? (
                          <span className="id-reissue-escalated-tag" title="Escalated to admin by faculty">
                            Escalated by {meta.escalatedByName || "faculty"}
                          </span>
                        ) : (
                          <span className="id-reissue-view-only">Not escalated</span>
                        )}
                        {meta.escalatedAt ? <span>{new Date(meta.escalatedAt).toLocaleString()}</span> : null}
                      </td>
                      <td>
                        {isFaculty || isAdmin ? (
                          <div className="id-reissue-actions-stack">
                            <button
                              type="button"
                              className="id-reissue-btn accept"
                              onClick={() => acceptRequest(item)}
                              disabled={submitting || controls.disabled}
                              title={controls.title}
                            >
                              <FaCheckCircle /> {controls.label}
                            </button>
                            {isFaculty && String(meta.issueSeverity || "").toLowerCase() !== "minor" ? (
                              <button
                                type="button"
                                className="id-reissue-btn escalate"
                                onClick={() => escalateRequest(item)}
                                disabled={submitting || meta.escalatedToAdmin || ["approved", "resolved", "rejected"].includes(String(item.status || "").toLowerCase())}
                                title={meta.escalatedToAdmin ? "Already escalated to admin" : "Escalate this requisition to admin"}
                              >
                                <FaUserShield /> {meta.escalatedToAdmin ? "Escalated" : "Escalate to Admin"}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="id-reissue-view-only">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
