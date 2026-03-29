import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAttendanceHistory, submitAttendance } from "../../services/facultyService";
import { getCfacStudents } from "../../services/cfacService";
import "./AttendanceManage.css";

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const getPreviousDate = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const mapStudentsFromApi = (rows = []) =>
  rows.map((student) => ({
    studentId: Number(student.id),
    rollNo: String(student.roll_no || student.id || "").trim().toUpperCase(),
    name: String(student.name || "").trim().toUpperCase(),
  }));

export default function AttendanceManage() {
  const { user, token } = useAuth();
  const [date, setDate] = useState(getTodayDate());
  const [subject, setSubject] = useState("General");
  const [periodNo, setPeriodNo] = useState("1");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [statusById, setStatusById] = useState({});
  const [newRollNo, setNewRollNo] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [historyDate, setHistoryDate] = useState(getTodayDate());
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyInfo, setHistoryInfo] = useState("");

  useEffect(() => {
    const bootstrapStudents = async () => {
      if (!user?.id || !token) return;
      await loadClassStudents(true);
    };

    bootstrapStudents();
  }, [user?.id, token]);

  const loadClassStudents = async (silent = false) => {
    if (!token) {
      if (!silent) setMessage("Login session missing. Please login again.");
      return;
    }

    try {
      const response = await getCfacStudents(token);
      const mapped = mapStudentsFromApi(Array.isArray(response?.students) ? response.students : []);

      setStudents(mapped);
      setStatusById((prev) =>
        mapped.reduce((acc, student) => {
          acc[student.studentId] = prev[student.studentId] || "present";
          return acc;
        }, {})
      );

      if (!silent) {
        setMessage(
          mapped.length > 0
            ? `Loaded ${mapped.length} students from your controlled class list.`
            : "No students are assigned to your controlled list."
        );
      }
    } catch (error) {
      if (!silent) setMessage(error?.message || "Unable to load your controlled students list.");
    }
  };

  const resetToDefaultClassStudents = async () => {
    await loadClassStudents();
  };

  const filteredStudents = useMemo(() => {
    const searchKey = search.trim().toLowerCase();
    if (!searchKey) return students;

    return students.filter(
      (student) =>
        student.rollNo.toLowerCase().includes(searchKey) ||
        student.name.toLowerCase().includes(searchKey)
    );
  }, [search, students]);

  const presentCount = useMemo(
    () => students.filter((student) => statusById[student.studentId] === "present").length,
    [students, statusById]
  );

  const absentCount = students.length - presentCount;

  const historyPresent = useMemo(
    () => historyRows.filter((entry) => entry.status === "present").length,
    [historyRows]
  );

  const historyAbsent = useMemo(
    () => historyRows.filter((entry) => entry.status === "absent").length,
    [historyRows]
  );

  const historyOnduty = useMemo(
    () => historyRows.filter((entry) => entry.status === "on-duty").length,
    [historyRows]
  );

  const markAll = (status) => {
    const next = students.reduce((acc, student) => {
      acc[student.studentId] = status;
      return acc;
    }, {});
    setStatusById(next);
  };

  const exportAttendanceByStatus = (targetStatus) => {
    if (students.length === 0) {
      setMessage("Load or create class list before export.");
      return;
    }

    const rows = students
      .filter((student) => (statusById[student.studentId] || "present") === targetStatus)
      .map((student) => [
        date,
        `Period ${periodNo}`,
        subject,
        student.rollNo,
        student.name,
        targetStatus,
      ]);

    if (rows.length === 0) {
      setMessage(`No students marked as ${targetStatus} for export.`);
      return;
    }

    const header = ["Date", "Period", "Subject", "Roll No", "Student Name", "Status"];
    const csv = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${targetStatus}-list-${date}-period-${periodNo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  const addStudentToClass = () => {
    const rollNo = newRollNo.trim().toUpperCase();
    const name = newStudentName.trim().toUpperCase();

    if (!rollNo || !name) {
      setMessage("Enter both Roll No and Student Name before adding.");
      return;
    }

    const duplicateRoll = students.some((student) => student.rollNo.toUpperCase() === rollNo);
    if (duplicateRoll) {
      setMessage("Roll No already exists in class list.");
      return;
    }

    const nextStudentId =
      students.length > 0 ? Math.max(...students.map((student) => Number(student.studentId))) + 1 : 1;

    const nextStudent = { studentId: nextStudentId, rollNo, name };
    setStudents((prev) => [...prev, nextStudent]);
    setStatusById((prev) => ({ ...prev, [nextStudentId]: "present" }));
    setNewRollNo("");
    setNewStudentName("");
    setMessage(`${rollNo} added to class list.`);
  };

  const updateStudentField = (studentId, field, value) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.studentId === studentId
          ? {
              ...student,
              [field]: field === "rollNo" ? String(value).toUpperCase() : value,
            }
          : student
      )
    );
  };

  const removeStudentFromClass = (studentId) => {
    setStudents((prev) => prev.filter((student) => student.studentId !== studentId));
    setStatusById((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    setMessage("Student removed from class list.");
  };

  const handleAttendanceSubmit = async () => {
    if (!user?.id || !token) {
      setMessage("Login session missing. Please login again.");
      return;
    }

    if (students.length === 0) {
      setMessage("Load class students before submitting attendance.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const facultyId = user.id;
      const subjectWithPeriod = `P${periodNo} - ${subject}`;
      const requests = students.map((student) =>
        submitAttendance(
          facultyId,
          {
            studentId: student.studentId,
            rollNo: student.rollNo,
            studentName: student.name,
            date,
            status: statusById[student.studentId] || "present",
            subject: subjectWithPeriod,
          },
          token
        )
      );

      await Promise.all(requests);
      setMessage(`Attendance submitted for ${students.length} students on ${date}.`);
      setHistoryDate(date);
      await loadAttendanceHistory(date, { applyToGrid: false, silent: true });
    } catch (err) {
      setMessage(err?.message || "Unable to submit attendance");
    } finally {
      setSaving(false);
    }
  };

  const loadAttendanceHistory = async (targetDate, options = {}) => {
    const { applyToGrid = false, silent = false } = options;

    if (!user?.id || !token) {
      if (!silent) setHistoryInfo("Login session missing. Please login again.");
      return;
    }

    if (!targetDate) {
      if (!silent) setHistoryInfo("Select a date to view attendance history.");
      return;
    }

    try {
      setHistoryLoading(true);
      if (!silent) setHistoryInfo("");

      const response = await getAttendanceHistory(user.id, token, { date: targetDate });
      const rows = Array.isArray(response?.attendance) ? response.attendance : [];
      setHistoryRows(rows);

      const subjectWithPeriod = `P${periodNo} - ${subject}`;
      const preferredRows = rows.filter((row) => row.subject === subjectWithPeriod);
      const rowsToApply = preferredRows.length > 0 ? preferredRows : rows;

      if (applyToGrid && students.length > 0 && rowsToApply.length > 0) {
        const byStudentId = new Map(rowsToApply.map((row) => [Number(row.studentId), String(row.status || "present")]));
        setStatusById((prev) => {
          const next = { ...prev };
          students.forEach((student) => {
            const status = byStudentId.get(Number(student.studentId));
            if (status) {
              next[student.studentId] = status;
            }
          });
          return next;
        });

        if (!silent) {
          const appliedCount = students.filter((student) => byStudentId.has(Number(student.studentId))).length;
          setHistoryInfo(
            appliedCount > 0
              ? `Loaded ${appliedCount} records from ${targetDate} into the current marking grid.`
              : `History found for ${targetDate}, but no matching students in current class list.`
          );
        }
      } else if (!silent) {
        setHistoryInfo(
          rows.length > 0
            ? `Showing ${rows.length} attendance records for ${targetDate}.`
            : `No attendance records found for ${targetDate}.`
        );
      }
    } catch (err) {
      if (!silent) setHistoryInfo(err?.message || "Unable to fetch attendance history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadSelectedDay = async (applyToGrid = false) => {
    await loadAttendanceHistory(historyDate, { applyToGrid });
  };

  const handleLoadPreviousDay = async () => {
    const prevDate = getPreviousDate(historyDate || date);
    setHistoryDate(prevDate);
    setDate(prevDate);
    await loadAttendanceHistory(prevDate, { applyToGrid: true });
  };

  return (
    <div className="faculty-page-wrap attendance-page-wrap">
      <h1 className="faculty-title">Attendance Control</h1>
      <p className="faculty-subtitle">Load your controlled class students and mark attendance day by day.</p>

      <div className="class-editor-wrap">
        <h2 className="class-editor-title">Editable Class List</h2>
        <div className="class-editor-grid">
          <label>
            Roll No
            <input
              type="text"
              value={newRollNo}
              onChange={(e) => setNewRollNo(e.target.value)}
              placeholder="24CB071"
            />
          </label>

          <label>
            Student Name
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Student Name"
            />
          </label>

          <button type="button" className="secondary-btn" onClick={addStudentToClass}>
            Add Student
          </button>
          <button type="button" className="secondary-btn" onClick={resetToDefaultClassStudents}>
            Reset Default 75
          </button>
        </div>
      </div>

      <div className="attendance-toolbar">
        <button type="button" className="primary-btn" onClick={() => loadClassStudents()}>
          Load My Controlled Students
        </button>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setHistoryDate(e.target.value);
            }}
          />
        </label>

        <label>
          Subject
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject Name"
          />
        </label>

        <label>
          Period
          <select value={periodNo} onChange={(e) => setPeriodNo(e.target.value)}>
            <option value="1">Period 1</option>
            <option value="2">Period 2</option>
            <option value="3">Period 3</option>
            <option value="4">Period 4</option>
            <option value="5">Period 5</option>
            <option value="6">Period 6</option>
            <option value="7">Period 7</option>
          </select>
        </label>

        <label>
          Search Student
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Roll no or name"
          />
        </label>
      </div>

      <div className="attendance-summary-row">
        <div className="attendance-chip">Total: {students.length}</div>
        <div className="attendance-chip present">Present: {presentCount}</div>
        <div className="attendance-chip absent">Absent: {absentCount}</div>

        <button type="button" className="secondary-btn" onClick={() => markAll("present")}>
          Mark All Present
        </button>
        <button type="button" className="secondary-btn" onClick={() => markAll("absent")}>
          Mark All Absent
        </button>
        <button type="button" className="secondary-btn" onClick={() => exportAttendanceByStatus("present")}>
          Export Present List
        </button>
        <button type="button" className="secondary-btn" onClick={() => exportAttendanceByStatus("absent")}>
          Export Absent List
        </button>
      </div>

      {message && <p className="attendance-message">{message}</p>}

      <div className="attendance-history-wrap">
        <div className="attendance-history-toolbar">
          <label>
            View Past Date
            <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} />
          </label>

          <button type="button" className="secondary-btn" onClick={() => handleLoadSelectedDay(false)} disabled={historyLoading}>
            {historyLoading ? "Loading..." : "View Selected Date"}
          </button>

          <button type="button" className="secondary-btn" onClick={handleLoadPreviousDay} disabled={historyLoading}>
            Load Previous Day to Grid
          </button>

          <button type="button" className="secondary-btn" onClick={() => handleLoadSelectedDay(true)} disabled={historyLoading}>
            Apply Selected Date to Grid
          </button>
        </div>

        <div className="attendance-summary-row attendance-history-summary-row">
          <div className="attendance-chip">History Total: {historyRows.length}</div>
          <div className="attendance-chip present">Present: {historyPresent}</div>
          <div className="attendance-chip absent">Absent: {historyAbsent}</div>
          <div className="attendance-chip">On Duty: {historyOnduty}</div>
        </div>

        {historyInfo && <p className="attendance-message">{historyInfo}</p>}

        <div className="attendance-history-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject / Period</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan="5">No past-day attendance loaded yet.</td>
                </tr>
              ) : (
                historyRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.subject}</td>
                    <td>{row.rollNo || "-"}</td>
                    <td>{row.studentName || "-"}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Roll No</th>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student, index) => (
            <tr key={student.studentId}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="text"
                  className="student-inline-input"
                  value={student.rollNo}
                  onChange={(e) => updateStudentField(student.studentId, "rollNo", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="student-inline-input"
                  value={student.name}
                  onChange={(e) => updateStudentField(student.studentId, "name", e.target.value)}
                />
              </td>
              <td>
                <select
                  value={statusById[student.studentId] || "present"}
                  onChange={(e) =>
                    setStatusById((prev) => ({
                      ...prev,
                      [student.studentId]: e.target.value,
                    }))
                  }
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </td>
              <td>
                <button
                  type="button"
                  className="remove-student-btn"
                  onClick={() => removeStudentFromClass(student.studentId)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="attendance-submit-wrap">
        <button type="button" className="primary-btn" onClick={handleAttendanceSubmit} disabled={saving}>
          {saving ? "Submitting..." : "Submit Attendance"}
        </button>
      </div>
    </div>
  );
}
