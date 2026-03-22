import { useMemo, useState } from "react";
import "./AdminPages.css";

const STORAGE_KEY = "kpr_admin_courses";

const getSeedCourses = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
  } catch (error) {
    console.error(error);
  }

  return [
    { id: 1, name: "Data Structures", code: "CS201", credits: 4 },
    { id: 2, name: "Digital Electronics", code: "EC204", credits: 3 },
    { id: 3, name: "Database Systems", code: "CS305", credits: 4 },
  ];
};

export default function CourseManagement() {
  const [courses, setCourses] = useState(getSeedCourses);
  const [newCourse, setNewCourse] = useState({ name: "", code: "", credits: 3 });
  const [query, setQuery] = useState("");

  const persist = (next) => {
    setCourses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addCourse = () => {
    if (!newCourse.name.trim() || !newCourse.code.trim()) {
      return;
    }

    const next = [
      ...courses,
      {
        id: courses.length ? Math.max(...courses.map((c) => c.id)) + 1 : 1,
        name: newCourse.name.trim(),
        code: newCourse.code.trim().toUpperCase(),
        credits: Number(newCourse.credits) || 3,
      },
    ];

    persist(next);
    setNewCourse({ name: "", code: "", credits: 3 });
  };

  const deleteCourse = (id) => {
    persist(courses.filter((course) => course.id !== id));
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return courses;
    }

    return courses.filter((course) => {
      return (
        course.name.toLowerCase().includes(normalized) ||
        course.code.toLowerCase().includes(normalized)
      );
    });
  }, [courses, query]);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Course Management</h1>
      <p className="admin-page-subtitle">Define, search, and remove curriculum entries with admin authority.</p>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <input
            className="admin-input"
            placeholder="Course name"
            value={newCourse.name}
            onChange={(e) => setNewCourse((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Course code"
            value={newCourse.code}
            onChange={(e) => setNewCourse((prev) => ({ ...prev, code: e.target.value }))}
          />
          <input
            className="admin-input"
            type="number"
            min="1"
            max="6"
            placeholder="Credits"
            value={newCourse.credits}
            onChange={(e) => setNewCourse((prev) => ({ ...prev, credits: e.target.value }))}
          />
          <button className="admin-btn" type="button" onClick={addCourse}>Add Course</button>
        </div>

        <div className="admin-toolbar">
          <input
            className="admin-input"
            placeholder="Search by course name or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th>Credits</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">No courses found.</td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course.id}>
                    <td>{course.id}</td>
                    <td>{course.name}</td>
                    <td>{course.code}</td>
                    <td>{course.credits}</td>
                    <td>
                      <button className="admin-btn warn" type="button" onClick={() => deleteCourse(course.id)}>Delete</button>
                    </td>
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
