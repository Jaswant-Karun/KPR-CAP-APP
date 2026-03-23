// src/services/timetableService.js
import { apiRequest } from "./api";

const withFacultyQuery = (path, facultyId) => {
	if (!facultyId) return path;
	return `${path}?facultyId=${encodeURIComponent(facultyId)}`;
};

export const getWeeklyTimetable = (role, id, token, facultyId) =>
	apiRequest(withFacultyQuery(`/${role}/${id}/timetable/week`, facultyId), "GET", null, token);

export const getTodayTimetable = (role, id, token, facultyId) =>
	apiRequest(withFacultyQuery(`/${role}/${id}/timetable/today`, facultyId), "GET", null, token);

export const saveWeeklyTimetable = (payload, token) =>
	apiRequest("/timetable/bulk-upsert", "POST", payload, token);
