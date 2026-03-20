// src/utils/helpers.js

// Format date to dd/mm/yyyy
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Convert bytes to KB/MB
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// Capitalize first letter of a string
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Get a color based on attendance percentage
export const attendanceColor = (percentage) => {
  if (percentage >= 90) return 'green';
  if (percentage >= 75) return 'orange';
  return 'red';
};

// Sort array by property
export const sortBy = (arr, prop, asc = true) => {
  return arr.sort((a, b) => (asc ? a[prop] - b[prop] : b[prop] - a[prop]));
};
