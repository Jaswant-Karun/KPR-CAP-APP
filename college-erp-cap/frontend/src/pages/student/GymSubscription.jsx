import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClock, FaDumbbell, FaFilter, FaPaperPlane, FaSearch, FaShieldAlt, FaTimes, FaUserTie } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { createServiceRequest, getServiceRequests, updateServiceRequestStatus } from "../../services/bookingService";
import "./GymSubscription.css";

const CATEGORY = "gym";
const ROLE_LABELS = {
  student: "Student request portal",
  faculty: "Faculty view only",
  admin: "Admin approval console",
};

const PLAN_OPTIONS = [
  { value: "Morning Fit", label: "Morning Fit", fee: "Free access with morning slots" },
  { value: "Standard", label: "Standard", fee: "Balanced access for regular users" },
  { value: "Premium", label: "Premium", fee: "Extended hours and priority access" },
];

const DURATION_OPTIONS = ["1 Month", "3 Months", "6 Months", "Academic Year"];
const TIME_OPTIONS = ["6:00 AM - 8:00 AM", "8:00 AM - 10:00 AM", "4:00 PM - 6:00 PM", "6:00 PM - 8:00 PM"];
const STATUS_OPTIONS = ["all", "open", "pending", "approved", "resolved", "rejected"];

const STATUS_LABELS = {
  open: "Pending",
  pending: "Pending",
  approved: "Approved",
  resolved: "Approved",
  rejected: "Rejected",
  "in-progress": "Reviewing",
};

const STATUS_TONES = {
  open: "pending",
  pending: "pending",
  approved: "approved",
  resolved: "approved",
  rejected: "rejected",
  "in-progress": "reviewing",
};

