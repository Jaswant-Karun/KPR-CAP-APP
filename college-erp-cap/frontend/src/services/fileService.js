// src/services/fileService.js
import { apiRequest } from "./api";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

export const uploadFile = async (file, token, studentId) => {
  const fileBase64 = await fileToBase64(file);
  const payload = {
    fileName: file?.name || `upload-${Date.now()}`,
    mimeType: file?.type || "application/octet-stream",
    fileBase64,
    studentId,
  };

  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "File upload failed";
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {
      // Ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return await res.json();
};

export const downloadFile = async (fileId, token) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/files/download/${fileId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("File download failed");

  const blob = await res.blob();
  return blob;
};

export const getUploadAudit = async (token, filters = {}) => {
  const params = new URLSearchParams();

  if (filters.studentId) {
    params.set("studentId", String(filters.studentId));
  }

  if (filters.uploaderId) {
    params.set("uploaderId", String(filters.uploaderId));
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/files/upload/audit${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch upload audit");
  return await res.json();
};

export const getStudentIdCard = async (studentId, token) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/files/upload/student/${studentId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let message = "Failed to fetch student ID card";
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {
      // Ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  return await res.json();
};

export const deleteStudentIdCard = async (studentId, token) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/files/upload/student/${studentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let message = "Failed to delete student ID card";
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {
      // Ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  return await res.json();
};
