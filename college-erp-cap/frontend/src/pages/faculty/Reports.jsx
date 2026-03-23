import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getReports } from "../../services/facultyService";
import { FACULTY_CLASS_STUDENTS } from "../../utils/facultyClassStudents";
import "./Reports.css";

export default function Reports() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({ totalAttendanceEntries: 0, attendance: [] });
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const studentLookup = useMemo(() => {
    const map = new Map();
    for (const student of FACULTY_CLASS_STUDENTS) {
      map.set(student.studentId, student);
    }
    return map;
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id || !token) return;

      try {
        const response = await getReports(user.id, token);
        setSummary(response || { totalAttendanceEntries: 0, attendance: [] });
      } catch (err) {
        setError(err?.message || "Unable to load report data");
      }
    };

    fetchReports();
  }, [user?.id, token]);

  const subjectOptions = useMemo(() => {
    const list = new Set();
    for (const row of summary.attendance || []) {
      if (row.subject) list.add(row.subject);
    }
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [summary.attendance]);

  const filteredAttendance = useMemo(() => {
    const rows = summary.attendance || [];
    return rows.filter((row) => {
      const byDate = !dateFilter || row.date === dateFilter;
      const bySubject = subjectFilter === "all" || row.subject === subjectFilter;
      return byDate && bySubject;
    });
  }, [summary.attendance, dateFilter, subjectFilter]);

  const handleExportCsv = () => {
    if (filteredAttendance.length === 0) return;

    const header = ["Date", "Subject", "Roll No", "Student Name", "Status"];
    const rows = filteredAttendance.map((item) => {
      const student = studentLookup.get(Number(item.studentId));
      const rollNo = student?.rollNo || `ID-${item.studentId}`;
      const name = student?.name || "Unknown Student";

      return [item.date || "", item.subject || "", rollNo, name, item.status || ""];
    });

    const csv = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `attendance-report-${dateFilter || "all-dates"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="faculty-page-wrap">
      <h1 className="faculty-title">Reports</h1>
      <p className="faculty-subtitle">Attendance submissions with date-wise and subject-wise history.</p>

      {error && <p className="report-error">{error}</p>}

      <ul className="report-list">
        <li>Total Attendance Records: {summary.totalAttendanceEntries}</li>
        <li>Filtered Entries: {filteredAttendance.length}</li>
        <li>Faculty Control: Active for Class Strength 75</li>
      </ul>

      <div className="report-filters">
        <label>
          Date
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </label>

        <label>
          Subject
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="all">All Subjects</option>
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="report-btn" onClick={handleExportCsv}>
          Export Daily Attendance (Excel CSV)
        </button>
      </div>

      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan="5">No attendance records for selected filters.</td>
              </tr>
            ) : (
              filteredAttendance.map((item) => {
                const student = studentLookup.get(Number(item.studentId));
                return (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.subject || "General"}</td>
                    <td>{student?.rollNo || `ID-${item.studentId}`}</td>
                    <td>{student?.name || "Unknown Student"}</td>
                    <td className={item.status === "present" ? "status-present" : "status-absent"}>
                      {item.status}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
