// src/services/timetableService.js
import { apiRequest } from "./api";

export const getTimetable = (role, id, token) => apiRequest(`/${role}/${id}/timetable`, "GET", null, token);
export const updateTimetable = (role, id, data, token) => apiRequest(`/${role}/${id}/timetable`, "POST", data, token);
