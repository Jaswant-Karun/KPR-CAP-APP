// src/services/timetableService.js
import { apiRequest } from "./api";

const withFacultyQuery = (path, facultyId) => {
	if (!facultyId) return path;
	return `${path}?facultyId=${encodeURIComponent(facultyId)}`;
};

export const getWeeklyTimetable = (role, id, token, facultyId) => {
	const path = withFacultyQuery(`/${role}/${id}/timetable/week`, facultyId);
	console.log("timetableService - getWeeklyTimetable calling:", { path, role, id, facultyId });
	return apiRequest(path, "GET", null, token);
};

export const getTodayTimetable = (role, id, token, facultyId) => {
	const path = withFacultyQuery(`/${role}/${id}/timetable/today`, facultyId);
	console.log("timetableService - getTodayTimetable calling:", { path, role, id, facultyId });
	return apiRequest(path, "GET", null, token);
};

export const saveWeeklyTimetable = (payload, token) =>
	apiRequest("/timetable/bulk-upsert", "POST", payload, token);
