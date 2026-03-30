import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { FaSearch, FaPlus, FaSave, FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { getStudents } from "../../services/facultyService";
import { getStudentEnrollmentsForFaculty } from "../../services/courseService";
import { getCfacRegistrations, getCfacInternals, updateCfacRegistration } from "../../services/cfacService";
import { getDepartments } from "../../services/departmentService";
import { nominalRollCoursesByTicket, internalMarkRowsByTicket } from "../nominalRollData";
import {
  getInternalMarkCourses,
  createInternalMarkCourse,
  updateInternalMarkCourse,
  deleteInternalMarkCourse,
} from "../../services/internalMarkCourseService";
import "./InternalMarks.css";

const DEFAULT_MAX_MARKS = 25;

const DEPARTMENT_MASTER_LIST = [
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

const normalizeCourseCode = (code) => {
  const base = String(code || "").trim().toUpperCase();
  if (!base) return "";
  if (base === "U210CB04") return "U21OCB04";
  return base;
};

const STATIC_COURSE_NAME_MAP = (() => {
  const map = new Map();

  Object.values(nominalRollCoursesByTicket || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      const code = normalizeCourseCode(row?.code);
      const name = String(row?.name || "").trim();
      if (code && name) map.set(code, name);
    });
  });

  Object.values(internalMarkRowsByTicket || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      const code = normalizeCourseCode(row?.code);
      const name = String(row?.name || "").trim();
      if (code && name && !map.has(code)) map.set(code, name);
    });
  });

  return map;
})();

