import { apiRequest } from "./api";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected file"));
    reader.readAsDataURL(file);
  });

const buildQuery = (filters = {}) => {
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const listHallTickets = (token, filters = {}) =>
  apiRequest(`/services/hall-tickets${buildQuery(filters)}`, "GET", null, token);

export const uploadHallTicket = async ({ studentId, studentName, rollNo, residentType, file }, token) => {
  const fileBase64 = await fileToBase64(file);
  return apiRequest(
    "/services/hall-tickets/upload",
    "POST",
    {
      studentId,
      studentName,
      rollNo,
      residentType,
      fileName: file?.name || `hall-ticket-${Date.now()}.pdf`,
      mimeType: file?.type || "application/pdf",
      fileBase64,
    },
    token
  );
};

export const downloadHallTicket = (hallTicketId, token) =>
  apiRequest(`/services/hall-tickets/${hallTicketId}/download`, "GET", null, token);

export const verifyHallTicket = (hallTicketId, payload, token) =>
  apiRequest(`/services/hall-tickets/${hallTicketId}/verify`, "PATCH", payload, token);

export const replaceHallTicket = async (hallTicketId, file, token) => {
  const fileBase64 = await fileToBase64(file);
  return apiRequest(
    `/services/hall-tickets/${hallTicketId}/replace`,
    "PATCH",
    {
      fileName: file?.name || `hall-ticket-${Date.now()}.pdf`,
      mimeType: file?.type || "application/pdf",
      fileBase64,
    },
    token
  );
};

export const deleteHallTicket = (hallTicketId, token) =>
  apiRequest(`/services/hall-tickets/${hallTicketId}`, "DELETE", null, token);

export const listHallTicketAudit = (token, filters = {}) =>
  apiRequest(`/services/hall-tickets/audit${buildQuery(filters)}`, "GET", null, token);
