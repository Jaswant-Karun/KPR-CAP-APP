import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  createCourse,
  getCoursesByFaculty,
  getCoursesByDepartment,
  getCourseEnrollments,
} from "../../services/courseService";
import { getDepartments } from "../../services/departmentService";
import { FiPlus, FiUsers, FiBook, FiRefreshCw, FiX, FiEye } from "react-icons/fi";
import "./FacultyCourseMgmt.css";

const CATEGORIES = ["Theory", "Lab", "Professional Elective", "PCC", "EEC", "OEC", "BSC", "MOOC", "NCC", "Other"];
const FALLBACK_DEPARTMENTS = [
  "Computer Science and Business Systems",
  "Computer Science and Engineering",
  "Artificial Intelligence and Data Science",
  "Artificial Intelligence and Machine Learning",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Biomedical Engineering",
  "Cybersecurity Engineering",
];

export default function FacultyCourseMgmt() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState(FALLBACK_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [showEnrollments, setShowEnrollments] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credits: 3,
    semester: 5,
    category: "",
    department: user?.department || FALLBACK_DEPARTMENTS[0],
    capacity: 75,
    description: "",
  });

  useEffect(() => {
    if (token) loadInitialData();
  }, [token]);

  useEffect(() => {
    if (!formData.department && departmentOptions.length > 0) {
      setFormData((prev) => ({ ...prev, department: departmentOptions[0] }));
    }
  }, [departmentOptions]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [courseResponse, departmentResponse] = await Promise.all([
        getCoursesByFaculty(token),
        getDepartments(token).catch(() => ({ departments: [] })),
      ]);

      let fetchedCourses = courseResponse?.courses || [];

      // If no courses found by faculty_id/name match, fall back to department courses
      if (fetchedCourses.length === 0 && user?.department) {
        const deptResp = await getCoursesByDepartment(user.department, "", token).catch(() => ({ courses: [] }));
        fetchedCourses = deptResp?.courses || [];
      }

      setCourses(fetchedCourses);

      const apiDepartments = (departmentResponse?.departments || []).map((r) => r?.name).filter(Boolean);
      const merged = [...new Set([...apiDepartments, ...FALLBACK_DEPARTMENTS])];
      setDepartmentOptions(merged);
      setMessage("");
    } catch (error) {
      console.error("Error loading course data:", error);
      setMessage(error?.message || "Failed to load courses");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.department) {
      setMessage("Course code, name, and department are required");
      setMessageType("error");
      return;
    }
    try {
      setLoading(true);
      const response = await createCourse(formData, token);
      setCourses((prev) => [response.course, ...prev]);
      setMessage("Course created successfully");
      setMessageType("success");
      setShowForm(false);
      setFormData({
        code: "",
        name: "",
        credits: 3,
        semester: 5,
        category: "",
        department: user?.department || departmentOptions[0] || FALLBACK_DEPARTMENTS[0],
        capacity: 75,
        description: "",
      });
    } catch (error) {
      setMessage(error?.message || "Failed to create course");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEnrollments = async (course) => {
    try {
      setEnrollmentsLoading(true);
      setSelectedCourse(course);
      setEnrollments([]);
      setShowEnrollments(true);
      const response = await getCourseEnrollments(course.id, token);
      setEnrollments(response?.enrollments || []);
      setMessage("");
    } catch (error) {
      setMessage(error?.message || "Failed to load enrollments");
      setMessageType("error");
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["credits", "semester", "capacity"].includes(name) ? Number(value) : value,
    }));
  };

  return (
    <div className="faculty-course-mgmt-container">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h1>Course Management</h1>
          <p className="mgmt-subtitle">
            {courses.length} course{courses.length !== 1 ? "s" : ""} assigned · Semester 5
          </p>
        </div>
        <div className="mgmt-header-actions">
          <button className="btn-refresh" onClick={loadInitialData} disabled={loading} title="Refresh">
            <FiRefreshCw size={16} />
          </button>
          <button className="btn-create-course" onClick={() => setShowForm(!showForm)} disabled={loading}>
            <FiPlus size={18} /> Create Course
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage("")} className="close-msg"><FiX size={14} /></button>
        </div>
      )}

      {/* Create Course Form */}
      {showForm && (
        <div className="course-form">
          <h2>Create New Course</h2>
          <form onSubmit={handleCreateCourse}>
            <div className="form-row">
              <div className="form-group">
                <label>Course Code *</label>
                <input type="text" name="code" placeholder="e.g., U21CB505"
                  value={formData.code} onChange={handleFormChange} required disabled={loading} />
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input type="text" name="name" placeholder="e.g., Compiler Design"
                  value={formData.name} onChange={handleFormChange} required disabled={loading} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Credits</label>
                <input type="number" name="credits" min="1" max="10"
                  value={formData.credits} onChange={handleFormChange} disabled={loading} />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <input type="number" name="semester" min="1" max="8"
                  value={formData.semester} onChange={handleFormChange} disabled={loading} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleFormChange} disabled={loading}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select name="department" value={formData.department} onChange={handleFormChange} disabled={loading}>
                  {departmentOptions.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" name="capacity" min="1" max="500"
                  value={formData.capacity} onChange={handleFormChange} disabled={loading} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" placeholder="Course description..." rows="3"
                value={formData.description} onChange={handleFormChange}
                disabled={loading} style={{ resize: "vertical" }} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>Create Course</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={loading}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Course Cards */}
      <div className="courses-section">
        <h2>Your Courses ({courses.length})</h2>

        {loading && courses.length === 0 ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length > 0 ? (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-card-top">
                  <div className="course-card-identity">
                    <span className="course-card-code">{course.code}</span>
                    <p className="course-name">{course.name}</p>
                  </div>
                  <span className={`status-pill ${course.status}`}>{course.status}</span>
                </div>

                <div className="course-meta-row">
                  <span className="meta-chip"><FiBook size={13} /> {course.credits} Cr</span>
                  {course.category && <span className="meta-chip cat">{course.category}</span>}
                  {course.semester && <span className="meta-chip">Sem {course.semester}</span>}
                  {course.facultyName && <span className="meta-chip fac">{course.facultyName}</span>}
                </div>

                <div className="course-enrollment-bar">
                  <div className="enroll-numbers">
                    <span><FiUsers size={13} /> {course.enrolled}/{course.capacity} enrolled</span>
                    <span className="enroll-pct">
                      {Math.round((course.enrolled / course.capacity) * 100)}%
                    </span>
                  </div>
                  <div className="enroll-track">
                    <div
                      className="enroll-fill"
                      style={{ width: `${Math.min(100, Math.round((course.enrolled / course.capacity) * 100))}%` }}
                    />
                  </div>
                </div>

                {course.description && (
                  <p className="course-desc">{course.description}</p>
                )}

                <button
                  className="btn-view-enrollments"
                  onClick={() => handleViewEnrollments(course)}
                  disabled={loading}
                >
                  <FiEye size={15} /> View Enrolled Students
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses assigned yet for your department.</p>
            <p>Use "Create Course" to add a new one, or contact admin to seed courses.</p>
          </div>
        )}
      </div>

      {/* Enrollments Modal */}
      {showEnrollments && selectedCourse && (
        <div className="enrollments-modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setShowEnrollments(false)} />
          <div className="modal-box">
            <div className="modal-head">
              <div>
                <h2 className="modal-course-code">{selectedCourse.code}</h2>
                <p className="modal-course-name">{selectedCourse.name}</p>
              </div>
              <button onClick={() => setShowEnrollments(false)} className="modal-close-btn" aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-stats-row">
              <div className="modal-stat">
                <span className="modal-stat-val">{selectedCourse.enrolled}</span>
                <span className="modal-stat-lbl">Enrolled</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-val">{selectedCourse.capacity - selectedCourse.enrolled}</span>
                <span className="modal-stat-lbl">Seats Left</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-val">{selectedCourse.capacity}</span>
                <span className="modal-stat-lbl">Capacity</span>
              </div>
            </div>

            <div className="modal-body">
              {enrollmentsLoading ? (
                <div className="loading-enrollments">Loading students...</div>
              ) : enrollments.length > 0 ? (
                <table className="enrollments-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Enrolled On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr, idx) => (
                      <tr key={enr.id}>
                        <td className="row-num">{idx + 1}</td>
                        <td className="roll-no">{enr.studentRollNo || "—"}</td>
                        <td>{enr.studentName || "—"}</td>
                        <td>
                          <span className={`status-pill ${enr.status}`}>{enr.status}</span>
                        </td>
                        <td className="enroll-date">
                          {enr.createdAt
                            ? new Date(enr.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-enrollments">
                  <FiUsers size={32} style={{ opacity: 0.35 }} />
                  <p>No students enrolled in this course yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
