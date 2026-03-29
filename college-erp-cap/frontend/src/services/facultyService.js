// src/services/facultyService.js
import { apiRequest } from "./api";

export const getFacultyProfile = (facultyId, token) => apiRequest(`/faculty/${facultyId}`, "GET", null, token);
export const getStudents = (facultyId, token) => apiRequest(`/faculty/${facultyId}/students`, "GET", null, token);
export const getTimetable = (facultyId, token) => apiRequest(`/faculty/${facultyId}/timetable`, "GET", null, token);
export const submitAttendance = (facultyId, data, token) => apiRequest(`/faculty/${facultyId}/attendance`, "POST", data, token);

const buildQuery = (params = {}) => {
	const search = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null || value === "") return;
		search.set(key, String(value));
	});

	const query = search.toString();
	return query ? `?${query}` : "";
};

export const getReports = (facultyId, token, params = {}) =>
	apiRequest(`/faculty/${facultyId}/reports${buildQuery(params)}`, "GET", null, token);

export const getAttendanceHistory = (facultyId, token, params = {}) =>
	getReports(facultyId, token, params);

export const getFacultyDirectory = (token) => apiRequest("/faculty/list/all", "GET", null, token);
