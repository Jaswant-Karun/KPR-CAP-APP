import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getStudents,
  getFaculty,
  getFacultyControlledStudents,
  getFacultyControlMap,
  saveFacultyControlMap,
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
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [controlledStudents, setControlledStudents] = useState([]);
  const [mapBatch, setMapBatch] = useState("");
  const [mapSection, setMapSection] = useState("");
  const [mappedStudentIds, setMappedStudentIds] = useState([]);
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

  const viewFacultyStudents = async (faculty) => {
    try {
      const [res, mappingRes] = await Promise.all([
        getFacultyControlledStudents(faculty.id, token),
        getFacultyControlMap(faculty.id, token),
      ]);

      setSelectedFaculty(res?.faculty || faculty);
      setControlledStudents(res?.students || []);
      setMapBatch(mappingRes?.mapping?.batch || "");
      setMapSection(mappingRes?.mapping?.section || "");
      setMappedStudentIds(mappingRes?.mapping?.studentIds || (res?.students || []).map((student) => student.id));
      setMessage("");
    } catch (err) {
      setMessage(err?.message || "Failed to fetch students under selected faculty");
    }
  };

  const toggleMappedStudent = (studentId) => {
    setMappedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const saveMapping = async () => {
    if (!selectedFaculty) {
      setMessage("Select faculty first");
      return;
    }

    if (mappedStudentIds.length === 0) {
      setMessage("Select at least one student for mapping");
      return;
    }

    try {
      await saveFacultyControlMap(
        selectedFaculty.id,
        {
          batch: mapBatch,
          section: mapSection,
          studentIds: mappedStudentIds,
        },
        token
      );
      setMessage("Faculty-student mapping saved by batch/section.");
      await viewFacultyStudents(selectedFaculty);
    } catch (err) {
      setMessage(err?.message || "Failed to save mapping");
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
                            {roleFilter === "faculty" && (
                              <button className="admin-btn" type="button" onClick={() => viewFacultyStudents(item)}>
                                View Controlled Students
                              </button>
                            )}
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

      {roleFilter === "faculty" && selectedFaculty && (
        <section className="admin-panel mt-4">
          <h2 className="admin-page-title" style={{ fontSize: "1.1rem" }}>
            {selectedFaculty.name} - Students Under Control ({controlledStudents.length})
          </h2>

          <div className="admin-toolbar" style={{ marginBottom: "0.8rem" }}>
            <input
              className="admin-input"
              placeholder="Batch (example: II (2025-26) Even)"
              value={mapBatch}
              onChange={(e) => setMapBatch(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Section (example: A)"
              value={mapSection}
              onChange={(e) => setMapSection(e.target.value)}
            />
            <button className="admin-btn" type="button" onClick={saveMapping}>
              Save Batch/Section Mapping
            </button>
          </div>

          <div className="admin-table-wrap" style={{ marginBottom: "0.8rem" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>ID</th>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={`map-${student.id}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={mappedStudentIds.includes(student.id)}
                        onChange={() => toggleMappedStudent(student.id)}
                      />
                    </td>
                    <td>{student.id}</td>
                    <td>{student.roll_no}</td>
                    <td>{student.name}</td>
                    <td>{student.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {controlledStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5">No students mapped to this faculty.</td>
                  </tr>
                ) : (
                  controlledStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.roll_no}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.department}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
