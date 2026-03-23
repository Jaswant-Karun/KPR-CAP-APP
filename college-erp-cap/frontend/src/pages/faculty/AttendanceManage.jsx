import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { submitAttendance } from "../../services/facultyService";
import { FACULTY_CLASS_STUDENTS } from "../../utils/facultyClassStudents";
import "./AttendanceManage.css";

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const CLASS_LIST_STORAGE_KEY = "facultyClassStudentsEditable";

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

  useEffect(() => {
    const saved = localStorage.getItem(CLASS_LIST_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const normalized = parsed.map((student, index) => ({
        studentId: Number(student.studentId) || index + 1,
        rollNo: String(student.rollNo || "").trim(),
        name: String(student.name || "").trim(),
      }));

      const defaultStatus = normalized.reduce((acc, student) => {
        acc[student.studentId] = "present";
        return acc;
      }, {});

      setStudents(normalized);
      setStatusById(defaultStatus);
      setMessage("Editable class list restored from previous session.");
    } catch {
      setMessage("Could not restore saved class list. Use Load My Class Students.");
    }
  }, []);

  useEffect(() => {
    if (students.length === 0) return;
    localStorage.setItem(CLASS_LIST_STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const loadClassStudents = () => {
    const defaultStatus = FACULTY_CLASS_STUDENTS.reduce((acc, student) => {
      acc[student.studentId] = "present";
      return acc;
    }, {});

    setStudents(FACULTY_CLASS_STUDENTS);
    setStatusById(defaultStatus);
    setMessage("Class list loaded successfully. You can now mark attendance.");
  };

  const resetToDefaultClassStudents = () => {
    setStudents(FACULTY_CLASS_STUDENTS);
    const defaultStatus = FACULTY_CLASS_STUDENTS.reduce((acc, student) => {
      acc[student.studentId] = statusById[student.studentId] || "present";
      return acc;
    }, {});
    setStatusById(defaultStatus);
    localStorage.setItem(CLASS_LIST_STORAGE_KEY, JSON.stringify(FACULTY_CLASS_STUDENTS));
    setMessage("Class list reset to the original 75 students.");
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
    } catch (err) {
      setMessage(err?.message || "Unable to submit attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="faculty-page-wrap attendance-page-wrap">
      <h1 className="faculty-title">Attendance Control</h1>
      <p className="faculty-subtitle">Load your class students and mark attendance for all 75 students.</p>

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
        <button type="button" className="primary-btn" onClick={loadClassStudents}>
          Load My Class Students (75)
        </button>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
