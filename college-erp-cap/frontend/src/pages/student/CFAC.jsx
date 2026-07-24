import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaDownload, FaEye, FaHistory, FaSearch, FaTimes, FaEllipsisV, FaCheck, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  createCfacRegistration,
  getCfacDownloadPayload,
  getCfacHistory,
  getCfacInternals,
  getCfacRegistrations,
  getCfacStudents,
  updateCfacRegistration,
} from "../../services/cfacService";
import "./CFAC.css";

export default function CFAC() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === "admin" || user?.role === "faculty";
  const courseCodePattern = /^[A-Z0-9]{4,12}$/;

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [internalsOpen, setInternalsOpen] = useState(false);
  const [internalsRows, setInternalsRows] = useState([]);
  const [savingInternals, setSavingInternals] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [internalErrors, setInternalErrors] = useState({});
  const [form, setForm] = useState({
    studentId: "",
    ticketNo: "",
    status: "Approved",
    acy: "2025-26",
    sem: 5,
    courseCodesText: "",
  });

  const loadRows = async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const response = await getCfacRegistrations(token, selectedStudentId || undefined);
      setRows(Array.isArray(response?.registrations) ? response.registrations : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load registration records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [token, selectedStudentId]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!token || !canManage) return;

      try {
        const response = await getCfacStudents(token);
        const list = Array.isArray(response?.students) ? response.students : [];
        setStudents(list);
      } catch {
        // Keep registration table functional even if student list fetch fails.
      }
    };

    loadStudents();
  }, [token, canManage]);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) => {
      const roll = (row.studentRollNo || "").toLowerCase();
      const name = (row.studentName || "").toLowerCase();
      const ticket = String(row.ticket || "").toLowerCase();
      return roll.includes(search) || name.includes(search) || ticket.includes(search);
    });
  }, [query, rows]);

  const downloadRow = async (row) => {
    try {
      const payload = await getCfacDownloadPayload(row.id, token);
      const blob = new Blob([payload.content || ""], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = payload.fileName || `cfac-registration-${row.ticket}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || "Unable to download registration.");
    }
  };

  const openHistory = async (row) => {
    try {
      const response = await getCfacHistory(row.id, token);
      setSelectedRow(row);
      setHistoryRows(Array.isArray(response?.history) ? response.history : []);
      setHistoryOpen(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to load history.");
    }
  };

  const openInternals = async (row) => {
    try {
      const response = await getCfacInternals(row.id, token);
      setSelectedRow(row);
      setInternalsRows(Array.isArray(response?.internals) ? response.internals : []);
      setInternalsOpen(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to load internal marks.");
    }
  };

  const updateInternalCell = (index, field, value) => {
    setInternalsRows((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        return { ...row, [field]: value === "" ? "" : Number(value) };
      })
    );
  };

  const saveInternals = async () => {
    if (!selectedRow || !canManage) return;

    const nextInternalErrors = {};
    internalsRows.forEach((row, index) => {
      ["internal1", "internal2", "internal3"].forEach((field) => {
        const value = row[field];
        if (value === "" || value === null || typeof value === "undefined") {
          return;
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) {
          nextInternalErrors[`${index}-${field}`] = "Enter a mark between 0 and 100.";
        }
      });
    });

    if (Object.keys(nextInternalErrors).length > 0) {
      setInternalErrors(nextInternalErrors);
      setError("Fix invalid marks before saving.");
      return;
    }

    setInternalErrors({});

    try {
      setSavingInternals(true);
      const payload = {
        internalMarks: internalsRows.map((item) => ({
          courseCode: item.courseCode,
          internal1: item.internal1,
          internal2: item.internal2,
          internal3: item.internal3,
        })),
      };
      const response = await updateCfacRegistration(selectedRow.id, payload, token);
      setInternalsRows(Array.isArray(response?.internals) ? response.internals : internalsRows);
      setMessage("Internal marks updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save internal marks.");
    } finally {
      setSavingInternals(false);
    }
  };

  const openCreateForm = () => {
    setEditTargetId(null);
    setFormErrors({});
    setForm({
      studentId: selectedStudentId || "",
      ticketNo: "",
      status: "Approved",
      acy: "2025-26",
      sem: 5,
      courseCodesText: "",
    });
    setFormOpen(true);
  };

  const openEditForm = (row) => {
    setEditTargetId(row.id);
    setFormErrors({});
    setForm({
      studentId: String(row.studentId || ""),
      ticketNo: row.ticket || "",
      status: row.status || "Approved",
      acy: row.acy || "2025-26",
      sem: row.sem || 5,
      courseCodesText: Array.isArray(row.courseCodes) ? row.courseCodes.join(", ") : "",
    });
    setFormOpen(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    const studentId = Number(form.studentId);
    const sem = Number(form.sem);
    const status = String(form.status || "").trim();
    const acy = String(form.acy || "").trim();
    const courseCodes = String(form.courseCodesText || "")
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      nextErrors.studentId = "Student is required.";
    }

    if (!status) {
      nextErrors.status = "Status is required.";
    }

    if (!acy) {
      nextErrors.acy = "ACY is required.";
    }

    if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
      nextErrors.sem = "Semester must be between 1 and 12.";
    }

    if (courseCodes.length === 0) {
      nextErrors.courseCodesText = "At least one course code is required.";
    } else {
      const invalidCode = courseCodes.find((code) => !courseCodePattern.test(code));
      if (invalidCode) {
        nextErrors.courseCodesText = `Invalid course code: ${invalidCode}`;
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async () => {
    try {
      setError("");
      setMessage("");

      if (!validateForm()) {
        return;
      }

      const courseCodes = String(form.courseCodesText || "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);

      const payload = {
        studentId: Number(form.studentId),
        ticketNo: form.ticketNo || undefined,
        status: form.status,
        acy: form.acy,
        sem: Number(form.sem) || 5,
        courseCodes,
      };

      if (editTargetId) {
        await updateCfacRegistration(editTargetId, payload, token);
        setMessage("Registration updated successfully.");
      } else {
        await createCfacRegistration(payload, token);
        setMessage("Registration created successfully.");
      }

      setFormOpen(false);
      await loadRows();
    } catch (requestError) {
      setError(requestError.message || "Unable to save registration.");
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  return (
    <div className="cfac-page">
      <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
        <FaArrowLeft /> Back
      </button>
      <div className="cfac-header">
        <h1>Course Registration</h1>
        <div className="cfac-toolbar-right">
          {canManage && (
            <>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="cfac-select"
              >
                <option value="">All students</option>
                {students.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.roll_no || item.id} - {item.name}
                  </option>
                ))}
              </select>

              <button type="button" className="cfac-primary-btn" onClick={openCreateForm}>
                Add Registration
              </button>
            </>
          )}

          <div className="cfac-search-wrap">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
            />
            <FaSearch />
          </div>
        </div>
      </div>

      {message && <p className="cfac-message">{message}</p>}

      <div className="cfac-table-wrap">
        <table className="cfac-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>Student</th>
              <th>ACY</th>
              <th>Sem</th>
              <th>Courses</th>
              <th>RMC</th>
              <th>MCR</th>
              <th>WCR</th>
              <th>SCR</th>
              <th>ACR</th>
              <th>TCR</th>
              <th>Nominal Roll</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="14" className="no-data">Loading registrations...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="14" className="no-data">{error}</td>
              </tr>
            ) : filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.ticket}</td>
                  <td>
                    <span className="status-approved">{row.status}</span>
                  </td>
                  <td>
                    <p className="student-roll-tag">{row.studentRollNo || user?.rollNo || "--"}</p>
                    <p className="student-name-cell">{row.studentName || user?.name || "Student"}</p>
                  </td>
                  <td>
                    {row.acy}
                    <span className="sem-badge">Even</span>
                  </td>
                  <td>{row.sem}</td>
                  <td>{row.courses}</td>
                  <td>{row.rmc}</td>
                  <td>{row.mcr}</td>
                  <td>{row.wcr}</td>
                  <td>{row.scr}</td>
                  <td>{row.acr}</td>
                  <td>{row.tcr}</td>
                  <td>
                    <span className="nominal-roll-ok">
                      <FaCheck />
                    </span>
                  </td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="dots-btn"
                      onClick={() => setMenuOpenFor((prev) => (prev === row.id ? null : row.id))}
                    >
                      <FaEllipsisV />
                    </button>

                    {menuOpenFor === row.id && (
                      <div className="action-popover">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFor(null);
                            downloadRow(row);
                          }}
                        >
                          <FaDownload /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFor(null);
                            openInternals(row);
                          }}
                        >
                          <FaEye /> View Internal Marks
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFor(null);
                            openHistory(row);
                          }}
                        >
                          <FaHistory /> History
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFor(null);
                              openEditForm(row);
                            }}
                          >
                            <FaEye /> Edit Registration
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" className="no-data">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {historyOpen && (
        <div className="history-modal-backdrop" role="dialog" aria-modal="true">
          <div className="history-modal">
            <div className="history-header">
              <h2>History</h2>
              <div className="history-header-actions">
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={() => {
                    if (selectedRow) {
                      openHistory(selectedRow);
                    }
                  }}
                >
                  Refresh
                </button>
                <button type="button" className="close-btn" onClick={() => setHistoryOpen(false)}>
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Username</th>
                    <th>Client IP</th>
                    <th>Action</th>
                    <th>Date Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((item) => (
                    <tr key={item.id}>
                      <td>{selectedRow?.ticket || "--"}</td>
                      <td>{item.username}</td>
                      <td>{item.clientIp}</td>
                      <td>{item.action}</td>
                      <td>{formatDateTime(item.dateTime)}</td>
                      <td>{item.details}</td>
                    </tr>
                  ))}
                  {historyRows.length === 0 && (
                    <tr>
                      <td colSpan="6" className="no-data">No history records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {internalsOpen && (
        <div className="history-modal-backdrop" role="dialog" aria-modal="true">
          <div className="history-modal">
            <div className="history-header">
              <h2>Internal Marks</h2>
              <div className="history-header-actions">
                <button type="button" className="close-btn" onClick={() => setInternalsOpen(false)}>
                  <FaTimes /> Close
                </button>
                {canManage && (
                  <button type="button" className="refresh-btn" onClick={saveInternals} disabled={savingInternals}>
                    {savingInternals ? "Saving..." : "Save Marks"}
                  </button>
                )}
              </div>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Internal 1</th>
                    <th>Internal 2</th>
                    <th>Internal 3</th>
                  </tr>
                </thead>
                <tbody>
                  {internalsRows.map((item, index) => (
                    <tr key={item.courseCode}>
                      <td>{item.courseCode}</td>
                      <td>
                        {canManage ? (
                          <>
                            <input
                              type="number"
                              className="marks-input"
                              min="0"
                              max="100"
                              value={item.internal1 ?? ""}
                              onChange={(event) => {
                                setInternalErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[`${index}-internal1`];
                                  return next;
                                });
                                updateInternalCell(index, "internal1", event.target.value);
                              }}
                            />
                            {internalErrors[`${index}-internal1`] && (
                              <small className="cfac-field-error">{internalErrors[`${index}-internal1`]}</small>
                            )}
                          </>
                        ) : (
                          item.internal1 ?? "--"
                        )}
                      </td>
                      <td>
                        {canManage ? (
                          <>
                            <input
                              type="number"
                              className="marks-input"
                              min="0"
                              max="100"
                              value={item.internal2 ?? ""}
                              onChange={(event) => {
                                setInternalErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[`${index}-internal2`];
                                  return next;
                                });
                                updateInternalCell(index, "internal2", event.target.value);
                              }}
                            />
                            {internalErrors[`${index}-internal2`] && (
                              <small className="cfac-field-error">{internalErrors[`${index}-internal2`]}</small>
                            )}
                          </>
                        ) : (
                          item.internal2 ?? "--"
                        )}
                      </td>
                      <td>
                        {canManage ? (
                          <>
                            <input
                              type="number"
                              className="marks-input"
                              min="0"
                              max="100"
                              value={item.internal3 ?? ""}
                              onChange={(event) => {
                                setInternalErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[`${index}-internal3`];
                                  return next;
                                });
                                updateInternalCell(index, "internal3", event.target.value);
                              }}
                            />
                            {internalErrors[`${index}-internal3`] && (
                              <small className="cfac-field-error">{internalErrors[`${index}-internal3`]}</small>
                            )}
                          </>
                        ) : (
                          item.internal3 ?? "--"
                        )}
                      </td>
                    </tr>
                  ))}
                  {internalsRows.length === 0 && (
                    <tr>
                      <td colSpan="4" className="no-data">No internal marks available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {formOpen && canManage && (
        <div className="history-modal-backdrop" role="dialog" aria-modal="true">
          <div className="history-modal">
            <div className="history-header">
              <h2>{editTargetId ? "Edit Registration" : "Create Registration"}</h2>
              <div className="history-header-actions">
                <button type="button" className="close-btn" onClick={() => setFormOpen(false)}>
                  <FaTimes /> Close
                </button>
                <button type="button" className="refresh-btn" onClick={submitForm}>
                  Save
                </button>
              </div>
            </div>

            <div className="cfac-form-grid">
              <label>
                Student
                <select
                  value={form.studentId}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((prev) => ({ ...prev, studentId: nextValue }));
                    setFormErrors((prev) => ({ ...prev, studentId: "" }));
                  }}
                  className="cfac-select"
                >
                  <option value="">Select student</option>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.roll_no || item.id} - {item.name}
                    </option>
                  ))}
                </select>
                {formErrors.studentId && <small className="cfac-field-error">{formErrors.studentId}</small>}
              </label>

              <label>
                Ticket No
                <input
                  value={form.ticketNo}
                  onChange={(event) => setForm((prev) => ({ ...prev, ticketNo: event.target.value }))}
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((prev) => ({ ...prev, status: nextValue }));
                    setFormErrors((prev) => ({ ...prev, status: "" }));
                  }}
                  className="cfac-select"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Draft">Draft</option>
                </select>
                {formErrors.status && <small className="cfac-field-error">{formErrors.status}</small>}
              </label>

              <label>
                ACY
                <input
                  value={form.acy}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((prev) => ({ ...prev, acy: nextValue }));
                    setFormErrors((prev) => ({ ...prev, acy: "" }));
                  }}
                />
                {formErrors.acy && <small className="cfac-field-error">{formErrors.acy}</small>}
              </label>

              <label>
                Semester
                <input
                  type="number"
                  value={form.sem}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((prev) => ({ ...prev, sem: nextValue }));
                    setFormErrors((prev) => ({ ...prev, sem: "" }));
                  }}
                />
                {formErrors.sem && <small className="cfac-field-error">{formErrors.sem}</small>}
              </label>

              <label className="cfac-form-span">
                Course Codes (comma separated)
                <input
                  value={form.courseCodesText}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((prev) => ({ ...prev, courseCodesText: nextValue }));
                    setFormErrors((prev) => ({ ...prev, courseCodesText: "" }));
                  }}
                  placeholder="U21AD401, U21CB401"
                />
                {formErrors.courseCodesText && (
                  <small className="cfac-field-error">{formErrors.courseCodesText}</small>
                )}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
