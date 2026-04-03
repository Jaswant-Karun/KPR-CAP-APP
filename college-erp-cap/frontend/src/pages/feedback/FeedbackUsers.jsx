import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaEye, FaTimes, FaCheckCircle, FaRegCircle, FaSyncAlt } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import {
  activateFeedbackCycle,
  createFeedbackCycle,
  getFacultyFeedbackPerformance,
  getFeedbackCycles,
  getFeedbackUserDetails,
  getFeedbackUsers,
  submitAdminFeedbackAction,
  submitFacultyFeedbackReason,
} from "../../services/feedbackService";
import "./FeedbackUsers.css";

const defaultQuestions = [
  "Ability to explain concepts clearly",
  "Subject knowledge and preparedness",
  "Punctuality and regularity",
  "Student interaction and guidance",
  "Evaluation fairness",
];

const ratingToPercent = (rating) => Number((((Number(rating) || 0) / 5) * 100).toFixed(2));

const StarText = ({ value }) => {
  const score = Number(value || 0);
  const stars = "*".repeat(Math.max(0, Math.min(5, Math.round(score))));
  return (
    <span>
      {score} / 5 ({ratingToPercent(score)}%) {stars}
    </span>
  );
};

export default function FeedbackUsers() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  const [performanceRows, setPerformanceRows] = useState([]);
  const [facultyReason, setFacultyReason] = useState("");
  const [adminActions, setAdminActions] = useState({});

  const [newCycleForm, setNewCycleForm] = useState({
    title: "Course Faculty Feedback",
    academicYear: "",
    semester: "",
    questionsText: defaultQuestions.join("\n"),
  });

  const selectedCycle = useMemo(
    () => cycles.find((item) => Number(item.id) === Number(selectedCycleId)) || null,
    [cycles, selectedCycleId]
  );

  const loadCycles = async () => {
    const response = await getFeedbackCycles(token);
    const nextCycles = response?.cycles || [];
    setCycles(nextCycles);

    if (!selectedCycleId && nextCycles.length > 0) {
      const active = nextCycles.find((item) => item.status === "active");
      setSelectedCycleId(String(active?.id || nextCycles[0].id));
    }
  };

  const loadFeedbackUsers = async () => {
    const response = await getFeedbackUsers(token, {
      cycleId: selectedCycleId || undefined,
      search,
    });
    setUsers(response?.users || []);
  };

  const loadPerformance = async () => {
    const response = await getFacultyFeedbackPerformance(token, selectedCycleId || undefined);
    setPerformanceRows(response?.performance || []);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      await loadCycles();
      await Promise.all([loadFeedbackUsers(), loadPerformance()]);
      setMessage("");
    } catch (error) {
      setMessage(error?.message || "Failed to load feedback data");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadPage();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedCycleId) return;
    const run = async () => {
      try {
        setLoading(true);
        await Promise.all([loadFeedbackUsers(), loadPerformance()]);
      } catch (error) {
        setMessage(error?.message || "Failed to refresh feedback data");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedCycleId]);

  const handleCreateCycle = async (event) => {
    event.preventDefault();
    try {
      const questions = String(newCycleForm.questionsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text, index) => ({ text, order: index + 1 }));

      await createFeedbackCycle(
        {
          title: newCycleForm.title,
          academicYear: newCycleForm.academicYear,
          semester: Number(newCycleForm.semester),
          activateNow: true,
          questions,
        },
        token
      );

      setMessage("Feedback cycle created and activated");
      setMessageType("success");
      await loadPage();
    } catch (error) {
      setMessage(error?.message || "Failed to create feedback cycle");
      setMessageType("error");
    }
  };

  const handleActivateCycle = async (cycleId) => {
    try {
      await activateFeedbackCycle(cycleId, token);
      setMessage("Feedback cycle activated");
      setMessageType("success");
      await loadPage();
    } catch (error) {
      setMessage(error?.message || "Failed to activate feedback cycle");
      setMessageType("error");
    }
  };

  const handleViewSubmission = async (submission) => {
    try {
      setLoading(true);
      setSelectedSubmission(submission);
      setActiveTab("details");
      const detailResponse = await getFeedbackUserDetails(submission.submissionId, token);
      setSubmissionDetails(detailResponse);
    } catch (error) {
      setMessage(error?.message || "Failed to load submission details");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyReasonSubmit = async () => {
    if (!selectedCycleId || !facultyReason.trim()) {
      setMessage("Reason is required");
      setMessageType("error");
      return;
    }

    try {
      await submitFacultyFeedbackReason(selectedCycleId, facultyReason.trim(), token);
      setFacultyReason("");
      setMessage("Reason submitted to admin");
      setMessageType("success");
      await loadPerformance();
    } catch (error) {
      setMessage(error?.message || "Failed to submit reason");
      setMessageType("error");
    }
  };

  const handleAdminActionSubmit = async (facultyId) => {
    const action = String(adminActions[facultyId] || "").trim();
    if (!selectedCycleId || !action) {
      setMessage("Action text is required");
      setMessageType("error");
      return;
    }

    try {
      await submitAdminFeedbackAction(selectedCycleId, facultyId, action, token);
      setMessage("Admin action recorded");
      setMessageType("success");
      await loadPerformance();
    } catch (error) {
      setMessage(error?.message || "Failed to record admin action");
      setMessageType("error");
    }
  };

  return (
    <div className="feedback-users-page">
      <div className="feedback-users-header">
        <div>
          <h1>Feedback Users</h1>
          <p>Course Faculty Feedback submission and performance monitoring</p>
        </div>
        <button type="button" className="feedback-refresh-btn" onClick={loadPage}>
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {message && <div className={`feedback-msg ${messageType}`}>{message}</div>}

      {isAdmin && (
        <form className="feedback-cycle-card" onSubmit={handleCreateCycle}>
          <h2>Create Feedback (Admin)</h2>
          <div className="feedback-cycle-grid">
            <input
              type="text"
              value={newCycleForm.title}
              onChange={(e) => setNewCycleForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Feedback title"
            />
            <input
              type="text"
              value={newCycleForm.academicYear}
              onChange={(e) => setNewCycleForm((prev) => ({ ...prev, academicYear: e.target.value }))}
              placeholder="Academic Year (Example: 2025-26)"
            />
            <input
              type="number"
              min="1"
              max="10"
              value={newCycleForm.semester}
              onChange={(e) => setNewCycleForm((prev) => ({ ...prev, semester: e.target.value }))}
              placeholder="Semester"
            />
            <button type="submit">Create and Activate</button>
          </div>
          <textarea
            value={newCycleForm.questionsText}
            onChange={(e) => setNewCycleForm((prev) => ({ ...prev, questionsText: e.target.value }))}
            rows={5}
            placeholder="One question per line"
          />
        </form>
      )}

      <div className="feedback-cycle-select-row">
        <label htmlFor="cycle-select">Feedback Cycle</label>
        <select
          id="cycle-select"
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value)}
        >
          <option value="">Select cycle</option>
          {cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.title} - {cycle.academicYear} - Sem {cycle.semester} ({cycle.status})
            </option>
          ))}
        </select>

        {isAdmin && selectedCycle && selectedCycle.status !== "active" && (
          <button type="button" onClick={() => handleActivateCycle(selectedCycle.id)}>
            Activate Selected Cycle
          </button>
        )}
      </div>

      <div className="feedback-users-toolbar">
        <div className="feedback-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search ticket, name, roll no"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" onClick={loadFeedbackUsers}>Search</button>
      </div>

      <div className="feedback-users-table-wrap">
        <table className="feedback-users-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>User</th>
              <th>Feedback</th>
              <th>Submitted levels</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.submissionId}>
                <td>{row.ticket}</td>
                <td>
                  <div className="feedback-user-cell">
                    <strong>{row.studentName}</strong>
                    <small>{row.studentRollNo}</small>
                  </div>
                </td>
                <td>
                  <div className="feedback-badges">
                    <span className="badge">Sem {selectedCycle?.semester || "-"}</span>
                    <span className="badge">{selectedCycle?.academicYear || "-"}</span>
                    <span className="badge">{selectedCycle?.title || "Feedback"}</span>
                  </div>
                </td>
                <td>
                  <span className="levels-pill">
                    {row.submittedLevels.done} / {row.submittedLevels.total}
                  </span>
                </td>
                <td>{row.submitted ? <FaCheckCircle className="ok-icon" /> : <FaRegCircle />}</td>
                <td>
                  <button type="button" className="icon-btn" onClick={() => handleViewSubmission(row)}>
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && <div className="feedback-empty">No submissions found</div>}
      </div>

      <div className="feedback-performance-card">
        <h2>Faculty Percentage</h2>
        <p>Only faculty and admin can see percentage. Below 70 requires faculty reason and admin action.</p>
        <table className="feedback-users-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Students</th>
              <th>Avg %</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {performanceRows.map((row) => (
              <tr key={row.facultyId || row.facultyName}>
                <td>{row.facultyName}</td>
                <td>{row.totalStudents}</td>
                <td>{row.averagePercentage}%</td>
                <td>
                  <span className={row.averagePercentage >= 70 ? "status-ok" : "status-low"}>
                    {row.averagePercentage >= 70 ? "OK" : "Below 70"}
                  </span>
                </td>
                <td>
                  {row.reason || (row.averagePercentage < 70 ? "Reason pending" : "-")}
                </td>
                <td>
                  {row.adminAction || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isFaculty && (
          <div className="feedback-action-box">
            <h3>Faculty reason (required if your percentage is below 70)</h3>
            <textarea
              rows={3}
              value={facultyReason}
              onChange={(e) => setFacultyReason(e.target.value)}
              placeholder="Enter reason for below-threshold performance"
            />
            <button type="button" onClick={handleFacultyReasonSubmit}>Submit Reason</button>
          </div>
        )}

        {isAdmin && (
          <div className="feedback-action-grid">
            {performanceRows
              .filter((row) => row.averagePercentage < 70)
              .map((row) => (
                <div key={`action-${row.facultyId}`} className="feedback-action-item">
                  <strong>{row.facultyName}</strong>
                  <textarea
                    rows={2}
                    value={adminActions[row.facultyId] || ""}
                    onChange={(e) =>
                      setAdminActions((prev) => ({
                        ...prev,
                        [row.facultyId]: e.target.value,
                      }))
                    }
                    placeholder="Admin action for faculty"
                  />
                  <button type="button" onClick={() => handleAdminActionSubmit(row.facultyId)}>
                    Save Action
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedSubmission && submissionDetails && (
        <div className="feedback-modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-head">
              <h2>Ticket: {submissionDetails.details.ticket}</h2>
              <button type="button" onClick={() => setSelectedSubmission(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="feedback-tabs">
              <button
                type="button"
                className={activeTab === "details" ? "active" : ""}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>
              <button
                type="button"
                className={activeTab === "courses" ? "active" : ""}
                onClick={() => setActiveTab("courses")}
              >
                Courses
              </button>
              <button
                type="button"
                className={activeTab === "responses" ? "active" : ""}
                onClick={() => setActiveTab("responses")}
              >
                Responses
              </button>
            </div>

            {activeTab === "details" && (
              <div className="feedback-tab-content">
                <div className="kv-row"><span>Type</span><strong>{submissionDetails.details.type}</strong></div>
                <div className="kv-row"><span>Name</span><strong>{submissionDetails.details.name}</strong></div>
                <div className="kv-row"><span>ACY</span><strong>{submissionDetails.details.academicYear}</strong></div>
                <div className="kv-row"><span>ACY Sem</span><strong>{submissionDetails.details.semester}</strong></div>
                <div className="kv-row"><span>Serial Number</span><strong>{submissionDetails.details.serialNumber}</strong></div>
                <div className="kv-row"><span>Created At</span><strong>{new Date(submissionDetails.details.createdAt).toLocaleString()}</strong></div>
              </div>
            )}

            {activeTab === "courses" && (
              <div className="feedback-tab-content">
                <table className="feedback-users-table">
                  <thead>
                    <tr>
                      <th>Sem</th>
                      <th>Coursecode</th>
                      <th>Coursename</th>
                      <th>Facultycode</th>
                      <th>Facultyname</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionDetails.courses.map((row) => (
                      <tr key={row.id}>
                        <td>{row.sem}</td>
                        <td>{row.courseCode}</td>
                        <td>{row.courseName}</td>
                        <td>{row.facultyCode}</td>
                        <td>{row.facultyName}</td>
                        <td>{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "responses" && (
              <div className="feedback-tab-content">
                <table className="feedback-users-table">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Question_name</th>
                      <th>Coursecode</th>
                      <th>Facultycode</th>
                      <th>Answer</th>
                      <th>Answer_text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionDetails.responses.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.questionName}</td>
                        <td>{row.courseCode}</td>
                        <td>{row.facultyCode}</td>
                        <td>{row.answer}</td>
                        <td><StarText value={row.answer} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
