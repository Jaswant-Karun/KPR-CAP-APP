import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaFilter, FaRedo, FaSearch, FaTimes, FaUserShield, FaWifi, FaPlus } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { createServiceRequest, getServiceRequests, updateServiceRequestStatus } from "../../services/bookingService";
import "./WiFiRequests.css";

const CATEGORY = "wifi-request";
const STATUS_OPTIONS = ["all", "open", "pending", "approved", "rejected", "resolved", "approved-only"];
const WIFI_PASSWORD = "123456";
const WIFI_SSID = "KPR Institutions";
const BROWSER_PASSWORD = "123456";
const BROWSER_USERNAME = "Roll No or Staff ID";

const ROLE_MESSAGE = {
  student: "Student Wi-Fi request mode: submit your MAC address and device details to admin.",
  faculty: "Faculty Wi-Fi request mode: submit staff MAC details to admin.",
  admin: "Admin control mode: review and approve or reject Wi-Fi access requests.",
};

const defaultForm = {
  requestFor: "student",
  name: "",
  identifier: "",
  phone: "",
  department: "",
  deviceName: "",
  purpose: "",
  macSegments: ["", "", "", "", "", ""],
};

const parseMeta = (item) => {
  const metadata = item?.metadata && typeof item.metadata === "object" ? item.metadata : {};
  return {
    requestFor: metadata.requestFor || item.role || "student",
    name: metadata.name || item.createdByName || "-",
    identifier: metadata.identifier || metadata.rollNo || metadata.staffId || item.createdByRollNo || "-",
    phone: metadata.phone || "-",
    department: metadata.department || item.createdByDepartment || "-",
    deviceName: metadata.deviceName || "-",
    purpose: metadata.purpose || "-",
    macAddress: metadata.macAddress || "-",
    wifiPassword: metadata.wifiPassword || WIFI_PASSWORD,
    browserUsername: metadata.browserUsername || BROWSER_USERNAME,
    browserPassword: metadata.browserPassword || BROWSER_PASSWORD,
    exist: metadata.exist || (String(item.status || "").toLowerCase() === "approved" ? "Yes" : "No"),
    approvedByName: metadata.approvedByName || null,
    approvedAt: metadata.approvedAt || null,
  };
};

const statusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["open", "pending", "in-progress"].includes(normalized)) return "Pending";
  if (["approved", "resolved"].includes(normalized)) return "Active";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const statusTone = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["open", "pending", "in-progress"].includes(normalized)) return "pending";
  if (["approved", "resolved"].includes(normalized)) return "active";
  if (normalized === "rejected") return "rejected";
  return "pending";
};

const buildMacString = (segments) => segments.map((segment) => String(segment || "").trim().toUpperCase()).join(":");

const normalizeMacSegment = (value) => String(value || "").replace(/[^a-fA-F0-9]/g, "").slice(0, 2).toUpperCase();

const formatCreatedAt = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date).toLowerCase();
  return `${datePart}, ${timePart}`;
};