export default function InternalMarks() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState([]);
  const [managedCourses, setManagedCourses] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedStudentCourses, setSelectedStudentCourses] = useState([]);
  const [selectedCourseCodes, setSelectedCourseCodes] = useState([]);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [courseForm, setCourseForm] = useState({ id: null, code: "", name: "", maxMarks: DEFAULT_MAX_MARKS });

  const resolvedCourseNameMap = useMemo(() => {
    const map = new Map(STATIC_COURSE_NAME_MAP);
    managedCourses.forEach((course) => {
      const code = normalizeCourseCode(course?.code);
      const name = String(course?.name || "").trim();
      if (code && name) map.set(code, name);
    });
    return map;
  }, [managedCourses]);

  const deriveBatch = (rollNo) => {
    const match = String(rollNo || "").match(/^(\d{2})/);
    if (!match) return "N/A";
    const startYear = 2000 + Number(match[1]);
    if (Number.isNaN(startYear)) return "N/A";
    return `${startYear}-${startYear + 4}`;
  };

  const decorateCourses = (codes = []) => {
    return codes.map((code) => {
      const normalizedCode = normalizeCourseCode(code);
      const found = managedCourses.find((item) => normalizeCourseCode(item.code) === normalizedCode);
      return {
        id: normalizedCode || code,
        code: normalizedCode || code,
        name: found?.name || resolvedCourseNameMap.get(normalizedCode) || normalizedCode || code,
        maxMarks: found?.maxMarks || DEFAULT_MAX_MARKS,
      };
    });
  };

  const loadInternalCourses = async () => {
    const response = await getInternalMarkCourses(token, user?.department || undefined);
    setManagedCourses(response?.courses || []);
  };

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        if (!token || !user?.id) return;
        setLoading(true);
        const [studentResponse, departmentResponse] = await Promise.all([
          getStudents(user.id, token),
          loadInternalCourses(),
          getDepartments(token),
        ]);

        const mappedStudents = (studentResponse?.students || []).map((student) => ({
          id: Number(student.id),
          name: student.name || "-",
          rollNo: student.roll_no || "-",
          department: student.department || "-",
          batch: deriveBatch(student.roll_no),
          email: student.email || "-",
        }));
        setStudents(mappedStudents);
        setAllDepartments((departmentResponse?.departments || []).map((item) => item?.name).filter(Boolean));
      } catch (error) {
        setStudents([]);
        setAllDepartments([]);
        setMessage(error?.message || "Failed to load base data");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [token, user?.id]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (filterDepartment !== "all") {
      filtered = filtered.filter((s) => s.department === filterDepartment);
    }

    if (filterBatch !== "all") {
      filtered = filtered.filter((s) => s.batch === filterBatch);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [students, searchTerm, filterDepartment, filterBatch]);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setMarks({});
    setMessage("");
    setSelectedRegistrationId(null);

    try {
      setLoadingCourses(true);
      const [cfacResponse, enrollmentResp] = await Promise.all([
        getCfacRegistrations(token, student.id),
        getStudentEnrollmentsForFaculty(student.id, token),
      ]);

      const registrations = cfacResponse?.registrations || [];
      const latestRegistration = registrations[0] || null;
      const enrollments = (enrollmentResp?.enrollments || []).filter(
        (row) => String(row?.status || "registered").toLowerCase() === "registered"
      );

      if (latestRegistration?.id) {
        setSelectedRegistrationId(latestRegistration.id);

        const internalsResp = await getCfacInternals(latestRegistration.id, token);
        const internals = internalsResp?.internals || [];
        const marksMap = {};
        for (const row of internals) {
          if (row?.courseCode) {
            const normalizedCode = normalizeCourseCode(row.courseCode);
            marksMap[normalizedCode] = row.internal1 ?? "";
          }
        }
        setMarks(marksMap);
      }

      // Source of truth for faculty mark entry: student's registered courses.
      if (enrollments.length > 0) {
        const courseCodes = enrollments.map((row) => normalizeCourseCode(row.code)).filter(Boolean);
        setSelectedCourseCodes(courseCodes);
        setSelectedStudentCourses(
          enrollments.map((row) => ({
            id: normalizeCourseCode(row.code) || row.id,
            code: normalizeCourseCode(row.code) || row.code,
            name:
              row.name ||
              resolvedCourseNameMap.get(normalizeCourseCode(row.code)) ||
              normalizeCourseCode(row.code) ||
              row.code,
            maxMarks: DEFAULT_MAX_MARKS,
          }))
        );
      } else {
        setSelectedCourseCodes([]);
        setSelectedStudentCourses([]);
      }
    } catch (error) {
      setSelectedStudentCourses([]);
      setSelectedCourseCodes([]);
      setMessage(error?.message || "Failed to load registered courses");
      setMessageType("error");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleMarkChange = (courseCode, maxMarks, value) => {
    const textValue = String(value);
    if (textValue === "") {
      setMarks({ ...marks, [courseCode]: "" });
      return;
    }

    const numValue = Number(textValue);
    if (Number.isNaN(numValue) || numValue < 0 || numValue > Number(maxMarks || DEFAULT_MAX_MARKS)) {
      setMessage(`Marks for ${courseCode} must be between 0 and ${maxMarks || DEFAULT_MAX_MARKS}`);
      setMessageType("error");
      return;
    }
    setMarks({ ...marks, [courseCode]: numValue });
    setMessage("");
  };

  const handleSaveMarks = async () => {
    if (!selectedStudent) return;

    if (!selectedRegistrationId) {
      setMessage("No CFAC registration found for this student. Please create CFAC registration first.");
      setMessageType("error");
      return;
    }

    if (selectedCourseCodes.length === 0) {
      setMessage("No courses found for this student. Please register courses first.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      // Ensure all courses are included in the payload, even if no mark was entered
      const internalMarksArray = selectedCourseCodes.map((code) => {
        const markValue = marks[code];
        return {
          courseCode: code,
          internal1: markValue === "" || markValue === undefined || markValue === null ? null : Number(markValue),
        };
      });

      const payload = {
        courseCodes: selectedCourseCodes,
        internalMarks: internalMarksArray,
      };

      const response = await updateCfacRegistration(selectedRegistrationId, payload, token);

      if (response?.message) {
        setMessage(response.message);
      } else {
        setMessage(`Marks saved successfully for ${selectedStudent.name}`);
      }
      setMessageType("success");

      // Reload the marks to confirm they were saved
      const internalsResp = await getCfacInternals(selectedRegistrationId, token);
      const internals = internalsResp?.internals || [];
      const marksMap = {};
      for (const row of internals) {
        if (row?.courseCode) {
          marksMap[row.courseCode] = row.internal1 ?? "";
        }
      }
      setMarks(marksMap);
    } catch (error) {
      console.error("Error saving marks:", error);
      setMessage(error?.message || "Failed to save marks");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseFormSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.code || !courseForm.name) {
      setMessage("Course code and name are required");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      if (courseForm.id) {
        await updateInternalMarkCourse(
          courseForm.id,
          {
            code: courseForm.code,
            name: courseForm.name,
            maxMarks: Number(courseForm.maxMarks) || DEFAULT_MAX_MARKS,
            department: user?.department,
          },
          token
        );
        setMessage("Internal marks course updated");
      } else {
        await createInternalMarkCourse(
          {
            code: courseForm.code,
            name: courseForm.name,
            maxMarks: Number(courseForm.maxMarks) || DEFAULT_MAX_MARKS,
            department: user?.department,
          },
          token
        );
        setMessage("Internal marks course created");
      }
      setMessageType("success");
      setCourseForm({ id: null, code: "", name: "", maxMarks: DEFAULT_MAX_MARKS });
      await loadInternalCourses();
    } catch (error) {
      setMessage(error?.message || "Failed to save internal marks course");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setCourseForm({
      id: course.id,
      code: course.code,
      name: course.name,
      maxMarks: course.maxMarks || DEFAULT_MAX_MARKS,
    });
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      setLoading(true);
      await deleteInternalMarkCourse(courseId, token);
      setMessage("Internal marks course deleted");
      setMessageType("success");
      await loadInternalCourses();
    } catch (error) {
      setMessage(error?.message || "Failed to delete internal marks course");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const fromStudents = students.map((s) => s.department).filter(Boolean);
    const fromMaster = allDepartments.filter(Boolean);
    return [...new Set([...DEPARTMENT_MASTER_LIST, ...fromMaster, ...fromStudents])].sort((a, b) =>
      String(a).localeCompare(String(b))
    );
  }, [allDepartments, students]);
  const batches = [...new Set(students.map((s) => s.batch))];

  return (
    <div className="internal-marks-page">
      <div className="marks-header">
        <h1>Internal Marks Management</h1>
        <p>Enter internal marks for courses registered by each student</p>
      </div>

      <div className="marks-toolbar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
            <option value="all">All Batches</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="course-manager-toggle" onClick={() => setShowCourseManager((v) => !v)}>
          {showCourseManager ? "Hide Course Manager" : "Manage Internal Marks Courses"}
        </button>
      </div>

      {showCourseManager && (
        <div className="course-manager-panel">
          <h3>Internal Marks Course Manager</h3>
          <form className="course-manager-form" onSubmit={handleCourseFormSubmit}>
            <input
              type="text"
              placeholder="Course Code"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
            />
            <input
              type="text"
              placeholder="Course Name"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
            />
            <input
              type="number"
              min="1"
              max="100"
              placeholder="Max Marks"
              value={courseForm.maxMarks}
              onChange={(e) => setCourseForm({ ...courseForm, maxMarks: e.target.value })}
            />
            <button type="submit" className="course-save-btn" disabled={loading}>
              {courseForm.id ? "Update" : "Create"}
            </button>
            {courseForm.id && (
              <button
                type="button"
                className="course-cancel-btn"
                onClick={() => setCourseForm({ id: null, code: "", name: "", maxMarks: DEFAULT_MAX_MARKS })}
              >
                Cancel
              </button>
            )}
          </form>

          <div className="managed-courses-list">
            {managedCourses.map((course) => (
              <div key={course.id} className="managed-course-item">
                <div>
                  <strong>{course.code}</strong> {course.name}
                  <span className="managed-course-meta">/ {course.maxMarks}</span>
                </div>
                <div className="managed-course-actions">
                  <button type="button" onClick={() => handleEditCourse(course)} title="Edit">
                    <FaEdit />
                  </button>
                  <button type="button" onClick={() => handleDeleteCourse(course.id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <div className="marks-container">
        <div className="students-list">
          <h3>Students</h3>
          {loading ? (
            <div className="loading">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="no-data">No students found</div>
          ) : (
            <div className="students-scroll">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`student-item ${selectedStudent?.id === student.id ? "active" : ""}`}
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="student-name">{student.name}</div>
                  <div className="student-roll">{student.rollNo}</div>
                  <div className="student-dept">{student.department}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="marks-form">
          {selectedStudent ? (
            <>
              <div className="form-header">
                <h3>Enter Marks for {selectedStudent.name}</h3>
                <button
                  className="btn-close"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSelectedStudentCourses([]);
                    setSelectedCourseCodes([]);
                    setSelectedRegistrationId(null);
                    setMarks({});
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="form-info">
                <p>
                  <strong>Roll No:</strong> {selectedStudent.rollNo}
                </p>
                <p>
                  <strong>Department:</strong> {selectedStudent.department}
                </p>
                <p>
                  <strong>Batch:</strong> {selectedStudent.batch}
                </p>
              </div>

              <div className="registered-courses-panel">
                <h4>Registered Courses</h4>
                {loadingCourses ? (
                  <div className="registered-courses-loading">Loading registered courses...</div>
                ) : selectedStudentCourses.length === 0 ? (
                  <div className="registered-courses-empty">No registered courses found for this student</div>
                ) : (
                  <div className="registered-courses-list">
                    {selectedStudentCourses.map((course) => (
                      <div key={course.id} className="registered-course-chip">
                        <span className="registered-course-code">{course.code}</span>
                        <span className="registered-course-name">{course.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!loadingCourses && selectedStudentCourses.length === 0 && (
                <div className="message error">
                  This student has not registered any courses yet. Ask the student to complete Course Registration first.
                </div>
              )}

              <div className="marks-input-group">
                {selectedStudentCourses.map((course) => (
                  <div key={course.id} className="mark-input">
                    <label>{course.name}</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        min="0"
                        max={course.maxMarks || DEFAULT_MAX_MARKS}
                        placeholder="0"
                        value={marks[course.code] ?? ""}
                        onChange={(e) => handleMarkChange(course.code, course.maxMarks, e.target.value)}
                      />
                      <span className="max-marks">/ {course.maxMarks || DEFAULT_MAX_MARKS}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-save"
                onClick={handleSaveMarks}
                disabled={loading || selectedStudentCourses.length === 0}
              >
                <FaSave /> Save Marks
              </button>
            </>
          ) : (
            <div className="empty-form">
              <FaPlus className="empty-icon" />
              <p>Select a student to enter marks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
