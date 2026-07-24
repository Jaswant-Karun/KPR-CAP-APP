import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getCoursesByDepartment,
  getStudentEnrollments,
  enrollStudent,
  dropCourse,
} from "../services/courseService";
import { FiSearch, FiPlus, FiX, FiBook, FiUsers, FiTrash2, FiRefreshCw } from "react-icons/fi";
import "./CourseRegistration.css";

const CATEGORIES = ["all", "Theory", "Lab", "Professional Elective", "PCC", "EEC", "OEC", "BSC", "MOOC"];
const SEMESTERS = ["all", 1, 2, 3, 4, 5, 6, 7, 8];

const CourseRegistration = () => {
  const { user, token } = useAuth();
  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [searchQuery, setSearchQuery] = useState("");
  // Default to semester 5 so timetable courses appear immediately
  const [selectedFilters, setSelectedFilters] = useState({
    semester: 5,
    category: "all",
    status: "all",
  });

  useEffect(() => {
    if (token && user) loadData();
  }, [token, user?.department]);

  const loadData = async () => {
    try {
      setLoading(true);
      const dept = user?.department || "";
      const coursesResp = await getCoursesByDepartment(dept, "", token);
      setCourses(coursesResp?.courses || []);

      if (isStudent) {
        const enrollmentsResp = await getStudentEnrollments(token);
        setMyEnrollments(enrollmentsResp?.enrollments || []);
      }
      setMessage("");
    } catch (error) {
      console.error("Error loading courses:", error);
      setMessage(error?.message || "Failed to load courses");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setLoading(true);
      await enrollStudent(courseId, token);
      const enrollmentsResp = await getStudentEnrollments(token);
      setMyEnrollments(enrollmentsResp?.enrollments || []);
      setMessage("Successfully enrolled in course!");
      setMessageType("success");
    } catch (error) {
      setMessage(error?.message || "Failed to enroll in course");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (window.confirm("Are you sure you want to drop this course?")) {
      try {
        setLoading(true);
        await dropCourse(enrollmentId, token);
        setMyEnrollments(myEnrollments.filter((e) => e.id !== enrollmentId));
        setMessage("Course dropped successfully!");
        setMessageType("success");
      } catch (error) {
        setMessage(error?.message || "Failed to drop course");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredCourses = courses.filter((course) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      course.code.toLowerCase().includes(q) ||
      course.name.toLowerCase().includes(q) ||
      (course.facultyName || "").toLowerCase().includes(q);

    const matchesSemester =
      selectedFilters.semester === "all" ||
      course.semester === Number(selectedFilters.semester);

    const matchesCategory =
      selectedFilters.category === "all" ||
      course.category === selectedFilters.category;

    const matchesStatus =
      selectedFilters.status === "all" ||
      course.status === selectedFilters.status;

    return matchesSearch && matchesSemester && matchesCategory && matchesStatus;
  });

  const enrolledCourseIds = new Set(myEnrollments.map((e) => e.courseId));

  const setFilter = (key, value) =>
    setSelectedFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="course-registration-container">
      {/* Header */}
      <div className="course-header">
        <div className="course-header-info">
          <h1>Course Registration</h1>
          <p>
            {isStudent
              ? `Semester 5 courses for ${user?.department || ""} department`
              : isAdmin
              ? "All course registrations"
              : `Courses for ${user?.department || ""} department`}
          </p>
        </div>
        <button onClick={loadData} className="refresh-btn" disabled={loading}>
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage("")} className="close-msg">
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* My Enrolled Courses (student only) */}
      {isStudent && myEnrollments.length > 0 && (
        <div className="my-enrollments-section">
          <h2>My Enrolled Courses ({myEnrollments.length})</h2>
          <div className="enrollments-list">
            {myEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="enrollment-card">
                <div className="enrollment-info">
                  <div>
                    <h4>{enrollment.code}</h4>
                    <p>{enrollment.name}</p>
                  </div>
                  <div className="enrollment-meta">
                    <span className="badge-credits">{enrollment.credits} Credits</span>
                    {enrollment.category && (
                      <span className="badge-category">{enrollment.category}</span>
                    )}
                    {enrollment.facultyName && (
                      <span className="faculty-name">{enrollment.facultyName}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-drop"
                  onClick={() => handleDrop(enrollment.id)}
                  disabled={loading}
                  title="Drop this course"
                >
                  <FiTrash2 size={14} /> Drop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Search by code, name, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-group">
          <select
            value={selectedFilters.semester}
            onChange={(e) => setFilter("semester", e.target.value)}
            disabled={loading}
          >
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {sem === "all" ? "All Semesters" : `Semester ${sem}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={selectedFilters.category}
            onChange={(e) => setFilter("category", e.target.value)}
            disabled={loading}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={selectedFilters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
          </select>
        </div>
      </div>

      {/* Available Courses */}
      <div className="courses-section">
        <h2>Available Courses ({filteredCourses.length})</h2>

        {loading && courses.length === 0 ? (
          <div className="loading-state">Loading courses...</div>
        ) : filteredCourses.length > 0 ? (
          <div className="courses-table-wrapper">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Faculty</th>
                  <th>Credits</th>
                  <th>Category</th>
                  <th>Sem</th>
                  <th>Enrollment</th>
                  <th>Status</th>
                  {isStudent && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id} className={`status-${course.status}`}>
                    <td className="code-cell">
                      <strong>{course.code}</strong>
                    </td>
                    <td className="name-cell">{course.name}</td>
                    <td className="faculty-cell">{course.facultyName || "TBD"}</td>
                    <td className="credits-cell">{course.credits}</td>
                    <td className="category-cell">
                      <span className={`badge badge-${(course.category || "").toLowerCase().replace(/\s+/g, "-")}`}>
                        {course.category || "—"}
                      </span>
                    </td>
                    <td className="semester-cell">{course.semester || "-"}</td>
                    <td className="enrollment-cell">
                      <div className="enrollment-info-mini">
                        <span>{course.enrolled}/{course.capacity}</span>
                        <div className="enrollment-bar">
                          <div
                            className="enrollment-fill"
                            style={{
                              width: `${Math.min(100, Math.round((course.enrolled / course.capacity) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge status-${course.status}`}>
                        {course.status}
                      </span>
                    </td>
                    {isStudent && (
                      <td className="action-cell">
                        {enrolledCourseIds.has(course.id) ? (
                          <span className="enrolled-badge">Enrolled</span>
                        ) : (
                          <button
                            className="btn-enroll"
                            onClick={() => handleEnroll(course.id)}
                            disabled={loading || course.status === "full"}
                            title={course.status === "full" ? "Course is full" : "Enroll in this course"}
                          >
                            <FiPlus size={14} /> Enroll
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses available matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseRegistration;