const emptyForm = {
  plan: "Standard",
  duration: "3 Months",
  preferredTime: TIME_OPTIONS[0],
  notes: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

const parseMetadata = (request) => {
  const metadata = request?.metadata && typeof request.metadata === "object" ? request.metadata : {};
  return {
    plan: metadata.plan || (request?.title || "Gym Subscription").replace(/^Gym Subscription\s*-\s*/i, "") || "Standard",
    duration: metadata.duration || "3 Months",
    preferredTime: metadata.preferredTime || "Flexible",
    notes: metadata.notes || request?.description || "",
  };
};

const getDisplayStatus = (status) => STATUS_LABELS[String(status || "").toLowerCase()] || "Pending";

const getStatusTone = (status) => STATUS_TONES[String(status || "").toLowerCase()] || "pending";

export default function GymSubscription() {
  const { user, token } = useAuth();
  const role = String(user?.role || "student").toLowerCase();
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const isFaculty = role === "faculty";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [adminRemark, setAdminRemark] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const loadRequests = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getServiceRequests(token, { category: CATEGORY });
        setRequests(response?.requests || []);
      } catch (error) {
        setActionMessage(error?.message || "Failed to load gym requests");
        setMessageTone("error");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [token]);

  const filteredRequests = useMemo(() => {
    let rows = [...requests];

    if (statusFilter !== "all") {
      rows = rows.filter((item) => String(item.status || "").toLowerCase() === statusFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      rows = rows.filter((item) => {
        const meta = parseMetadata(item);
        return [
          item.title,
          item.createdByName,
          item.createdByRollNo,
          item.createdByEmail,
          item.description,
          meta.plan,
          meta.duration,
          meta.preferredTime,
          meta.notes,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
    }

    return rows;
  }, [requests, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const pending = requests.filter((item) => ["open", "pending", "in-progress"].includes(String(item.status || "").toLowerCase())).length;
    const approved = requests.filter((item) => ["approved", "resolved"].includes(String(item.status || "").toLowerCase())).length;
    const rejected = requests.filter((item) => String(item.status || "").toLowerCase() === "rejected").length;
    const myRequests = requests.filter((item) => Number(item.createdBy || 0) === Number(user?.id || 0)).length;

    return { pending, approved, rejected, myRequests };
  }, [requests, user?.id]);

  const refreshRequests = async () => {
    const response = await getServiceRequests(token, { category: CATEGORY });
    setRequests(response?.requests || []);
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setActionMessage("");

    try {
      await createServiceRequest(
        {
          title: `Gym Subscription - ${formData.plan}`,
          category: CATEGORY,
          description: `Plan: ${formData.plan}; Duration: ${formData.duration}; Preferred Time: ${formData.preferredTime}; Notes: ${formData.notes || "No additional notes"}`,
          metadata: {
            plan: formData.plan,
            duration: formData.duration,
            preferredTime: formData.preferredTime,
            notes: formData.notes,
          },
        },
        token
      );

      await refreshRequests();
      setFormOpen(false);
      setFormData(emptyForm);
      setActionMessage("Gym subscription request sent to admin.");
      setMessageTone("success");
    } catch (error) {
      setActionMessage(error?.message || "Failed to submit gym request");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    setSubmitting(true);
    setActionMessage("");

    try {
      await updateServiceRequestStatus(
        requestId,
        {
          status,
          remarks: adminRemark,
        },
        token
      );
      await refreshRequests();
      setSelectedRequest(null);
      setAdminRemark("");
      setActionMessage(`Request marked as ${getDisplayStatus(status).toLowerCase()}.`);
      setMessageTone("success");
    } catch (error) {
      setActionMessage(error?.message || "Failed to update request status");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gym-page">
      <section className="gym-hero">
        <div>
          <span className="gym-eyebrow">Common Service / Gym Subscription</span>
          <h1>Gym Subscription Control</h1>
          <p>
            Students can submit a gym membership request here. Faculty can review the list, and admin can approve or reject requests from the same dashboard.
          </p>
        </div>

        <div className="gym-role-chip">
          <FaShieldAlt />
          <span>{ROLE_LABELS[role] || ROLE_LABELS.student}</span>
        </div>
      </section>

      <section className="gym-summary-grid">
        <article className="gym-summary-card">
          <FaClock />
          <div>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
        </article>
        <article className="gym-summary-card">
          <FaCheckCircle />
          <div>
            <span>Approved</span>
            <strong>{summary.approved}</strong>
          </div>
        </article>
        <article className="gym-summary-card">
          <FaUserTie />
          <div>
            <span>My Requests</span>
            <strong>{summary.myRequests}</strong>
          </div>
        </article>
        <article className="gym-summary-card">
          <FaDumbbell />
          <div>
            <span>Rejected</span>
            <strong>{summary.rejected}</strong>
          </div>
        </article>
      </section>

      <section className="gym-content-grid">
        <div className="gym-stack">
          <article className="gym-panel gym-policy-panel">
            <div className="gym-panel-head">
              <div>
                <h2>Policy Snapshot</h2>
                <p>Simple workflow: submit, review, approve.</p>
              </div>
            </div>

            <ul className="gym-policy-list">
              <li>Student requests are forwarded to admin for approval.</li>
              <li>Faculty can view requests only and cannot change status.</li>
              <li>Admin can approve or reject each request directly from the table.</li>
            </ul>

            <div className="gym-plan-grid">
              {PLAN_OPTIONS.map((plan) => (
                <button
                  key={plan.value}
                  type="button"
                  className={`gym-plan-card ${formData.plan === plan.value ? "active" : ""}`}
                  onClick={() => setFormData((current) => ({ ...current, plan: plan.value }))}
                >
                  <span>{plan.label}</span>
                  <strong>{plan.fee}</strong>
                </button>
              ))}
            </div>

            {isStudent && (
              <button type="button" className="gym-primary-btn" onClick={() => setFormOpen(true)}>
                <FaPaperPlane /> Request Gym Membership
              </button>
            )}
          </article>

          <article className="gym-panel gym-note-panel">
            <div className="gym-panel-head">
              <div>
                <h2>Access Rules</h2>
                <p>Role-based control stays on the same page.</p>
              </div>
            </div>

            <div className="gym-rule-card">
              <strong>Students</strong>
              <span>Can request membership and track their own status.</span>
            </div>
            <div className="gym-rule-card">
              <strong>Faculty</strong>
              <span>Can view the request queue but cannot approve it.</span>
            </div>
            <div className="gym-rule-card">
              <strong>Admin</strong>
              <span>Can approve or reject the gym subscription requests.</span>
            </div>
          </article>
        </div>

        <article className="gym-panel gym-table-panel">
          <div className="gym-panel-head gym-toolbar">
            <div>
              <h2>Gym Requests</h2>
              <p>Search, filter and review all gym subscription submissions.</p>
            </div>

            <div className="gym-toolbar-actions">
              <label className="gym-search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search by student, plan, or note"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label className="gym-filter-box">
                <FaFilter />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Status" : getDisplayStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {actionMessage && <div className={`gym-alert ${messageTone}`}>{actionMessage}</div>}

          <div className="gym-table-wrap">
            {loading ? (
              <div className="gym-empty-state">Loading gym requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="gym-empty-state">
                <h3>No gym requests found</h3>
                <p>Once a student submits a request, it will appear here for review.</p>
              </div>
            ) : (
              <table className="gym-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Plan</th>
                    <th>Duration</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const meta = parseMetadata(request);
                    const statusTone = getStatusTone(request.status);

                    return (
                      <tr key={request.id} onClick={() => setSelectedRequest(request)}>
                        <td>
                          <div className="gym-person-cell">
                            <strong>{request.createdByName || "Student User"}</strong>
                            <span>{request.createdByRollNo || request.createdByEmail || `Request #${request.id}`}</span>
                          </div>
                        </td>
                        <td>{meta.plan}</td>
                        <td>{meta.duration}</td>
                        <td>{meta.preferredTime}</td>
                        <td>
                          <span className={`gym-status-pill ${statusTone}`}>{getDisplayStatus(request.status)}</span>
                        </td>
                        <td>{formatDateTime(request.createdAt)}</td>
                        <td>
                          <button type="button" className="gym-row-btn" onClick={() => setSelectedRequest(request)}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>

      {formOpen && isStudent && (
        <div className="gym-modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="gym-modal" onClick={(event) => event.stopPropagation()}>
            <div className="gym-modal-head">
              <h3>Request Gym Membership</h3>
              <button type="button" className="gym-close-btn" onClick={() => setFormOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form className="gym-form" onSubmit={handleSubmitRequest}>
              <label>
                Plan
                <select value={formData.plan} onChange={(event) => setFormData((current) => ({ ...current, plan: event.target.value }))}>
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Duration
                <select value={formData.duration} onChange={(event) => setFormData((current) => ({ ...current, duration: event.target.value }))}>
                  {DURATION_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                Preferred Time Slot
                <select value={formData.preferredTime} onChange={(event) => setFormData((current) => ({ ...current, preferredTime: event.target.value }))}>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                Notes
                <textarea
                  rows="4"
                  placeholder="Mention any fitness goals or special request"
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>

              <div className="gym-modal-actions full-width">
                <button type="button" className="gym-secondary-btn" onClick={() => setFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="gym-primary-btn" disabled={submitting}>
                  <FaPaperPlane /> {submitting ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="gym-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="gym-modal gym-details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="gym-modal-head">
              <h3>Gym Request Details</h3>
              <button type="button" className="gym-close-btn" onClick={() => setSelectedRequest(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="gym-detail-grid">
              {(() => {
                const meta = parseMetadata(selectedRequest);
                return (
                  <>
                    <div>
                      <span>Student</span>
                      <strong>{selectedRequest.createdByName || "Student User"}</strong>
                    </div>
                    <div>
                      <span>Roll No</span>
                      <strong>{selectedRequest.createdByRollNo || "-"}</strong>
                    </div>
                    <div>
                      <span>Plan</span>
                      <strong>{meta.plan}</strong>
                    </div>
                    <div>
                      <span>Duration</span>
                      <strong>{meta.duration}</strong>
                    </div>
                    <div className="full-width">
                      <span>Preferred Time</span>
                      <strong>{meta.preferredTime}</strong>
                    </div>
                    <div className="full-width">
                      <span>Notes</span>
                      <strong>{meta.notes || "No notes added"}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong className={`gym-status-pill ${getStatusTone(selectedRequest.status)}`}>
                        {getDisplayStatus(selectedRequest.status)}
                      </strong>
                    </div>
                    <div>
                      <span>Submitted</span>
                      <strong>{formatDateTime(selectedRequest.createdAt)}</strong>
                    </div>
                  </>
                );
              })()}
            </div>

            {isAdmin && (
              <div className="gym-admin-actions">
                <label className="full-width">
                  Admin Remark
                  <textarea
                    rows="3"
                    placeholder="Add an optional approval or rejection note"
                    value={adminRemark}
                    onChange={(event) => setAdminRemark(event.target.value)}
                  />
                </label>

                <div className="gym-modal-actions full-width">
                  <button type="button" className="gym-secondary-btn" onClick={() => setSelectedRequest(null)}>
                    Close
                  </button>
                  <button type="button" className="gym-danger-btn" disabled={submitting} onClick={() => handleStatusUpdate(selectedRequest.id, "rejected")}>
                    Reject
                  </button>
                  <button type="button" className="gym-primary-btn" disabled={submitting} onClick={() => handleStatusUpdate(selectedRequest.id, "approved")}>
                    Approve
                  </button>
                </div>
              </div>
            )}

            {(isFaculty || isStudent) && (
              <div className="gym-modal-actions full-width">
                <button type="button" className="gym-secondary-btn" onClick={() => setSelectedRequest(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}