export default function WiFiRequests() {
  const { user, token } = useAuth();
  const role = String(user?.role || "student").toLowerCase();
  const isStudent = role === "student";
  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [showInstructions, setShowInstructions] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalAction, setApprovalAction] = useState("approved");

  const openRequestForm = () => {
    if (isAdmin) return;

    setForm((prev) => ({
      ...defaultForm,
      requestFor: isFaculty ? "faculty" : "student",
      name: prev.name,
      identifier: prev.identifier,
      phone: prev.phone,
      department: prev.department,
      deviceName: prev.deviceName,
      purpose: prev.purpose,
      macSegments: prev.macSegments,
    }));
    setShowForm(true);
  };

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
      setMessage(error?.message || "Failed to fetch Wi-Fi requests");
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

    if (statusFilter === "approved-only") {
      data = data.filter((item) => String(item.status || "").toLowerCase() === "approved");
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
          meta.name,
          meta.identifier,
          meta.department,
          meta.deviceName,
          meta.macAddress,
          meta.purpose,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
    }

    return data;
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const pending = rows.filter((item) => ["open", "pending", "in-progress"].includes(String(item.status || "").toLowerCase())).length;
    const active = rows.filter((item) => ["approved", "resolved"].includes(String(item.status || "").toLowerCase())).length;
    const rejected = rows.filter((item) => String(item.status || "").toLowerCase() === "rejected").length;
    return { pending, active, rejected };
  }, [rows]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const macAddress = buildMacString(form.macSegments);
      if (macAddress.replace(/:/g, "").length !== 12) {
        throw new Error("Please enter a valid MAC address");
      }

      const isFacultyRequest = role === "faculty" || form.requestFor === "faculty";
      const requesterName = user?.name || form.name || (isFacultyRequest ? "Faculty" : "Student");
      const requesterIdentifier = user?.rollNo || form.identifier || "-";

      await createServiceRequest(
        {
          title: `Wi-Fi Request - ${requesterName}`,
          category: CATEGORY,
          description: form.purpose || `Wi-Fi request for ${requesterName}`,
          metadata: {
            requestFor: isFacultyRequest ? "faculty" : "student",
            name: requesterName,
            identifier: requesterIdentifier,
            phone: form.phone,
            department: form.department || user?.department || "-",
            deviceName: form.deviceName,
            purpose: form.purpose,
            macAddress,
            wifiPassword: WIFI_PASSWORD,
            browserUsername: BROWSER_USERNAME,
            browserPassword: BROWSER_PASSWORD,
            exist: "No",
          },
        },
        token
      );

      setForm(defaultForm);
      setShowForm(false);
      setMessage("Wi-Fi request submitted to admin.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to submit Wi-Fi request");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const setMacSegment = (index, value) => {
    const normalized = normalizeMacSegment(value);
    setForm((prev) => {
      const next = [...prev.macSegments];
      next[index] = normalized;
      return { ...prev, macSegments: next };
    });
  };

  const handleAdminStatus = async (item, status) => {
    if (!isAdmin) return;

    setSubmitting(true);
    setMessage("");

    try {
      await updateServiceRequestStatus(
        item.id,
        {
          status,
          remarks: status === "approved" ? "Wi-Fi request approved by admin." : "Wi-Fi request rejected by admin.",
        },
        token
      );
      setMessage(status === "approved" ? "Wi-Fi request approved and activated." : "Wi-Fi request rejected.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to update Wi-Fi request");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const openApprovalModal = (item, action) => {
    if (!isAdmin) return;
    setApprovalTarget(item);
    setApprovalAction(action);
  };

  const closeApprovalModal = () => {
    setApprovalTarget(null);
    setApprovalAction("approved");
  };

  const confirmApproval = async () => {
    if (!approvalTarget) return;
    const status = approvalAction;
    await handleAdminStatus(approvalTarget, status);
    closeApprovalModal();
  };

  return (
    <div className="wifi-page">
      <section className="wifi-hero">
        <div className="wifi-hero-copy">
          <div className="wifi-hero-kicker">Common Service</div>
          <h1>Wi-Fi Requests</h1>
          <p>{ROLE_MESSAGE[role] || ROLE_MESSAGE.student}</p>
        </div>

        <div className="wifi-hero-stats">
          <article>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </article>
          <article>
            <span>Active</span>
            <strong>{summary.active}</strong>
          </article>
          <article>
            <span>Rejected</span>
            <strong>{summary.rejected}</strong>
          </article>
        </div>
      </section>

      <section className="wifi-toolbar-card">
        <div className="wifi-toolbar-left">
          <label className="wifi-toolbar-filter">
            <FaRedo />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? "Status"
                    : option === "approved-only"
                      ? "Approved Only"
                      : statusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="wifi-toolbar-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by user, MAC, device, purpose"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="wifi-toolbar-actions">
          <button type="button" className="wifi-icon-btn" onClick={() => setShowInstructions((prev) => !prev)}>
            <FaWifi />
          </button>
          <button type="button" className="wifi-icon-btn" onClick={loadRequests}>
            <FaRedo />
          </button>
          <button
            type="button"
            className="wifi-icon-btn primary"
            onClick={openRequestForm}
            disabled={isAdmin}
            title={isAdmin ? "Admin controls Wi-Fi requests only" : "New Wi-Fi request"}
          >
            <FaPlus />
          </button>
        </div>
      </section>

      {showInstructions && (
        <section className="wifi-instructions-panel">
          <div className="wifi-instructions-head">
            <div>
              <h2>New Wi-Fi Request</h2>
              <p>Instructions</p>
            </div>
            <button type="button" className="wifi-close-btn" onClick={() => setShowInstructions(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="wifi-instructions-body">
            <p className="wifi-note">Common for all students and staffs</p>

            <section className="wifi-step-block">
              <div className="wifi-step-title">I. Steps to get Wi-Fi MAC Address</div>
              <ol>
                <li>Go to COMMAND PROMPT (cmd)</li>
                <li>
                  In the prompt, type <span className="wifi-code">getmac/v</span>
                </li>
                <li>
                  Note down the Physical address for wireless LAN adapter as the MAC address (Example : D4:AE:52:BB:5A:42)
                </li>
              </ol>
            </section>

            <section className="wifi-step-block">
              <div className="wifi-step-title">II. After the request accepted or activated, do the following two steps.</div>
              <div className="wifi-step-grid">
                <article>
                  <h3>Step 1</h3>
                  <p>Connect the Wi-Fi</p>
                  <div className="wifi-detail-row"><strong>SSID:</strong> <span>{WIFI_SSID}</span></div>
                  <div className="wifi-detail-row"><strong>Password:</strong> <span>{WIFI_PASSWORD}</span></div>
                </article>
                <article>
                  <h3>Step 2</h3>
                  <p>In Browser Login</p>
                  <div className="wifi-detail-row"><strong>Username:</strong> <span>{BROWSER_USERNAME}</span></div>
                  <div className="wifi-detail-row"><strong>Password:</strong> <span>{BROWSER_PASSWORD}</span></div>
                </article>
              </div>
            </section>
          </div>
        </section>
      )}

      {showForm && !isAdmin && (
        <div className="wifi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wifi-modal-title">
          <form className="wifi-modal-card" onSubmit={submitRequest}>
            <div className="wifi-modal-head">
              <div>
                <h2 id="wifi-modal-title">New Wi-Fi Request</h2>
                <p>Enter your device MAC address and request details</p>
              </div>
              <button type="button" className="wifi-close-btn" onClick={() => setShowForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="wifi-modal-content">
            <div className="wifi-form-grid">
              <label>
                Request For
                <select
                  value={form.requestFor}
                  onChange={(event) => setForm((prev) => ({ ...prev, requestFor: event.target.value }))}
                  disabled={role === "faculty"}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty / Staff</option>
                </select>
              </label>

              <label>
                {role === "faculty" ? "Staff ID" : "Roll No"}
                <input
                  type="text"
                  required
                  value={form.identifier}
                  onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
                  placeholder={role === "faculty" ? "Staff ID" : "24CB023"}
                />
              </label>

              <label>
                Name
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={role === "faculty" ? "Faculty name" : "Student name"}
                />
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="8754159344"
                />
              </label>

              <label>
                Department
                <input
                  type="text"
                  value={form.department}
                  onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                  placeholder="CSE / ECE / Staff"
                />
              </label>

              <label>
                Device Name
                <input
                  type="text"
                  value={form.deviceName}
                  onChange={(event) => setForm((prev) => ({ ...prev, deviceName: event.target.value }))}
                  placeholder="Laptop / Mobile / Tablet"
                />
              </label>

              <label className="wifi-form-textarea">
                Purpose
                <textarea
                  rows="3"
                  value={form.purpose}
                  onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))}
                  placeholder="Describe the Wi-Fi access requirement"
                />
              </label>
            </div>

            <div className="wifi-mac-card">
              <div className="wifi-mac-title">
                <h3>MAC Address Entry</h3>
                <span>Hexadecimal</span>
              </div>
              <div className="wifi-mac-inputs">
                {form.macSegments.map((segment, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="text"
                    maxLength={2}
                    value={segment}
                    onChange={(event) => setMacSegment(index, event.target.value)}
                    placeholder="00"
                  />
                ))}
              </div>
            </div>
            </div>

            <div className="wifi-modal-actions">
              <button type="button" className="wifi-secondary-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="wifi-primary-btn" disabled={submitting}>
                Save & Close
              </button>
            </div>
          </form>
        </div>
      )}

      {approvalTarget && isAdmin && (
        <div className="wifi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wifi-approval-title">
          <div className="wifi-confirm-card">
            <div className="wifi-modal-head">
              <div>
                <h2 id="wifi-approval-title">
                  {approvalAction === "approved" ? "Approve Wi-Fi Request" : "Reject Wi-Fi Request"}
                </h2>
                <p>
                  {approvalAction === "approved"
                    ? "This will activate college Wi-Fi access for the requester."
                    : "This will reject the Wi-Fi request and keep it inactive."}
                </p>
              </div>
              <button type="button" className="wifi-close-btn" onClick={closeApprovalModal}>
                <FaTimes />
              </button>
            </div>

            <div className="wifi-confirm-body">
              <p>
                <strong>User:</strong> {parseMeta(approvalTarget).name} ({parseMeta(approvalTarget).identifier})
              </p>
              <p>
                <strong>MAC:</strong> {parseMeta(approvalTarget).macAddress}
              </p>
            </div>

            <div className="wifi-modal-actions">
              <button type="button" className="wifi-secondary-btn" onClick={closeApprovalModal}>
                Cancel
              </button>
              <button type="button" className="wifi-primary-btn" onClick={confirmApproval} disabled={submitting}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <div className={`wifi-message ${messageTone}`}>{message}</div>}

      <section className="wifi-table-card">
        <div className="wifi-table-wrap">
          {loading ? (
            <div className="wifi-empty">Loading Wi-Fi requests...</div>
          ) : filteredRows.length === 0 ? (
            <div className="wifi-empty">No Wi-Fi requests found</div>
          ) : (
            <table className="wifi-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>User</th>
                  <th>Password</th>
                  <th>MAC</th>
                  <th>Exist</th>
                  <th>Created at</th>
                  <th>Actions</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item) => {
                  const meta = parseMeta(item);
                  const isActive = String(item.status || "").toLowerCase() === "approved";
                  return (
                    <tr key={item.id}>
                      <td>{String(item.id).padStart(4, "0")}</td>
                      <td>
                        <span className={`wifi-status ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                      </td>
                      <td>
                        <div className="wifi-user-cell">
                          <div className="wifi-user-avatar">{String(meta.name || "U").charAt(0).toUpperCase()}</div>
                          <div>
                            <strong>{meta.name}</strong>
                            <span>
                              {meta.identifier}
                              {meta.requestFor ? ` • ${meta.requestFor === "faculty" ? "Staff" : "Student"}` : ""}
                            </span>
                            <span>{meta.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="wifi-pill">{meta.wifiPassword}</span>
                      </td>
                      <td>
                        <span className="wifi-pill wifi-mac-pill">{meta.macAddress}</span>
                      </td>
                      <td>
                        <span className={`wifi-exist ${isActive ? "yes" : "no"}`}>{meta.exist}</span>
                      </td>
                      <td>{formatCreatedAt(item.createdAt)}</td>
                      <td>
                        {isAdmin ? (
                          <div className="wifi-action-stack">
                            <button
                              type="button"
                              className="wifi-action-btn approve"
                              onClick={() => openApprovalModal(item, "approved")}
                              disabled={submitting || isActive}
                            >
                              <FaCheckCircle /> Approve
                            </button>
                            <button
                              type="button"
                              className="wifi-action-btn reject"
                              onClick={() => openApprovalModal(item, "rejected")}
                              disabled={submitting || String(item.status || "").toLowerCase() === "rejected"}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="wifi-readonly">Request sent to admin</span>
                        )}
                      </td>
                      <td>
                        <input type="checkbox" aria-label={`Select request ${item.id}`} />
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
