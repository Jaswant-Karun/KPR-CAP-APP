const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const signToken = (payload) => {
	const secret = env.JWT_SECRET;
	return jwt.sign(payload, secret, { expiresIn: "8h" });
};

const verifyToken = (token) => {
	const secret = env.JWT_SECRET;
	return jwt.verify(token, secret);
};

module.exports = {
	signToken,
	verifyToken,
};
