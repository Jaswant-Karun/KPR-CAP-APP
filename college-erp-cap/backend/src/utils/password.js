const bcrypt = require("bcryptjs");

const hashPassword = async (plainTextPassword) => {
	return bcrypt.hash(String(plainTextPassword || ""), 10);
};

const comparePassword = async (plainTextPassword, passwordHash) => {
	return bcrypt.compare(String(plainTextPassword || ""), String(passwordHash || ""));
};

module.exports = {
	hashPassword,
	comparePassword,
};
