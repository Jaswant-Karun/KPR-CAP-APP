import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { createCourse, getCoursesByFaculty, getCourseEnrollments } from "../../services/courseService";
import { getDepartments } from "../../services/departmentService";
import { FiPlus, FiChevronDown, FiUsers, FiBook, FiRefreshCw, FiX } from "react-icons/fi";
import "./FacultyCourseMgmt.css";

const CATEGORIES = ["PCC", "EEC", "OEC", "BSC", "MOOC", "NCC", "Other"];
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
  const [showEnrollments, setShowEnrollments] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credits: 3,
    semester: "",
    category: "",
    department: user?.department || FALLBACK_DEPARTMENTS[1],
    capacity: 60,
    description: "",
  });

  useEffect(() => {
    loadInitialData();
  }, [token]);

  useEffect(() => {
    if (!formData.department && departmentOptions.length > 0) {
      setFormData((prev) => ({ ...prev, department: departmentOptions[0] }));
    }
  }, [departmentOptions, formData.department]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [courseResponse, departmentResponse] = await Promise.all([
        getCoursesByFaculty(token),
        getDepartments(token),
      ]);

      setCourses(courseResponse?.courses || []);

      const apiDepartments = (departmentResponse?.departments || [])
        .map((row) => row?.name)
        .filter(Boolean);
      const mergedDepartments = [...new Set([...apiDepartments, ...FALLBACK_DEPARTMENTS])];
      setDepartmentOptions(mergedDepartments);

      if (!formData.department && mergedDepartments.length > 0) {
        setFormData((prev) => ({ ...prev, department: mergedDepartments[0] }));
      }

      setMessage("");
    } catch (error) {
      console.error("Error loading initial course data:", error);
      setDepartmentOptions(FALLBACK_DEPARTMENTS);
      setMessage(error?.message || "Failed to load courses/departments");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await getCoursesByFaculty(token);
      setCourses(response?.courses || []);
      setMessage("");
    } catch (error) {
      console.error("Error loading courses:", error);
      setMessage(error?.message || "Failed to load courses");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    if (
      !formData.code ||
      !formData.name ||
      !formData.department
    ) {
      setMessage("Course code, name, and department are required");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const response = await createCourse(formData, token);
      setCourses([response.course, ...courses]);
      setMessage("Course created successfully");
      setMessageType("success");
      setShowForm(false);
      setFormData({
        code: "",
        name: "",
        credits: 3,
        semester: "",
        category: "",
        department: user?.department || departmentOptions[0] || FALLBACK_DEPARTMENTS[1],
        capacity: 60,
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
      setLoading(true);
      setSelectedCourse(course);
      const response = await getCourseEnrollments(course.id, token);
      setEnrollments(response?.enrollments || []);
      setShowEnrollments(true);
      setMessage("");
    } catch (error) {
      setMessage(error?.message || "Failed to load enrollments");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "credits" || name === "semester" || name === "capacity" ? Number(value) : value,
    }));
  };

  return (
    <div className="faculty-course-mgmt-container">
      <div className="mgmt-header">
        <h1>Course Management</h1>
        <button
          className="btn-create-course"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <FiPlus size={18} /> Create Course
        </button>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage("")} className="close-msg">
            <FiX size={14} />
          </button>
        </div>
      )}

      {showForm && (
        <div className="course-form">
          <h2>Create New Course</h2>
          <form onSubmit={handleCreateCourse}>
            <div className="form-row">
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  name="code"
                  placeholder="e.g., U21AD401"
                  value={formData.code}
                  onChange={handleFormChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Machine Learning Essentials"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  name="credits"
                  min="1"
                  max="10"
                  value={formData.credits}
                  onChange={handleFormChange}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <input
                  type="number"
                  name="semester"
                  min="1"
                  max="8"
                  placeholder="1-8"
                  value={formData.semester}
                  onChange={handleFormChange}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  disabled={loading}
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  max="500"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Course description..."
                rows="3"
                value={formData.description}
                onChange={handleFormChange}
                disabled={loading}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                Create Course
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="courses-section">
        <h2>Your Courses ({courses.length})</h2>

        {loading && courses.length === 0 ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length > 0 ? (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <div>
                    <h3>{course.code}</h3>
                    <p className="course-name">{course.name}</p>
                  </div>
                  <span className={`status ${course.status}`}>{course.status}</span>
                </div>

                <div className="course-info">
                  <span>
                    <FiBook size={14} /> {course.credits} Credits
                  </span>
                  {course.category && <span className="badge-category">{course.category}</span>}
                  {course.semester && <span>Sem {course.semester}</span>}
                </div>

                <div className="course-enrollment">
                  <FiUsers size={14} />
                  <span>
                    {course.enrolled}/{course.capacity} Enrolled
                  </span>
                  <div className="enrollment-bar">
                    <div
                      className="enrollment-fill"
                      style={{
                        width: `${Math.round((course.enrolled / course.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {course.description && <p className="description">{course.description}</p>}

                <button
                  className="btn-view-enrollments"
                  onClick={() => handleViewEnrollments(course)}
                  disabled={loading}
                >
                  View Enrollments
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses created yet.</p>
            <p>Click "Create Course" to add your first course.</p>
          </div>
        )}
      </div>

      {showEnrollments && selectedCourse && (
        <div className="enrollments-modal">
          <div className="modal-overlay" onClick={() => setShowEnrollments(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {selectedCourse.code} - Student Enrollments ({enrollments.length})
              </h2>
              <button onClick={() => setShowEnrollments(false)} className="close-btn">
                <FiX size={20} />
              </button>
            </div>

            <div className="enrollments-table-wrapper">
              {enrollments.length > 0 ? (
                <table className="enrollments-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="roll-no">{enrollment.studentRollNo}</td>
                        <td>{enrollment.studentName}</td>
                        <td>
                          <span className={`status-badge ${enrollment.status}`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="date enrollment-date">
                          {new Date(enrollment.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-enrollments">
                  <p>No students enrolled yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
