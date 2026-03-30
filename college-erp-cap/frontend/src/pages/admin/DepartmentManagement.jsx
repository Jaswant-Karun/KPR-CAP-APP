import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getFaculty, getStudents } from "../../services/adminService";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../../services/departmentService";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import "./AdminPages.css";

export default function DepartmentManagement() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState("all");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: null, code: "", name: "", shortName: "", description: "" });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, f, d] = await Promise.all([
        getStudents(token),
        getFaculty(token),
        getDepartments(token),
      ]);
      setStudents(s?.students || []);
      setFaculty(f?.faculty || []);
      setDepartments(d?.departments || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load data");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const departmentStats = useMemo(() => {
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

  const filteredStats = selected === "all"
    ? departmentStats
    : departmentStats.filter((row) => row.department === selected);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setMessage("Code and name are required");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      if (formData.id) {
        await updateDepartment(formData.id, {
          name: formData.name,
          shortName: formData.shortName,
          description: formData.description,
        }, token);
        setMessage("Department updated successfully");
      } else {
        await createDepartment({
          code: formData.code.toUpperCase(),
          name: formData.name,
          shortName: formData.shortName || formData.code.toUpperCase(),
          description: formData.description,
        }, token);
        setMessage("Department created successfully");
      }
      setMessageType("success");
      setShowForm(false);
      setFormData({ id: null, code: "", name: "", shortName: "", description: "" });
      await loadData();
    } catch (err) {
      setMessage(err?.message || "Failed to save department");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setFormData({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      shortName: dept.shortName || "",
      description: dept.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    
    try {
      setLoading(true);
      await deleteDepartment(id, token);
      setMessage("Department deleted successfully");
      setMessageType("success");
      await loadData();
    } catch (err) {
      setMessage(err?.message || "Failed to delete department");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Institution Units (Departments)</h1>
      <p className="admin-page-subtitle">Manage academic departments and view staff/student assignments.</p>

      {message && <div className={`admin-message ${messageType}`}>{message}</div>}

      <div className="admin-toolbar">
        <select 
          className="admin-select" 
          value={selected} 
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departmentStats.map((row) => (
            <option key={row.department} value={row.department}>{row.department}</option>
          ))}
        </select>
        <button 
          className="admin-btn" 
          type="button" 
          onClick={() => setSelected("all")}
        >
          Reset Filter
        </button>
        <button 
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setFormData({ id: null, code: "", name: "", shortName: "", description: "" });
            setShowForm(!showForm);
          }}
        >
          <FaPlus /> Add Department
        </button>
      </div>

      {showForm && (
        <section className="admin-form-section">
          <h3>Add/Edit Department</h3>
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={formData.id !== null}
                maxLength="20"
              />
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength="160"
              />
            </div>
            <div className="form-group">
              <label>Short Name</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                maxLength="40"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                {formData.id ? "Update" : "Create"}
              </button>
              <button 
                type="button" 
                className="admin-btn" 
                onClick={() => {
                  setShowForm(false);
                  setFormData({ id: null, code: "", name: "", shortName: "", description: "" });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-panel">
        <h3>All Departments</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Short Name</th>
                <th>Students</th>
                <th>Faculty</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="7">No departments found.</td>
                </tr>
              ) : (
                departments.map((dept) => {
                  const stats = departmentStats.find((s) => s.department === dept.name) || { students: 0, faculty: 0 };
                  return (
                    <tr key={dept.id}>
                      <td>{dept.code}</td>
                      <td>{dept.name}</td>
                      <td>{dept.shortName || "-"}</td>
                      <td>{stats.students}</td>
                      <td>{stats.faculty}</td>
                      <td>{stats.students + stats.faculty}</td>
                      <td>
                        <button 
                          className="table-btn" 
                          onClick={() => handleEdit(dept)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="table-btn table-btn-danger"
                          onClick={() => handleDelete(dept.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <h3>Department Statistics</h3>
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
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan="4">No data found.</td>
                </tr>
              ) : (
                filteredStats.map((row) => (
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
    </div>
  );
}
