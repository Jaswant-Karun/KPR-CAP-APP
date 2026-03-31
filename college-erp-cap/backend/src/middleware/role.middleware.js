const normalizeRole = (role) => {
	const value = String(role || "").trim().toLowerCase();
	if (value === "students") return "student";
	if (["faculties", "faculty-member", "faculty_member", "teacher", "cfac"].includes(value)) {
		return "faculty";
	}
	return value;
};

module.exports = (allowedRoles = []) => {
	const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));

	return (req, res, next) => {
		const currentRole = normalizeRole(req.user?.role);

		if (!req.user || !currentRole || !normalizedAllowed.includes(currentRole)) {
			return res.status(403).json({ message: "Forbidden" });
		}

		req.user.role = currentRole;
		return next();
	};
};
