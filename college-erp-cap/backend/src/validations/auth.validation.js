const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const isAllowedCollegeEmail = (email = "") => {
	const normalizedEmail = normalizeEmail(email);
	return /^[a-zA-Z0-9._%+-]+@kpriet\.ac\.in$/i.test(normalizedEmail);
};

const hasStrongPassword = (password = "") => {
	const value = String(password);
	const hasMinLength = value.length >= 8;
	const hasUpper = /[A-Z]/.test(value);
	const hasLower = /[a-z]/.test(value);
	const hasDigit = /\d/.test(value);
	const hasSpecial = /[^A-Za-z0-9]/.test(value);

	return hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;
};

module.exports = {
	normalizeEmail,
	isAllowedCollegeEmail,
	hasStrongPassword,
};
