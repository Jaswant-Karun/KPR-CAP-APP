import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAllCoursesAdmin, getCourseEnrollments } from "../../services/courseService";
import { FiRefreshCw, FiSearch, FiUsers, FiX, FiBook, FiFilter } from "react-icons/fi";
import "./AdminPages.css";
import "./AdminCourseManagement.css";

const SEMESTERS = ["all", 1, 2, 3, 4, 5, 6, 7, 8];

export default function CourseManagement() {
  const { token } = useAuth();

  const [courses, setCourses]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [query, setQuery]           = useState("");
  const [semFilter, setSemFilter]   = useState("all");

  // Enrollment modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments]       = useState([]);
  const [enrollLoading, setEnrollLoading]   = useState(false);
  const [showModal, setShowModal]           = useState(false);

  useEffect(() => {
    if (token) loadCourses();
  }, [token]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await getAllCoursesAdmin(token);
      setCourses(resp?.courses || []);
    } catch (err) {
      setError(err?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEnrollments = async (course) => {
    try {
      setSelectedCourse(course);
      setEnrollments([]);
      setShowModal(true);
      setEnrollLoading(true);
      const resp = await getCourseEnrollments(course.id, token);
      setEnrollments(resp?.enrollments || []);
    } catch (err) {
      setEnrollments([]);
    } finally {
      setEnrollLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const matchSem = semFilter === "all" || c.semester === Number(semFilter);
      const matchQ =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.facultyName || "").toLowerCase().includes(q) ||
        (c.department || "").toLowerCase().includes(q);
      return matchSem && matchQ;
    });
  }, [courses, query, semFilter]);

  // Summary stats
  const totalEnrolled  = courses.reduce((s, c) => s + (c.enrolled || 0), 0);
  const totalCapacity  = courses.reduce((s, c) => s + (c.capacity || 0), 0);
  const fullCourses    = courses.filter((c) => c.status === "full").length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="acm-header">
        <div>
          <h1 className="admin-page-title">Course Registrations</h1>
          <p className="admin-page-subtitle">
            All courses across departments · {courses.length} total
          </p>
        </div>
        <button className="admin-btn acm-refresh-btn" onClick={loadCourses} disabled={loading}>
          <FiRefreshCw size={15} className={loading ? "acm-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="admin-grid acm-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label"><FiBook size={13} /> Total Courses</div>
          <div className="admin-stat-value">{courses.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label"><FiUsers size={13} /> Total Enrolled</div>
          <div className="admin-stat-value">{totalEnrolled}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Capacity</div>
          <div className="admin-stat-value">{totalCapacity}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Full Courses</div>
          <div className="admin-stat-value acm-stat-warn">{fullCourses}</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="acm-error">
          {error}
          <button onClick={() => setError("")} className="acm-error-close"><FiX size={13} /></button>
        </div>
      )}

      {/* Filters */}
      <section className="admin-panel acm-panel">
        <div className="admin-toolbar acm-toolbar">
          <div className="acm-search-wrap">
            <FiSearch size={15} className="acm-search-icon" />
            <input
              className="admin-input acm-search"
              placeholder="Search by code, name, faculty, department…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="acm-clear-search" onClick={() => setQuery("")}><FiX size={13} /></button>
            )}
          </div>

          <div className="acm-filter-wrap">
            <FiFilter size={14} />
            <select
              className="admin-select acm-sem-select"
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Semesters" : `Semester ${s}`}
                </option>
              ))}
            </select>
          </div>

          {(query || semFilter !== "all") && (
            <button
              className="admin-btn acm-clear-btn"
              onClick={() => { setQuery(""); setSemFilter("all"); }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="acm-results-count">
          Showing {filtered.length} of {courses.length} courses
        </p>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table acm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Course Name</th>
                <th>Faculty</th>
                <th>Dept</th>
                <th>Sem</th>
                <th>Category</th>
                <th>Credits</th>
                <th>Enrolled</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" className="acm-loading-row">Loading courses…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" className="acm-empty-row">No courses found.</td>
                </tr>
              ) : (
                filtered.map((course, idx) => (
                  <tr key={course.id}>
                    <td className="acm-row-num">{idx + 1}</td>
                    <td className="acm-code">{course.code}</td>
                    <td className="acm-name">{course.name}</td>
                    <td className="acm-faculty">{course.facultyName || "—"}</td>
                    <td className="acm-dept">{course.department}</td>
                    <td className="acm-sem">{course.semester ?? "—"}</td>
                    <td>
                      {course.category ? (
                        <span className={`acm-badge acm-cat-${(course.category || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {course.category}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="acm-credits">{course.credits}</td>
                    <td className="acm-enrolled">{course.enrolled}</td>
                    <td className="acm-capacity">{course.capacity}</td>
                    <td>
                      <span className={`acm-status acm-status-${course.status}`}>
                        {course.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-btn acm-view-btn"
                        onClick={() => handleViewEnrollments(course)}
                      >
                        <FiUsers size={13} /> Students
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enrollment Modal */}
      {showModal && selectedCourse && (
        <div className="acm-modal-wrap" role="dialog" aria-modal="true">
          <div className="acm-modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="acm-modal">
            {/* Modal header */}
            <div className="acm-modal-header">
              <div>
                <span className="acm-modal-code">{selectedCourse.code}</span>
                <h2 className="acm-modal-title">{selectedCourse.name}</h2>
                <p className="acm-modal-meta">
                  {selectedCourse.facultyName && <span>{selectedCourse.facultyName}</span>}
                  {selectedCourse.department && <span> · {selectedCourse.department}</span>}
                  {selectedCourse.semester  && <span> · Sem {selectedCourse.semester}</span>}
                </p>
              </div>
              <button className="acm-modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            {/* Stats */}
            <div className="acm-modal-stats">
              <div className="acm-modal-stat">
                <span className="acm-modal-stat-val">{selectedCourse.enrolled}</span>
                <span className="acm-modal-stat-lbl">Enrolled</span>
              </div>
              <div className="acm-modal-stat">
                <span className="acm-modal-stat-val">
                  {selectedCourse.capacity - selectedCourse.enrolled}
                </span>
                <span className="acm-modal-stat-lbl">Seats Left</span>
              </div>
              <div className="acm-modal-stat">
                <span className="acm-modal-stat-val">{selectedCourse.capacity}</span>
                <span className="acm-modal-stat-lbl">Capacity</span>
              </div>
              <div className="acm-modal-stat">
                <span className="acm-modal-stat-val">
                  {Math.round((selectedCourse.enrolled / selectedCourse.capacity) * 100)}%
                </span>
                <span className="acm-modal-stat-lbl">Fill Rate</span>
              </div>
            </div>

            {/* Enrollment table */}
            <div className="acm-modal-body">
              {enrollLoading ? (
                <p className="acm-loading-row">Loading students…</p>
              ) : enrollments.length === 0 ? (
                <div className="acm-modal-empty">
                  <FiUsers size={30} style={{ opacity: 0.3 }} />
                  <p>No students enrolled yet.</p>
                </div>
              ) : (
                <table className="admin-table acm-enroll-table">
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
                    {enrollments.map((e, i) => (
                      <tr key={e.id}>
                        <td className="acm-row-num">{i + 1}</td>
                        <td className="acm-code">{e.studentRollNo || "—"}</td>
                        <td>{e.studentName || "—"}</td>
                        <td>
                          <span className={`acm-status acm-status-${e.status}`}>{e.status}</span>
                        </td>
                        <td className="acm-date">
                          {e.createdAt
                            ? new Date(e.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
