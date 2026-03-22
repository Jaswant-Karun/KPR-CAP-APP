const jwt = require("jsonwebtoken");

const signToken = (payload) => {
	const secret = process.env.JWT_SECRET || "dev-secret";
	return jwt.sign(payload, secret, { expiresIn: "8h" });
};

const verifyToken = (token) => {
	const secret = process.env.JWT_SECRET || "dev-secret";
	return jwt.verify(token, secret);
};

module.exports = {
	signToken,
	verifyToken,
};
