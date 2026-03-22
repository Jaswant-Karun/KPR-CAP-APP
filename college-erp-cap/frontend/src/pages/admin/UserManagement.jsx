import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getStudents,
  getFaculty,
  removeFaculty,
  removeStudent,
  updateFaculty,
  updateStudent,
} from "../../services/adminService";
import "./AdminPages.css";

export default function UserManagement() {
  const { token } = useAuth();
  const [roleFilter, setRoleFilter] = useState("student");
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", department: "", rollNo: "" });
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [s, f] = await Promise.all([getStudents(token), getFaculty(token)]);
      setStudents(s?.students || []);
      setFaculty(f?.faculty || []);
      setMessage("");
    } catch (err) {
      setMessage(err?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  const rows = useMemo(() => {
    const source = roleFilter === "student" ? students : faculty;
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return source;
    }
    return source.filter((item) => {
      return (
        String(item.name || "").toLowerCase().includes(normalized) ||
        String(item.email || "").toLowerCase().includes(normalized) ||
        String(item.department || "").toLowerCase().includes(normalized)
      );
    });
  }, [students, faculty, roleFilter, query]);

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name || "",
      email: item.email || "",
      department: item.department || "",
      rollNo: item.roll_no || "",
    });
  };

  const saveEdit = async (id) => {
    try {
      if (roleFilter === "student") {
        await updateStudent(id, form, token);
      } else {
        await updateFaculty(id, form, token);
      }
      setEditing(null);
      setMessage("User updated successfully");
      await load();
    } catch (err) {
      setMessage(err?.message || "Update failed");
    }
  };

  const deleteUser = async (id) => {
    try {
      if (roleFilter === "student") {
        await removeStudent(id, token);
      } else {
        await removeFaculty(id, token);
      }
      setMessage("User deleted successfully");
      await load();
    } catch (err) {
      setMessage(err?.message || "Delete failed");
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">User Management</h1>
      <p className="admin-page-subtitle">Admin has full control over student and faculty records.</p>

      <div className="admin-toolbar">
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
        </select>
        <input
          className="admin-input"
          placeholder="Search by name, email, department"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="admin-btn" type="button" onClick={load}>Refresh</button>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Roll No</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6">No users found.</td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{editing === item.id ? <input className="admin-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /> : item.name}</td>
                    <td>{editing === item.id ? <input className="admin-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /> : item.email}</td>
                    <td>{editing === item.id ? <input className="admin-input" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /> : item.department}</td>
                    <td>{editing === item.id ? <input className="admin-input" value={form.rollNo} onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))} /> : item.roll_no}</td>
                    <td>
                      <div className="admin-flex">
                        {editing === item.id ? (
                          <>
                            <button className="admin-btn" type="button" onClick={() => saveEdit(item.id)}>Save</button>
                            <button className="admin-btn" type="button" onClick={() => setEditing(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="admin-btn" type="button" onClick={() => startEdit(item)}>Edit</button>
                            <button className="admin-btn warn" type="button" onClick={() => deleteUser(item.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
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
