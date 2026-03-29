import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { internalMarkRowsByTicket, nominalRollCoursesByTicket, nominalRollStudents } from "./nominalRollData";
import "./NominalRoll.css";

export default function NominalRollCourses() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isStudent = user?.role === "student";
  const isFacultyStudentView = location.pathname.startsWith("/faculty/student");
  const basePath = isStudent ? "/student" : isFacultyStudentView ? "/faculty/student" : "/faculty";

  const selectedTicket = location.state?.ticket || nominalRollStudents[0].ticket;
  const activeTab = location.state?.tab === "internals" ? "internals" : "courses";
  const profile = nominalRollStudents.find((item) => item.ticket === selectedTicket) || nominalRollStudents[0];

  const courses = useMemo(() => nominalRollCoursesByTicket[selectedTicket] || [], [selectedTicket]);
  const internals = useMemo(() => internalMarkRowsByTicket[selectedTicket] || [], [selectedTicket]);

  return (
    <div className="nominal-page">
      <div className="nominal-header">
        <div>
          <h1>{activeTab === "courses" ? "Nominal Roll View" : "Internal Marks and Exam Schedules"}</h1>
          <p>Ticket: {selectedTicket}</p>
        </div>
        <button type="button" className="nominal-ghost-btn" onClick={() => navigate(`${basePath}/nominal-roll`)}>
          <FiArrowLeft /> Back to Nominal Roll
        </button>
      </div>

      <div className="nominal-grid">
        <aside className="nominal-profile-card">
          <div className="avatar-circle">{(profile?.name || "S").slice(0, 1)}</div>
          <h2>{profile?.name || "Student"}</h2>
          <div className="profile-row"><span>Ticket</span><strong>{profile?.ticket || "--"}</strong></div>
          <div className="profile-row"><span>ACY</span><strong>{profile?.acy || "--"}</strong></div>
          <div className="profile-row"><span>Fullname</span><strong>{profile?.name || "--"}</strong></div>
          <div className="profile-row"><span>Roll No.</span><strong>{profile?.rollNo || "--"}</strong></div>
          <div className="profile-row"><span>Reg. No.</span><strong>{profile?.regNo || "--"}</strong></div>
          <div className="profile-row"><span>Batch</span><strong>{profile?.batch || "--"}</strong></div>
          <div className="profile-row"><span>Gender</span><strong>{profile?.gender || "--"}</strong></div>
          <div className="profile-row"><span>Total Courses</span><strong>{courses.length || internals.length}</strong></div>
          <div className="nominal-progress-track"><div className="nominal-progress-fill" style={{ width: "78%" }} /></div>
        </aside>

        <section className="nominal-table-wrap">
          {activeTab === "courses" ? (
            <table className="nominal-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>Course</th>
                  <th>Name</th>
                  <th>C</th>
                  <th>Sem</th>
                  <th>Type</th>
                  <th>Appear</th>
                  <th>Cons. Result</th>
                  <th>SA</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((row) => (
                  <tr key={row.ticket}>
                    <td>{row.ticket}</td>
                    <td>
                      <span className={row.status === "ok" ? "pill-ok" : "pill-block"}>
                        {row.status === "ok" ? <FiCheck /> : <FiX />}
                      </span>
                    </td>
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.credits}</td>
                    <td>{row.sem}</td>
                    <td>{row.type}</td>
                    <td>{row.appear}</td>
                    <td>
                      <span className={row.result === "ok" ? "pill-ok" : "pill-block"}>
                        {row.result === "ok" ? <FiCheck /> : <FiX />}
                      </span>
                    </td>
                    <td>
                      <span className={row.sa === "ok" ? "pill-ok" : "pill-block"}>
                        {row.sa === "ok" ? <FiCheck /> : <FiX />}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="nominal-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Course</th>
                  <th>Course Name</th>
                  <th>Sem.</th>
                  <th>Fee</th>
                  <th>Internal</th>
                  <th>Exam Date</th>
                </tr>
              </thead>
              <tbody>
                {internals.map((row) => (
                  <tr key={row.ticket}>
                    <td>{row.ticket}</td>
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.sem}</td>
                    <td>{row.fee}</td>
                    <td><span className="pill-light">{row.internal}</span></td>
                    <td><span className="pill-light">{row.examDate}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
