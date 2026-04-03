import { useEffect, useMemo, useState } from "react";
import { FaEye, FaPlus, FaSearch, FaTimes, FaCheck, FaBan, FaSyncAlt, FaEllipsisV, FaRedo } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  createNdcAchievement,
  deleteNdcAchievement,
  getNdcAchievementById,
  getNdcAchievements,
  updateNdcAchievementStatus,
} from "../../services/ndcAchievementService";
import "./NdcAchievementsPage.css";

const EVENT_MODE_OPTIONS = ["On Campus", "Off Campus", "Online", "Hybrid"];

const EVENT_FOR_OPTIONS = [
  "Teaching",
  "Non Teaching",
  "AO Staff",
  "Workers-Daily",
  "Workers-Monthly",
  "Transport",
  "Maintenance",
  "Principal Office",
  "CFRD",
  "Student",
  "Scholars",
  "JRF",
  "Designation Account",
  "KPRIET",
  "Visiting Faculty",
  "Others",
  "HOD",
];

const EVENT_TYPE_OPTIONS = [
  "Hackathon",
  "Workshop",
  "Conference",
  "Seminar",
  "Technical Competition",
  "Paper Presentation",
  "Project Expo",
  "Certification",
  "Internship",
  "Sports",
  "Cultural",
  "Others",
];

const EVENT_LEVEL_OPTIONS = [
  "Intra College",
  "Inter College",
  "District",
  "State",
  "National",
  "International",
  "Others",
];

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "deleted"];

const emptyForm = {
  academicYear: "",
  eventMode: "",
  eventFor: "",
  eventType: "Hackathon",
  eventLevel: "National",
  eventName: "",
  startDate: "",
  endDate: "",
  organization: "",
  location: "",
  state: "",
  sdg: "",
  outcomeDetails: "",
  hasAchievement: false,
  phone: "",
  gender: "M",
  certificateFile: null,
  certificateName: "",
  certificateBase64: "",
  certificateMimeType: "",
};

