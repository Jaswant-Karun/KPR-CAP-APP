// src/services/timetableService.js
import { apiRequest } from "./api";

export const getWeeklyTimetable = (role, id, token) =>
	apiRequest(`/${role}/${id}/timetable/week`, "GET", null, token);

export const getTodayTimetable = (role, id, token) =>
	apiRequest(`/${role}/${id}/timetable/today`, "GET", null, token);

export const saveWeeklyTimetable = (payload, token) =>
	apiRequest("/timetable/bulk-upsert", "POST", payload, token);
