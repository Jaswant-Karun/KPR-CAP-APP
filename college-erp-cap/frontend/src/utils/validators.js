// src/utils/validators.js

// Check email format
export const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
  return re.test(String(email).toLowerCase());
};

// Check password strength (min 6 chars)
export const isValidPassword = (password) => password.length >= 6;

// Check if a string is empty
export const isEmpty = (str) => !str || str.trim() === '';

// Check phone number (optional)
export const isValidPhone = (phone) => /^\d{10}$/.test(phone);
