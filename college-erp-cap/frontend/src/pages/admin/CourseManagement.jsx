import React, { useState } from "react";
import "./CourseManagement.css";

export default function CourseManagement() {
  const [courses, setCourses] = useState([
    { id: 1, name: "Computer Science", code: "CS101" },
    { id: 2, name: "Mechanical Engineering", code: "ME101" },
  ]);
  const [newCourse, setNewCourse] = useState({ name: "", code: "" });

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.code) return;
    setCourses([
      ...courses,
      { id: courses.length + 1, name: newCourse.name, code: newCourse.code },
    ]);
    setNewCourse({ name: "", code: "" });
  };

  const handleDeleteCourse = (id) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  return (
    <div className="course-page">
      <h1>📚 Course Management</h1>

      <div className="course-form">
        <input
          type="text"
          placeholder="Course Name"
          value={newCourse.name}
          onChange={(e) =>
            setNewCourse({ ...newCourse, name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Course Code"
          value={newCourse.code}
          onChange={(e) =>
            setNewCourse({ ...newCourse, code: e.target.value })
          }
        />
        <button onClick={handleAddCourse}>➕ Add Course</button>
      </div>

      <table className="course-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Course Name</th>
            <th>Course Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td>{course.id}</td>
              <td>{course.name}</td>
              <td>{course.code}</td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteCourse(course.id)}
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
