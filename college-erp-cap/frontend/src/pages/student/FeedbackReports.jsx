import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { getFeedbackUserDetails, getStudentFeedbackReports } from "../../services/feedbackService";
import "../feedback/FeedbackUsers.css";

export default function FeedbackReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await getStudentFeedbackReports(token);
      setReports(response?.reports || []);
      setMessage("");
    } catch (error) {
      setMessage(error?.message || "Failed to load reports");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadReports();
  }, [token]);

  const handleView = async (submissionId) => {
    try {
      setLoading(true);
      const response = await getFeedbackUserDetails(submissionId, token);
      setSelectedSubmission(response);
    } catch (error) {
      setMessage(error?.message || "Failed to load report details");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-users-page">
      <div className="feedback-users-header">
        <div>
          <h1>Feedback Users and Reports</h1>
          <p>Your submitted feedback records</p>
        </div>
      </div>

      {message && <div className={`feedback-msg ${messageType}`}>{message}</div>}

      <div className="feedback-users-table-wrap">
        <table className="feedback-users-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Feedback</th>
              <th>Academic Year</th>
              <th>Sem</th>
              <th>Courses</th>
              <th>Submitted At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row) => (
              <tr key={row.submissionId}>
                <td>{row.ticket}</td>
                <td>{row.title}</td>
                <td>{row.academicYear}</td>
                <td>{row.semester}</td>
                <td>{row.courseCount}</td>
                <td>{new Date(row.submittedAt).toLocaleString()}</td>
                <td>
                  <button type="button" className="icon-btn" onClick={() => handleView(row.submissionId)}>
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && reports.length === 0 && <div className="feedback-empty">No reports found</div>}
      </div>

      {selectedSubmission && (
        <div className="feedback-modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-head">
              <h2>Ticket: {selectedSubmission?.details?.ticket}</h2>
              <button type="button" onClick={() => setSelectedSubmission(null)}>Close</button>
            </div>
            <div className="feedback-tab-content">
              <table className="feedback-users-table">
                <thead>
                  <tr>
                    <th>Coursecode</th>
                    <th>Coursename</th>
                    <th>Facultyname</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSubmission?.courses || []).map((row) => (
                    <tr key={row.id}>
                      <td>{row.courseCode}</td>
                      <td>{row.courseName}</td>
                      <td>{row.facultyName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
