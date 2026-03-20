// src/services/fileService.js
import { apiRequest } from "./api";

export const uploadFile = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error("File upload failed");
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
