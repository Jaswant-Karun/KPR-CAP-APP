const { verifyToken } = require("../utils/jwt");

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Missing authorization token" });
	}

	try {
		const token = authHeader.split(" ")[1];
		const decoded = verifyToken(token);
		req.user = decoded;
		return next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};
