import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheck, FiClock, FiDownload, FiEye, FiFilter, FiMoreVertical, FiSearch } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getCfacRegistrations } from "../services/cfacService";
import { nominalRollHistoryByTicket, nominalRollStudents } from "./nominalRollData";
import "./NominalRoll.css";

export default function NominalRoll() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [nominalRows, setNominalRows] = useState([]);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef(null);

  const isStudent = user?.role === "student";
  const isFacultyStudentView = location.pathname.startsWith("/faculty/student");
  const basePath = isStudent ? "/student" : isFacultyStudentView ? "/faculty/student" : "/faculty";

  useEffect(() => {
    const loadNominalRows = async () => {
      if (!token) return;
      try {
        setError("");
        const response = await getCfacRegistrations(token);
        const rows = (response?.registrations || []).map((row) => ({
          id: row.id,
          ticket: String(row.ticket || row.id),
          status: String(row.status || "Approved").toLowerCase(),
          rollNo: row.studentRollNo || user?.rollNo || String(user?.email || "").split("@")[0]?.toUpperCase() || "--",
          name: row.studentName || user?.name || "Student",
          regNo: row.studentRollNo || user?.rollNo || "--",
          acy: row.acy || "--",
          batch: `Sem ${row.sem || "--"}`,
          percent: Number(row.registeredCourseCount || 0),
          hallTicketStatus: "ready",
          gender: "--",
          semester: row.sem || 0,
          registeredCourseCount: Number(row.registeredCourseCount || 0),
        }));
        setNominalRows(rows);
      } catch (err) {
        setNominalRows([]);
        setError(err?.message || "Failed to load nominal roll data");
      }
    };

    loadNominalRows();
  }, [token, user?.email, user?.name, user?.rollNo]);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuFor(null);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const sourceRows = nominalRows.length > 0 ? nominalRows : nominalRollStudents;
    const studentRows = isStudent ? sourceRows : sourceRows;

    if (!search) return studentRows;

    return studentRows.filter((item) => {
      return (
        item.ticket.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.rollNo.toLowerCase().includes(search) ||
        item.regNo.toLowerCase().includes(search)
      );
    });
  }, [isStudent, nominalRows, query]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedTicket(null);
      return;
    }

    const hasSelected = filteredRows.some((row) => row.ticket === selectedTicket);
    if (!hasSelected) {
      setSelectedTicket(filteredRows[0].ticket);
    }
  }, [filteredRows, selectedTicket]);

  const activeStudent =
    filteredRows.find((row) => row.ticket === selectedTicket) ||
    filteredRows[0] ||
    nominalRollStudents[0];

  const openHistory = (row) => {
    setHistoryRows(nominalRollHistoryByTicket[row.ticket] || []);
    setHistoryOpen(true);
  };

  const openCourses = (row, tab = "courses") => {
    navigate(`${basePath}/nominal-roll-courses`, {
      state: { ticket: row.ticket, tab },
    });
  };

  const downloadNominal = (row) => {
    const payload = [
      `Nominal Roll`,
      `Ticket: ${row.ticket}`,
      `Roll No: ${row.rollNo}`,
      `Name: ${row.name}`,
      `Reg No: ${row.regNo}`,
      `ACY: ${row.acy}`,
      `Semester: ${row.semester}`,
    ].join("\n");

    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nominal-roll-${row.ticket}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="nominal-page">
      <div className="nominal-header">
        <div>
          <h1>Nominal Roll</h1>
          <p>{isStudent ? "Track your nominal roll and exam readiness" : "Review student nominal rolls and records"}</p>
        </div>
        <div className="nominal-header-meta">
          <span>Rows: {filteredRows.length}</span>
        </div>
      </div>

      {error && <p className="report-error">{error}</p>}

      <div className="nominal-toolbar">
        <div className="nominal-search">
          <FiSearch />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ticket, student, roll no, reg no"
          />
        </div>
        <button type="button" className="nominal-ghost-btn" onClick={() => setQuery("")}>
          <FiFilter /> Clear
        </button>
      </div>

      <div className="nominal-quick-actions">
        <button
          type="button"
          className="nominal-ghost-btn"
          onClick={() => openCourses(activeStudent, "internals")}
          disabled={!activeStudent}
        >
          <FiEye /> Internal Marks and Exam Schedule
        </button>
        <button
          type="button"
          className="nominal-ghost-btn"
          onClick={() => openCourses(activeStudent, "courses")}
          disabled={!activeStudent}
        >
          <FiEye /> List of Courses
        </button>
        <button
          type="button"
          className="nominal-ghost-btn"
          onClick={() => downloadNominal(activeStudent)}
          disabled={!activeStudent}
        >
          <FiDownload /> Download
        </button>
        <button
          type="button"
          className="nominal-ghost-btn"
          onClick={() => openHistory(activeStudent)}
          disabled={!activeStudent}
        >
          <FiClock /> History
        </button>
      </div>

      <div className="nominal-grid">
        <aside className="nominal-profile-card">
          <div className="avatar-circle">{(activeStudent?.name || "S").slice(0, 1)}</div>
          <h2>{activeStudent?.name || "Student"}</h2>
          <div className="profile-row"><span>Ticket</span><strong>{activeStudent?.ticket || "--"}</strong></div>
          <div className="profile-row"><span>ACY</span><strong>{activeStudent?.acy || "--"}</strong></div>
          <div className="profile-row"><span>Roll No.</span><strong>{activeStudent?.rollNo || "--"}</strong></div>
          <div className="profile-row"><span>Reg No.</span><strong>{activeStudent?.regNo || "--"}</strong></div>
          <div className="profile-row"><span>Batch</span><strong>{activeStudent?.batch || "--"}</strong></div>
          <div className="profile-row"><span>Gender</span><strong>{activeStudent?.gender || "--"}</strong></div>
          <div className="profile-row"><span>Total Courses</span><strong>{activeStudent?.registeredCourseCount ?? activeStudent?.percent ?? 0}</strong></div>
          <div className="nominal-progress-track"><div className="nominal-progress-fill" style={{ width: `${Math.min(Number(activeStudent?.registeredCourseCount ?? activeStudent?.percent ?? 0) * 8, 100)}%` }} /></div>
        </aside>

        <section className="nominal-table-wrap" ref={menuRef}>
          <table className="nominal-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Status</th>
                <th>Candidate</th>
                <th>Reg. No.</th>
                <th>ACY</th>
                <th>%</th>
                <th>Hall Ticket</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.ticket}
                  className={selectedTicket === row.ticket ? "selected-row" : ""}
                  onClick={() => setSelectedTicket(row.ticket)}
                >
                  <td>{row.ticket}</td>
                  <td>
                    <span className="pill-ok"><FiCheck /></span>
                  </td>
                  <td>
                    <p className="candidate-roll">{row.rollNo} <span className="candidate-tag">STU</span></p>
                    <p className="candidate-name">{row.name}</p>
                  </td>
                  <td>{row.regNo}</td>
                  <td>
                    {row.acy}
                    <span className="pill-light">Even</span>
                    <span>{row.batch}</span>
                  </td>
                  <td>{row.percent}</td>
                  <td>
                    <span className={row.hallTicketStatus === "ready" ? "pill-ok" : "pill-block"}>
                      {row.hallTicketStatus === "ready" ? <FiCheck /> : <FiClock />}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="dots-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTicket(row.ticket);
                        setOpenMenuFor((prev) => (prev === row.ticket ? null : row.ticket));
                      }}
                    >
                      <FiMoreVertical />
                    </button>

                    {openMenuFor === row.ticket && (
                      <div className="action-menu">
                        <button type="button" onClick={() => { setOpenMenuFor(null); openCourses(row, "internals"); }}>
                          <FiEye /> Internal Marks and Exam Schedule
                        </button>
                        <button type="button" onClick={() => { setOpenMenuFor(null); openCourses(row, "courses"); }}>
                          <FiEye /> List of Courses
                        </button>
                        <button type="button" onClick={() => { setOpenMenuFor(null); downloadNominal(row); }}>
                          <FiDownload /> Download
                        </button>
                        <button type="button" onClick={() => { setOpenMenuFor(null); openHistory(row); }}>
                          <FiClock /> History
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="no-records">No nominal roll records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {historyOpen && (
        <div className="nominal-modal" role="dialog" aria-modal="true">
          <div className="nominal-modal-card">
            <div className="nominal-modal-header">
              <h3>Nominal Roll History</h3>
              <button type="button" className="nominal-ghost-btn" onClick={() => setHistoryOpen(false)}>
                Close
              </button>
            </div>
            <ul className="history-list">
              {historyRows.map((item, index) => (
                <li key={`${item.at}-${index}`}>
                  <p>{item.action}</p>
                  <small>{item.by} • {item.at}</small>
                </li>
              ))}
              {historyRows.length === 0 && <li>No history available.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
