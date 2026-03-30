import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getCfacInternals, getCfacRegistrations } from "../services/cfacService";
import { getStudentEnrollments } from "../services/courseService";
import { internalMarkRowsByTicket, nominalRollCoursesByTicket, nominalRollStudents } from "./nominalRollData";
import "./NominalRoll.css";

export default function NominalRollCourses() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [studentRegistration, setStudentRegistration] = useState(null);
  const [studentInternals, setStudentInternals] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentDataError, setStudentDataError] = useState("");

  const isStudent = user?.role === "student";
  const isFacultyStudentView = location.pathname.startsWith("/faculty/student");
  const basePath = isStudent ? "/student" : isFacultyStudentView ? "/faculty/student" : "/faculty";

  const selectedTicket = location.state?.ticket || nominalRollStudents[0].ticket;
  const activeTab = location.state?.tab === "internals" ? "internals" : "courses";
  const fallbackProfile = nominalRollStudents.find((item) => item.ticket === selectedTicket) || nominalRollStudents[0];

  useEffect(() => {
    const loadStudentCfacData = async () => {
      if (!isStudent || !token) return;
      try {
        setStudentDataError("");
        const registrationResp = await getCfacRegistrations(token);
        const latestRegistration = (registrationResp?.registrations || [])[0] || null;
        setStudentRegistration(latestRegistration);

        const enrollmentResp = await getStudentEnrollments(token);
        const onlyRegistered = (enrollmentResp?.enrollments || []).filter(
          (row) => String(row?.status || "registered").toLowerCase() === "registered"
        );
        setStudentEnrollments(onlyRegistered);

        if (latestRegistration?.id) {
          const internalsResp = await getCfacInternals(latestRegistration.id, token);
          setStudentInternals(internalsResp?.internals || []);
        } else {
          setStudentInternals([]);
        }
      } catch (error) {
        setStudentDataError(error?.message || "Failed to load internal marks");
      }
    };

    loadStudentCfacData();
  }, [isStudent, token]);

  const courseNameMap = useMemo(() => {
    const map = new Map();
    Object.values(nominalRollCoursesByTicket || {}).forEach((rows) => {
      (rows || []).forEach((row) => {
        const code = String(row?.code || "").trim().toUpperCase();
        const name = String(row?.name || "").trim();
        if (code && name) map.set(code, name);
      });
    });
    return map;
  }, []);

  const profile = useMemo(() => {
    if (!isStudent) return fallbackProfile;

    const emailLocal = String(user?.email || "").split("@")[0] || "--";
    const rollNo = user?.rollNo || emailLocal.toUpperCase() || fallbackProfile?.rollNo || "--";
    const regNo = fallbackProfile?.regNo || "--";

    return {
      ...fallbackProfile,
      ticket: studentRegistration?.ticket || fallbackProfile?.ticket,
      name: user?.name || fallbackProfile?.name,
      rollNo,
      regNo,
      acy: studentRegistration?.acy || fallbackProfile?.acy,
      batch: fallbackProfile?.batch,
      gender: fallbackProfile?.gender,
      profileId: emailLocal,
    };
  }, [isStudent, user, studentRegistration, fallbackProfile]);

  const courses = useMemo(() => {
    if (!isStudent || !studentRegistration) {
      return nominalRollCoursesByTicket[selectedTicket] || [];
    }

    return (studentEnrollments || []).map((enrollment, index) => {
      const normalizedCode = String(enrollment?.code || "").trim().toUpperCase();
      return {
        ticket: String(studentRegistration.ticket || studentRegistration.id || `${index + 1}`),
        status: "ok",
        code: normalizedCode,
        name: enrollment?.name || courseNameMap.get(normalizedCode) || normalizedCode,
        credits: enrollment?.credits || 0,
        sem: studentRegistration.sem || 0,
        type: enrollment?.category || "R",
        appear: "R",
        result: "ok",
        sa: "ok",
      };
    });
  }, [isStudent, studentRegistration, studentEnrollments, selectedTicket, courseNameMap]);

  const internals = useMemo(() => {
    if (!isStudent || !studentRegistration) {
      return internalMarkRowsByTicket[selectedTicket] || [];
    }

    const enrolledCodes = new Set(
      (studentEnrollments || [])
        .map((row) => String(row?.code || "").trim().toUpperCase())
        .filter(Boolean)
    );

    if (enrolledCodes.size === 0) {
      return [];
    }

    if ((studentInternals || []).length === 0) {
      return (studentEnrollments || []).map((row, index) => {
        const normalizedCode = String(row?.code || "").trim().toUpperCase();
        return {
          ticket: String(studentRegistration.ticket || studentRegistration.id || `${index + 1}`),
          code: normalizedCode,
          name: row?.name || courseNameMap.get(normalizedCode) || normalizedCode,
          sem: studentRegistration.sem || 0,
          fee: 0,
          internal: "--",
          examDate: "--",
        };
      });
    }

    return studentInternals
      .filter((row) => enrolledCodes.has(String(row?.courseCode || "").trim().toUpperCase()))
      .map((row, index) => {
      const normalizedCode = String(row?.courseCode || "").trim().toUpperCase();
      return {
        ticket: String(studentRegistration.ticket || studentRegistration.id || `${index + 1}`),
        code: normalizedCode,
        name: courseNameMap.get(normalizedCode) || normalizedCode,
        sem: studentRegistration.sem || 0,
        fee: 0,
        internal: row?.internal1 ?? "--",
        examDate: "--",
      };
    });
  }, [isStudent, studentRegistration, studentInternals, studentEnrollments, selectedTicket, courseNameMap]);

  return (
    <div className="nominal-page">
      <div className="nominal-header">
        <div>
          <h1>{activeTab === "courses" ? "Nominal Roll View" : "Internal Marks and Exam Schedules"}</h1>
          <p>Ticket: {profile?.ticket || selectedTicket}</p>
        </div>
        <button type="button" className="nominal-ghost-btn" onClick={() => navigate(`${basePath}/nominal-roll`)}>
          <FiArrowLeft /> Back to Nominal Roll
        </button>
      </div>

      {studentDataError && <p className="report-error">{studentDataError}</p>}

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
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="10">No course registrations found.</td>
                  </tr>
                ) : (
                  courses.map((row) => (
                    <tr key={`${row.ticket}-${row.code}`}>
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
                  ))
                )}
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
                {internals.length === 0 ? (
                  <tr>
                    <td colSpan="7">No internal marks available for registered courses.</td>
                  </tr>
                ) : (
                  internals.map((row) => (
                    <tr key={`${row.ticket}-${row.code}`}>
                      <td>{row.ticket}</td>
                      <td>{row.code}</td>
                      <td>{row.name}</td>
                      <td>{row.sem}</td>
                      <td>{row.fee}</td>
                      <td><span className="pill-light">{row.internal}</span></td>
                      <td><span className="pill-light">{row.examDate}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
