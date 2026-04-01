const { getUserByEmail } = require("../config/db");

const getCurrentUser = async (req, res) => {
	try {
		if (!req.user?.email) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const user = await getUserByEmail(req.user.email);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.json({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				rollNo: user.roll_no,
				department: user.department,
				residentType: user.resident_type || "day-scholar",
			},
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch user", error: error.message });
	}
};

const logout = (req, res) => {
	return res.json({ message: "Logout successful on client token disposal" });
};

module.exports = {
	getCurrentUser,
	logout,
};
