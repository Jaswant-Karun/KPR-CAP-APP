import { useEffect, useMemo, useState } from "react";
import { FaClipboardCheck, FaExclamationTriangle, FaFilter, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  convertIboxRequisitionToComplaint,
  createServiceRequest,
  deleteServiceRequest,
  getServiceRequests,
  grantIboxRequisitionPermission,
} from "../../services/bookingService";
import "./IBoxComplaints.css";

const CATEGORY = "ibox";
const TYPE_OPTIONS = ["Harassment", "Discipline", "Academic Misconduct", "Ragging", "Other"];
const STATUS_OPTIONS = ["all", "open", "pending", "approved", "rejected", "resolved"];

const ROLE_MESSAGE = {
  student: "Student requisition mode: submit your complaint requisition to faculty committee.",
  faculty: "Faculty control mode: create and delete I-BOX records.",
  admin: "Admin view mode: read-only complaint monitoring.",
};

const statusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["open", "pending", "in-progress"].includes(normalized)) return "Pending";
  if (["approved", "resolved"].includes(normalized)) return "Reviewed";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const statusTone = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["open", "pending", "in-progress"].includes(normalized)) return "pending";
  if (["approved", "resolved"].includes(normalized)) return "reviewed";
  if (normalized === "rejected") return "rejected";
  return "pending";
};

const parseMeta = (item) => {
  const metadata = item?.metadata && typeof item.metadata === "object" ? item.metadata : {};
  return {
    entryType: metadata.entryType || "requisition",
    complaintType: metadata.complaintType || "Other",
    againstName: metadata.againstName || "-",
    againstRollNo: metadata.againstRollNo || "-",
    studentName: metadata.studentName || item.createdByName || "-",
    studentRollNo: metadata.studentRollNo || item.createdByRollNo || "-",
    permissionGranted: Boolean(metadata.permissionGranted),
    convertedToComplaintId: metadata.convertedToComplaintId || null,
    convertedFromRequisitionId: metadata.convertedFromRequisitionId || null,
  };
};

const consentLabel = (item) => {
  const meta = parseMeta(item);
  if (meta.entryType === "complaint") {
    if (meta.convertedFromRequisitionId) return "Converted Complaint";
    return "Official Complaint";
  }

  if (meta.convertedToComplaintId) return "Converted";
  if (meta.permissionGranted) return "Consent Granted";
  return "Consent Pending";
};

const consentTone = (item) => {
  const meta = parseMeta(item);
  if (meta.entryType === "complaint") return "converted";
  if (meta.convertedToComplaintId) return "converted";
  if (meta.permissionGranted) return "granted";
  return "pending";
};

const defaultStudentForm = {
  complaintType: TYPE_OPTIONS[0],
  details: "",
};

const defaultFacultyForm = {
  complaintType: TYPE_OPTIONS[0],
  againstName: "",
  againstRollNo: "",
  details: "",
};

