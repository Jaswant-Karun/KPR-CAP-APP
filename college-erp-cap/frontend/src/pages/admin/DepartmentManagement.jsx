import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getFaculty, getStudents } from "../../services/adminService";
import "./AdminPages.css";

export default function DepartmentManagement() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selected, setSelected] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, f] = await Promise.all([getStudents(token), getFaculty(token)]);
        setStudents(s?.students || []);
        setFaculty(f?.faculty || []);
      } catch (err) {
        setMessage(err?.message || "Failed to load departments");
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  const departmentRows = useMemo(() => {
    const map = new Map();

    students.forEach((item) => {
      const key = item.department || "Unassigned";
      const row = map.get(key) || { department: key, students: 0, faculty: 0 };
      row.students += 1;
      map.set(key, row);
    });

    faculty.forEach((item) => {
      const key = item.department || "Unassigned";
      const row = map.get(key) || { department: key, students: 0, faculty: 0 };
      row.faculty += 1;
      map.set(key, row);
    });

    return Array.from(map.values()).sort((a, b) => a.department.localeCompare(b.department));
  }, [students, faculty]);

  const filtered = selected === "all"
    ? departmentRows
    : departmentRows.filter((row) => row.department === selected);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Department Management</h1>
      <p className="admin-page-subtitle">Department-level control for students and faculty assignment coverage.</p>

      <div className="admin-toolbar">
        <select className="admin-select" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="all">All Departments</option>
          {departmentRows.map((row) => (
            <option key={row.department} value={row.department}>{row.department}</option>
          ))}
        </select>
        <button className="admin-btn" type="button" onClick={() => setSelected("all")}>Reset Filter</button>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Students</th>
                <th>Faculty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4">No departments found.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    <td>{row.students}</td>
                    <td>{row.faculty}</td>
                    <td>{row.students + row.faculty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
