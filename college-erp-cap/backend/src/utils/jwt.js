const jwt = require("jsonwebtoken");

const signToken = (payload) => {
	const secret = process.env.JWT_SECRET || "8f3a9c2e7b6d4a1f9e8c3b2d6a5f1c7e9d4b8a2c6f3e1b9d7a5c2e8f4b6d1a3";
	return jwt.sign(payload, secret, { expiresIn: "8h" });
};

const verifyToken = (token) => {
	const secret = process.env.JWT_SECRET || "8f3a9c2e7b6d4a1f9e8c3b2d6a5f1c7e9d4b8a2c6f3e1b9d7a5c2e8f4b6d1a3";
	return jwt.verify(token, secret);
};

module.exports = {
	signToken,
	verifyToken,
};
