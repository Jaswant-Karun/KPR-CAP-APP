// src/services/facultyService.js
import { apiRequest } from "./api";

export const getFacultyProfile = (facultyId, token) => apiRequest(`/faculty/${facultyId}`, "GET", null, token);
export const getStudents = (facultyId, token) => apiRequest(`/faculty/${facultyId}/students`, "GET", null, token);
export const getTimetable = (facultyId, token) => apiRequest(`/faculty/${facultyId}/timetable`, "GET", null, token);
export const submitAttendance = (facultyId, data, token) => apiRequest(`/faculty/${facultyId}/attendance`, "POST", data, token);
export const getReports = (facultyId, token) => apiRequest(`/faculty/${facultyId}/reports`, "GET", null, token);
