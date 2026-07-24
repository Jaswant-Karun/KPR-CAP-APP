import { apiRequest } from "./api";

export const createCourse = (payload, token) =>
  apiRequest("/courses", "POST", payload, token);

export const getCoursesByDepartment = (department, semester, token) => {
  const params = new URLSearchParams();
  if (department) params.set("department", department);
  if (semester) params.set("semester", semester);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/courses/department${query}`, "GET", null, token);
};

export const getCoursesByFaculty = (token) =>
  apiRequest("/courses/faculty/my-courses", "GET", null, token);

export const enrollStudent = (courseId, token) =>
  apiRequest(`/courses/${courseId}/enroll`, "POST", {}, token);

export const getStudentEnrollments = (token) =>
  apiRequest("/courses/student/my-enrollments", "GET", null, token);

export const getStudentEnrollmentsForFaculty = (studentId, token) =>
  apiRequest(`/courses/faculty/student/${studentId}/enrollments`, "GET", null, token);

export const getCourseEnrollments = (courseId, token) =>
  apiRequest(`/courses/faculty/${courseId}/enrollments`, "GET", null, token);

export const dropCourse = (enrollmentId, token) =>
  apiRequest(`/courses/enrollments/${enrollmentId}/drop`, "PATCH", {}, token);

export const getAllCoursesAdmin = (token, { department, semester, search } = {}) => {
  const params = new URLSearchParams();
  if (department) params.set("department", department);
  if (semester) params.set("semester", semester);
  if (search) params.set("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/courses/admin/all${query}`, "GET", null, token);
};