const statusClassName = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "deleted") return "deleted";
  return "pending";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return "-";
  if (!endDate) return `${startDate}`;
  return `${startDate} to ${endDate}`;
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function NdcAchievementsPage() {
  const { user, token } = useAuth();
  const role = String(user?.role || "student").toLowerCase();
  const isStudent = role === "student";
  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [facultyRemarks, setFacultyRemarks] = useState("");
  const [viewTab, setViewTab] = useState("participation");

  const pageTitle = isStudent
    ? "Participation & Achievement"
    : isFaculty
      ? "NDC Achievement Approvals"
      : "NDC Achievement View";

  const loadRows = async () => {
    try {
      setLoading(true);
      const response = await getNdcAchievements(token, {
        status: statusFilter,
        search,
        department: isAdmin ? departmentFilter : undefined,
      });
      setRows(response?.achievements || []);
      setDepartments(response?.departments || []);
      setMessage("");
    } catch (error) {
      setMessage(error?.message || "Failed to load participation records");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadRows();
  }, [token, statusFilter, departmentFilter]);

  const displayedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      const target = [
        row.ticket,
        row.name,
        row.acy,
        row.user?.fullName,
        row.user?.username,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return target.includes(q);
    });
  }, [rows, search]);

  const openView = async (row) => {
    try {
      setLoading(true);
      setSelectedRow(row);
      const response = await getNdcAchievementById(row.id, token);
      setSelectedDetail(response?.achievement || null);
      setFacultyRemarks(response?.achievement?.facultyRemarks || "");
      setViewTab("participation");
      setShowViewModal(true);
    } catch (error) {
      setMessage(error?.message || "Failed to load record details");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedDetail = async () => {
    if (!selectedRow) return;
    await openView(selectedRow);
  };

  const handleCertificateChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCreateForm((prev) => ({ ...prev, certificateFile: null, certificateName: "", certificateBase64: "", certificateMimeType: "" }));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage("Certificate file size must be <= 3 MB");
      setMessageType("error");
      return;
    }

    try {
      const fileBase64 = await toBase64(file);
      setCreateForm((prev) => ({
        ...prev,
        certificateFile: file,
        certificateName: file.name,
        certificateBase64: fileBase64,
        certificateMimeType: file.type || "application/octet-stream",
      }));
      setMessage("");
    } catch (error) {
      setMessage(error?.message || "Failed to process certificate file");
      setMessageType("error");
    }
  };

  const submitCreate = async (keepOpen = false) => {
    try {
      setLoading(true);
      const payload = {
        academicYear: createForm.academicYear,
        eventMode: createForm.eventMode,
        eventFor: createForm.eventFor,
        eventType: createForm.eventType,
        eventLevel: createForm.eventLevel,
        eventName: createForm.eventName,
        startDate: createForm.startDate,
        endDate: createForm.endDate || null,
        organization: createForm.organization,
        location: createForm.location,
        state: createForm.state,
        sdg: createForm.sdg,
        outcomeDetails: createForm.outcomeDetails,
        hasAchievement: createForm.hasAchievement,
        phone: createForm.phone,
        gender: createForm.gender,
        fileName: createForm.certificateName || undefined,
        mimeType: createForm.certificateMimeType || undefined,
        fileBase64: createForm.certificateBase64 || undefined,
      };

      await createNdcAchievement(payload, token);
      setMessage("Participation record submitted");
      setMessageType("success");
      if (keepOpen) {
        setCreateForm(emptyForm);
      } else {
        setShowCreateModal(false);
        setCreateForm(emptyForm);
      }
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to create participation record");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const submitFacultyStatus = async (status) => {
    if (!selectedDetail) return;
    try {
      setLoading(true);
      await updateNdcAchievementStatus(
        selectedDetail.id,
        {
          status,
          remarks: facultyRemarks,
        },
        token
      );
      setMessage(`Record ${status}`);
      setMessageType("success");
      setShowViewModal(false);
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to update status");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      setLoading(true);
      await deleteNdcAchievement(row.id, token);
      setMessage("Record marked as deleted");
      setMessageType("success");
      await loadRows();
    } catch (error) {
      setMessage(error?.message || "Failed to delete record");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ndc-page">
      <div className="ndc-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>
            {isStudent
              ? "Add achievements and certifications for faculty approval"
              : isFaculty
                ? "Approve or reject participation records from your department"
                : "View department-wise student participation records"}
          </p>
        </div>
        <div className="ndc-header-actions">
          {isStudent && (
            <button type="button" className="ndc-btn ndc-btn-primary" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> New Participation
            </button>
          )}
          <button type="button" className="ndc-btn" onClick={loadRows}>
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>

      {message && <div className={`ndc-msg ${messageType}`}>{message}</div>}

      <div className="ndc-toolbar">
        <label className="ndc-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by ticket, name, or user"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All status" : option}
            </option>
          ))}
        </select>

        {isAdmin && (
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="all">All departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}
      </div>

      <div className="ndc-table-wrap">
        <table className="ndc-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>User</th>
              <th>ACY</th>
              <th>Name</th>
              <th>Date</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.ticket}</td>
                <td>
                  <span className={`ndc-status ${statusClassName(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <div className="ndc-user-cell">
                    <strong>{row.user?.fullName || "Student"}</strong>
                    <small>{row.user?.username || row.user?.email || "-"}</small>
                  </div>
                </td>
                <td>{row.acy || "-"}</td>
                <td>{row.name}</td>
                <td>{formatDateRange(row.startDate, row.endDate)}</td>
                <td>{formatDateTime(row.createdAt)}</td>
                <td>
                  <div className="ndc-row-actions">
                    <button type="button" className="ndc-icon-btn" onClick={() => openView(row)}>
                      <FaEye />
                    </button>
                    <button type="button" className="ndc-icon-btn" onClick={() => openView(row)}>
                      <FaEllipsisV />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && displayedRows.length === 0 && <div className="ndc-empty">No records found</div>}
      </div>

      {showCreateModal && (
        <div className="ndc-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="ndc-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ndc-modal-head">
              <h2>New Participation</h2>
              <button type="button" className="ndc-icon-btn" onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form
              className="ndc-form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                submitCreate(false);
              }}
            >
              <label>
                Event Mode
                <select
                  className="ndc-required-field"
                  required
                  value={createForm.eventMode}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, eventMode: event.target.value }))}
                >
                  <option value="">Select event mode</option>
                  {EVENT_MODE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {createForm.eventMode ? null : <small className="ndc-required-hint">Select the value.</small>}
              </label>

              <label>
                Event For
                <select
                  className="ndc-required-field"
                  required
                  value={createForm.eventFor}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, eventFor: event.target.value }))}
                >
                  <option value="">Select event for</option>
                  {EVENT_FOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {createForm.eventFor ? null : <small className="ndc-required-hint">Select the value.</small>}
              </label>

              <label>
                Event Type
                <select
                  value={createForm.eventType}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, eventType: event.target.value }))}
                >
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Event Level
                <select
                  value={createForm.eventLevel}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, eventLevel: event.target.value }))}
                >
                  {EVENT_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Event Name | Title
                <input
                  required
                  value={createForm.eventName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, eventName: event.target.value }))}
                />
              </label>

              <label>
                Start Date
                <input
                  type="date"
                  required
                  value={createForm.startDate}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={createForm.endDate}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </label>

              <label>
                Academic Year
                <input
                  placeholder="2025"
                  value={createForm.academicYear}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, academicYear: event.target.value }))}
                />
              </label>

              <label>
                Organization
                <input
                  value={createForm.organization}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, organization: event.target.value }))}
                />
              </label>

              <label>
                Location
                <input
                  value={createForm.location}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </label>

              <label>
                State
                <input
                  value={createForm.state}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, state: event.target.value }))}
                />
              </label>

              <label>
                SDG
                <input
                  placeholder="4: Quality Education"
                  value={createForm.sdg}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, sdg: event.target.value }))}
                />
              </label>

              <label>
                Phone
                <input
                  value={createForm.phone}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </label>

              <label>
                Gender
                <select
                  value={createForm.gender}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, gender: event.target.value }))}
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="full-width">
                Outcome | Details
                <textarea
                  rows={4}
                  value={createForm.outcomeDetails}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, outcomeDetails: event.target.value }))}
                />
              </label>

              <label className="ndc-toggle-row full-width">
                <span>Have you won prizes or achieved anything?</span>
                <input
                  type="checkbox"
                  checked={createForm.hasAchievement}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, hasAchievement: event.target.checked }))}
                />
              </label>

              <label className="full-width">
                Certificate (max 3mb)
                <input type="file" accept="image/*,.pdf" onChange={handleCertificateChange} />
                {createForm.certificateName ? <small>Selected: {createForm.certificateName}</small> : null}
              </label>

              <div className="ndc-form-actions full-width">
                <button type="button" className="ndc-btn" onClick={() => setShowCreateModal(false)}>
                  Reset
                </button>
                <button type="button" className="ndc-btn" onClick={() => submitCreate(true)}>Save & Add</button>
                <button type="submit" className="ndc-btn ndc-btn-primary">Save & Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedDetail && (
        <div className="ndc-modal-backdrop" onClick={() => setShowViewModal(false)}>
          <div className="ndc-modal ndc-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ndc-modal-head">
              <h2>Ticket: {selectedDetail.ticket} - {selectedDetail.name}</h2>
              <div className="ndc-modal-head-actions">
                <button type="button" className="ndc-icon-btn success" onClick={refreshSelectedDetail}>
                  <FaRedo />
                </button>
                <button type="button" className="ndc-icon-btn danger" onClick={() => setShowViewModal(false)}>
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="ndc-view-tabs">
              <button
                type="button"
                className={viewTab === "participation" ? "active" : ""}
                onClick={() => setViewTab("participation")}
              >
                Participation
              </button>
              <button
                type="button"
                className={viewTab === "files" ? "active" : ""}
                onClick={() => setViewTab("files")}
              >
                Files
              </button>
            </div>

            <div className="ndc-detail-layout">
              <div className="ndc-detail-main">
                <div className="ndc-detail-block">
                  <h3>{viewTab === "participation" ? "Participation Details" : "Uploaded Files"}</h3>
                  {viewTab === "participation" ? (
                  <div className="ndc-detail-grid">
                    <div><span>ACY</span><strong>{selectedDetail.acy || "-"}</strong></div>
                    <div><span>Name</span><strong>{selectedDetail.name}</strong></div>
                    <div><span>Date</span><strong>{formatDateRange(selectedDetail.startDate, selectedDetail.endDate)}</strong></div>
                    <div><span>Status</span><strong>{selectedDetail.status}</strong></div>
                    <div><span>Mode</span><strong>{selectedDetail.eventMode}</strong></div>
                    <div><span>For</span><strong>{selectedDetail.eventFor}</strong></div>
                    <div><span>Type</span><strong>{selectedDetail.eventType}</strong></div>
                    <div><span>Level</span><strong>{selectedDetail.eventLevel}</strong></div>
                    <div><span>Department</span><strong>{selectedDetail.user?.department || "-"}</strong></div>
                    <div><span>Organization</span><strong>{selectedDetail.organization || "-"}</strong></div>
                    <div><span>Location</span><strong>{selectedDetail.location || "-"}</strong></div>
                    <div><span>State</span><strong>{selectedDetail.state || "-"}</strong></div>
                    <div><span>SDG</span><strong>{selectedDetail.sdg || "-"}</strong></div>
                    <div><span>Achievement</span><strong>{selectedDetail.hasAchievement ? "Yes" : "No"}</strong></div>
                    <div><span>User ID</span><strong>{selectedDetail.user?.studentId || "-"}</strong></div>
                    <div><span>Username</span><strong>{selectedDetail.user?.username || "-"}</strong></div>
                    <div><span>Full Name</span><strong>{selectedDetail.user?.fullName || "-"}</strong></div>
                    <div><span>Email</span><strong>{selectedDetail.user?.email || "-"}</strong></div>
                    <div><span>Phone</span><strong>{selectedDetail.user?.phone || "-"}</strong></div>
                    <div><span>Gender</span><strong>{selectedDetail.user?.gender || "-"}</strong></div>
                  </div>
                  ) : (
                    <div className="ndc-file-panel-inline">
                      {selectedDetail.certificateUrl ? (
                        <a href={selectedDetail.certificateUrl} target="_blank" rel="noreferrer" className="ndc-cert-link">
                          View {selectedDetail.certificateName || "Certificate"}
                        </a>
                      ) : (
                        <p>No certificate uploaded</p>
                      )}
                    </div>
                  )}
                  <div className="ndc-outcome-box">
                    <strong>Outcome | Details</strong>
                    <p>{selectedDetail.outcomeDetails || "-"}</p>
                  </div>
                </div>

                {isFaculty && String(selectedDetail.status || "").toLowerCase() === "pending" && (
                  <div className="ndc-detail-block">
                    <h3>Faculty Approval</h3>
                    <textarea
                      rows={3}
                      value={facultyRemarks}
                      onChange={(event) => setFacultyRemarks(event.target.value)}
                      placeholder="Remarks (optional for approve, recommended for reject)"
                    />
                    <div className="ndc-form-actions">
                      <button type="button" className="ndc-btn ndc-btn-success" onClick={() => submitFacultyStatus("approved")}>
                        <FaCheck /> Approve
                      </button>
                      <button type="button" className="ndc-btn ndc-btn-danger" onClick={() => submitFacultyStatus("rejected")}>
                        <FaBan /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {isStudent && String(selectedDetail.status || "").toLowerCase() === "pending" && (
                  <div className="ndc-detail-block">
                    <h3>Actions</h3>
                    <div className="ndc-form-actions">
                      <button
                        type="button"
                        className="ndc-btn ndc-btn-danger"
                        onClick={async () => {
                          await handleDelete(selectedDetail);
                          setShowViewModal(false);
                        }}
                      >
                        <FaTimes /> Delete Record
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="ndc-certificate-panel">
                <h3>CERT</h3>
                {selectedDetail.certificateUrl ? (
                  <a href={selectedDetail.certificateUrl} target="_blank" rel="noreferrer" className="ndc-cert-link">
                    View {selectedDetail.certificateName || "Certificate"}
                  </a>
                ) : (
                  <p>No certificate uploaded</p>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
