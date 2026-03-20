// src/services/studentService.js
import { apiRequest } from "./api";

export const getStudentProfile = (studentId, token) => apiRequest(`/student/${studentId}`, "GET", null, token);
export const getAttendance = (studentId, token) => apiRequest(`/student/${studentId}/attendance`, "GET", null, token);
export const getTimetable = (studentId, token) => apiRequest(`/student/${studentId}/timetable`, "GET", null, token);
export const getDownloads = (studentId, token) => apiRequest(`/student/${studentId}/downloads`, "GET", null, token);
