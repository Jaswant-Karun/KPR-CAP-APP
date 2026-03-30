import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getCoursesByDepartment,
  getStudentEnrollments,
  enrollStudent,
  dropCourse,
} from "../services/courseService";
import { FiSearch, FiFilter, FiPlus, FiX, FiBook, FiUsers, FiTrash2, FiRefreshCw } from "react-icons/fi";
import "./CourseRegistration.css";

const CATEGORIES = ["all", "PCC", "EEC", "OEC", "BSC", "MOOC"];
const SEMESTERS = ["all", 1, 2, 3, 4, 5, 6, 7, 8];

const CourseRegistration = () => {
  const { user, token } = useAuth();
  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty" || user?.role === "admin";

  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    semester: "all",
    category: "all",
    status: "all",
  });

  useEffect(() => {
    loadData();
  }, [token, user?.department]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        // Load available courses for student's department
        const coursesResp = await getCoursesByDepartment(user?.department, "", token);
        setCourses(coursesResp?.courses || []);

        // Load student's enrollments
        const enrollmentsResp = await getStudentEnrollments(token);
        setMyEnrollments(enrollmentsResp?.enrollments || []);
      } else if (isFaculty) {
        // Load all courses for the department
        const coursesResp = await getCoursesByDepartment(user?.department, "", token);
        setCourses(coursesResp?.courses || []);
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
        setMessage("Successfully dropped course!");
        setMessageType("success");
      } catch (error) {
        setMessage(error?.message || "Failed to drop course");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.facultyName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSemester =
      selectedFilters.semester === "all" || course.semester === Number(selectedFilters.semester);
    const matchesCategory =
      selectedFilters.category === "all" || course.category === selectedFilters.category;

    let matchesStatus = true;
    if (selectedFilters.status !== "all") {
      matchesStatus = course.status === selectedFilters.status;
    }

    return matchesSearch && matchesSemester && matchesCategory && matchesStatus;
  });

  const enrolledCourseIds = myEnrollments.map((e) => e.courseId);

  return (
    <div className="course-registration-container">
      <div className="course-header">
        <div className="course-header-info">
          <h1>Course Registration</h1>
          <p>
            {isStudent
              ? `Available courses for ${user?.department || "CSE"} Department`
              : "Manage course registrations"}
          </p>
        </div>
        <button onClick={loadData} className="refresh-btn" disabled={loading}>
          <FiRefreshCw size={16} />
          Refresh
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
                    {enrollment.category && <span className="badge-category">{enrollment.category}</span>}
                    <span className="faculty-name">Dr. {enrollment.facultyName}</span>
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
            onChange={(e) =>
              setSelectedFilters({ ...selectedFilters, semester: e.target.value })
            }
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
            onChange={(e) =>
              setSelectedFilters({ ...selectedFilters, category: e.target.value })
            }
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
            onChange={(e) =>
              setSelectedFilters({ ...selectedFilters, status: e.target.value })
            }
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
          </select>
        </div>
      </div>

      <div className="courses-section">
        <h2>Available Courses ({filteredCourses.length})</h2>

        {loading && filteredCourses.length === 0 ? (
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
                      <span className={`badge badge-${course.category?.toLowerCase()}`}>
                        {course.category}
                      </span>
                    </td>
                    <td className="semester-cell">{course.semester || "-"}</td>
                    <td className="enrollment-cell">
                      <div className="enrollment-info-mini">
                        <span>
                          {course.enrolled}/{course.capacity}
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
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge status-${course.status}`}>
                        {course.status}
                      </span>
                    </td>
                    {isStudent && (
                      <td className="action-cell">
                        {enrolledCourseIds.includes(course.id) ? (
                          <span className="enrolled-badge">Enrolled</span>
                        ) : (
                          <button
                            className="btn-enroll"
                            onClick={() => handleEnroll(course.id)}
                            disabled={loading || course.status === "full"}
                            title={
                              course.status === "full"
                                ? "Course is full"
                                : "Enroll in this course"
                            }
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