export default function IBoxComplaints() {
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
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [studentForm, setStudentForm] = useState(defaultStudentForm);
  const [facultyForm, setFacultyForm] = useState(defaultFacultyForm);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState(null);
  const [permissionChecked, setPermissionChecked] = useState(false);
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
      setRows(response?.requests || []);
    } catch (error) {
      setMessage(error?.message || "Failed to fetch I-BOX records");
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

    if (statusFilter !== "all") {
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
          meta.againstName,
          meta.againstRollNo,
          meta.complaintType,
          meta.entryType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
    }

    return data;
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const requisitions = rows.filter((item) => parseMeta(item).entryType === "requisition").length;
    const facultyComplaints = rows.filter((item) => parseMeta(item).entryType === "complaint").length;
    const pending = rows.filter((item) => ["open", "pending", "in-progress"].includes(String(item.status || "").toLowerCase())).length;
    return { requisitions, facultyComplaints, pending };
  }, [rows]);

  const submitStudentRequisition = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await createServiceRequest(
        {
          title: `I-BOX Requisition - ${studentForm.complaintType}`,
          category: CATEGORY,
          description: studentForm.details,
          metadata: {
            entryType: "requisition",
            complaintType: studentForm.complaintType,
            studentName: user?.name || "Student",
            studentRollNo: user?.rollNo || "-",
          },
        },
        token
      );

      setStudentForm(defaultStudentForm);
      setShowStudentForm(false);
      setMessage("Requisition sent to faculty internal committee.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to submit requisition");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitFacultyComplaint = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await createServiceRequest(
        {
          title: `I-BOX Complaint - ${facultyForm.complaintType}`,
          category: CATEGORY,
          description: facultyForm.details,
          metadata: {
            entryType: "complaint",
            complaintType: facultyForm.complaintType,
            againstName: facultyForm.againstName,
            againstRollNo: facultyForm.againstRollNo,
          },
        },
        token
      );

      setFacultyForm(defaultFacultyForm);
      setShowFacultyForm(false);
      setMessage("Faculty complaint created successfully.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to create complaint");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (requestId) => {
    if (!isFaculty) return;
    setSubmitting(true);
    setMessage("");

    try {
      await deleteServiceRequest(requestId, token);
      setMessage("I-BOX record deleted by faculty.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to delete complaint");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const openPermissionModal = (item) => {
    setPermissionTarget(item);
    setPermissionChecked(false);
    setShowPermissionModal(true);
  };

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    setPermissionTarget(null);
    setPermissionChecked(false);
  };

  const onGrantPermission = async () => {
    if (!isStudent) return;
    if (!permissionTarget?.id) return;
    setSubmitting(true);
    setMessage("");

    try {
      await grantIboxRequisitionPermission(permissionTarget.id, token);
      setMessage("Permission granted. Faculty can now convert this requisition into an official complaint.");
      setMessageTone("success");
      closePermissionModal();
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to grant permission");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const onConvertToComplaint = async (requestId) => {
    if (!isFaculty) return;
    setSubmitting(true);
    setMessage("");

    try {
      await convertIboxRequisitionToComplaint(requestId, token);
      setMessage("Requisition converted into an official complaint.");
      setMessageTone("success");
      await loadRequests();
    } catch (error) {
      setMessage(error?.message || "Failed to convert requisition");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ibox-page">
      <section className="ibox-hero">
        <div>
          <h1>I-BOX Internal Complaints Committee</h1>
          <p>{ROLE_MESSAGE[role] || ROLE_MESSAGE.student}</p>
        </div>

        <div className="ibox-hero-stats">
          <article>
            <span>Requisitions</span>
            <strong>{summary.requisitions}</strong>
          </article>
          <article>
            <span>Faculty Complaints</span>
            <strong>{summary.facultyComplaints}</strong>
          </article>
          <article>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </article>
        </div>
      </section>

      <section className="ibox-actions">
        {isStudent && (
          <button type="button" className="ibox-btn primary" onClick={() => setShowStudentForm((prev) => !prev)}>
            <FaClipboardCheck /> Send Requisition
          </button>
        )}

        {isFaculty && (
          <button type="button" className="ibox-btn primary" onClick={() => setShowFacultyForm((prev) => !prev)}>
            <FaPlus /> Create Complaint
          </button>
        )}

        {isAdmin && (
          <div className="ibox-readonly-tag">
            <FaExclamationTriangle /> Admin can view only
          </div>
        )}
      </section>

      {showStudentForm && isStudent && (
        <form className="ibox-form-card" onSubmit={submitStudentRequisition}>
          <h3>Student Requisition</h3>
          <label>
            Complaint Type
            <select
              value={studentForm.complaintType}
              onChange={(event) => setStudentForm((prev) => ({ ...prev, complaintType: event.target.value }))}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Requisition Details
            <textarea
              rows="4"
              required
              value={studentForm.details}
              onChange={(event) => setStudentForm((prev) => ({ ...prev, details: event.target.value }))}
              placeholder="Describe the issue clearly for faculty committee review"
            />
          </label>
          <div className="ibox-form-actions">
            <button type="submit" className="ibox-btn primary" disabled={submitting}>
              Submit Requisition
            </button>
          </div>
        </form>
      )}

      {showFacultyForm && isFaculty && (
        <form className="ibox-form-card" onSubmit={submitFacultyComplaint}>
          <h3>Faculty Complaint Entry</h3>
          <label>
            Complaint Type
            <select
              value={facultyForm.complaintType}
              onChange={(event) => setFacultyForm((prev) => ({ ...prev, complaintType: event.target.value }))}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Student Name
            <input
              type="text"
              required
              value={facultyForm.againstName}
              onChange={(event) => setFacultyForm((prev) => ({ ...prev, againstName: event.target.value }))}
            />
          </label>
          <label>
            Student Roll No
            <input
              type="text"
              required
              value={facultyForm.againstRollNo}
              onChange={(event) => setFacultyForm((prev) => ({ ...prev, againstRollNo: event.target.value }))}
            />
          </label>
          <label>
            Complaint Details
            <textarea
              rows="4"
              required
              value={facultyForm.details}
              onChange={(event) => setFacultyForm((prev) => ({ ...prev, details: event.target.value }))}
            />
          </label>
          <div className="ibox-form-actions">
            <button type="submit" className="ibox-btn primary" disabled={submitting}>
              Save Complaint
            </button>
          </div>
        </form>
      )}

      <section className="ibox-table-card">
        <div className="ibox-toolbar">
          <label className="ibox-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search complaint, student, type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="ibox-filter">
            <FaFilter />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Status" : statusLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message && <div className={`ibox-message ${messageTone}`}>{message}</div>}

        <div className="ibox-table-wrap">
          {loading ? (
            <div className="ibox-empty">Loading complaints...</div>
          ) : filteredRows.length === 0 ? (
            <div className="ibox-empty">No data available</div>
          ) : (
            <table className="ibox-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>Consent</th>
                  <th>Complainer</th>
                  <th>Category</th>
                  <th>Details</th>
                  <th>Created at</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item) => {
                  const meta = parseMeta(item);
                  const isRequisition = meta.entryType === "requisition";
                  const canStudentGrantPermission =
                    isStudent &&
                    isRequisition &&
                    Number(item.createdBy || 0) === Number(user?.id || 0) &&
                    !meta.permissionGranted;
                  const canFacultyConvert = isFaculty && isRequisition && meta.permissionGranted && !meta.convertedToComplaintId;
                  const facultyConvertReason = !meta.permissionGranted
                    ? "Student consent is pending. Student must grant permission first."
                    : meta.convertedToComplaintId
                      ? "Already converted to an official complaint."
                      : "Convert this requisition into an official complaint.";
                  return (
                    <tr key={item.id}>
                      <td>IBX-{String(item.id).padStart(4, "0")}</td>
                      <td>
                        <span className={`ibox-status ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                      </td>
                      <td>
                        <span className={`ibox-consent ${consentTone(item)}`}>{consentLabel(item)}</span>
                      </td>
                      <td>
                        <strong>{meta.entryType === "complaint" ? "Faculty Complaint" : "Student Requisition"}</strong>
                        <span>{meta.entryType === "complaint" ? `${meta.againstName} (${meta.againstRollNo})` : `${meta.studentName} (${meta.studentRollNo})`}</span>
                      </td>
                      <td>{meta.complaintType}</td>
                      <td>{item.description || "-"}</td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                      <td>
                        {canStudentGrantPermission ? (
                          <button
                            type="button"
                            className="ibox-btn primary"
                            onClick={() => openPermissionModal(item)}
                            disabled={submitting}
                          >
                            <FaClipboardCheck /> Give Permission
                          </button>
                        ) : canFacultyConvert ? (
                          <div className="ibox-action-stack">
                            <button
                              type="button"
                              className="ibox-btn warning"
                              onClick={() => onConvertToComplaint(item.id)}
                              disabled={submitting}
                              title={facultyConvertReason}
                            >
                              <FaPlus /> Convert to Complaint
                            </button>
                            <button
                              type="button"
                              className="ibox-btn danger"
                              onClick={() => onDelete(item.id)}
                              disabled={submitting}
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </div>
                        ) : isFaculty ? (
                          isRequisition ? (
                            <div className="ibox-action-stack">
                              <button
                                type="button"
                                className="ibox-btn warning"
                                disabled
                                title={facultyConvertReason}
                              >
                                <FaPlus /> Convert to Complaint
                              </button>
                              <button
                                type="button"
                                className="ibox-btn danger"
                                onClick={() => onDelete(item.id)}
                                disabled={submitting}
                              >
                                <FaTrashAlt /> Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="ibox-btn danger"
                              onClick={() => onDelete(item.id)}
                              disabled={submitting}
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          )
                        ) : (
                          <span className="ibox-view-only">View only</span>
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

      {showPermissionModal && isStudent && permissionTarget && (
        <div className="ibox-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ibox-consent-title">
          <div className="ibox-modal-card">
            <h3 id="ibox-consent-title">Confirm Permission for Official Complaint</h3>
            <p>
              You are giving permission to faculty to convert this requisition into an official I-BOX complaint.
              Once converted, it will be tracked as a formal complaint entry.
            </p>
            <label className="ibox-consent-check">
              <input
                type="checkbox"
                checked={permissionChecked}
                onChange={(event) => setPermissionChecked(event.target.checked)}
              />
              I give explicit permission to faculty to create an official complaint from my requisition.
            </label>
            <div className="ibox-modal-actions">
              <button type="button" className="ibox-btn" onClick={closePermissionModal} disabled={submitting}>
                Cancel
              </button>
              <button
                type="button"
                className="ibox-btn primary"
                onClick={onGrantPermission}
                disabled={submitting || !permissionChecked}
              >
                Confirm Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
