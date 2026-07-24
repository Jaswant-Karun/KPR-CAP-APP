const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getStudentProfile } = require("../controllers/studentController");
const { getAttendanceEntries } = require("../controllers/facultyController");
const { pool } = require("../config/db");
const {
	getTodayTimetable,
	getWeekTimetable,
} = require("../controllers/timetableController");

const resolveFacultyAudienceId = async (req) => {
	const requested = Number(req.query.facultyId);
	if (!Number.isNaN(requested) && requested > 0) {
		return requested;
	}

	const tokenUserId = Number(req.user?.id || 0);
	if (Number.isInteger(tokenUserId) && tokenUserId > 0) {
		const mappedFaculty = await pool.query(
			`SELECT faculty_id FROM faculty_control_maps WHERE student_ids @> ARRAY[$1]::int[] LIMIT 1`,
			[tokenUserId]
		);

		if (mappedFaculty.rows.length > 0) {
			return Number(mappedFaculty.rows[0].faculty_id);
		}
	}

	const sivasankariFaculty = await pool.query(
		`SELECT id FROM users WHERE role = 'faculty' AND LOWER(email) = $1 LIMIT 1`,
		["cb003@kpriet.ac.in"]
	);

	if (sivasankariFaculty.rows.length > 0) {
		return Number(sivasankariFaculty.rows[0].id);
	}

	const defaultFacultyId = Number(process.env.DEFAULT_FACULTY_ID || 3);
	return Number.isNaN(defaultFacultyId) ? 3 : defaultFacultyId;
};

router.get("/:studentId/attendance", auth, async (req, res) => {
	try {
		const role = String(req.user?.role || "").toLowerCase();
		const requestedStudentId = Number(req.params.studentId || 0);
		const tokenUserId = Number(req.user?.id || 0);

		if (!["student", "faculty", "admin"].includes(role)) {
			return res.status(403).json({ message: "Forbidden" });
		}

		if ((role === "faculty" || role === "admin") && requestedStudentId <= 0) {
			return res.status(400).json({ message: "Valid studentId is required" });
		}

		if (role === "student" && requestedStudentId > 0 && requestedStudentId !== tokenUserId) {
			return res.status(403).json({ message: "You can only view your own attendance" });
		}

		const targetStudentId = role === "student" ? tokenUserId : requestedStudentId;

		const entriesById = await getAttendanceEntries({
			studentId: targetStudentId,
		});

		let entries = [...entriesById];

		if (role === "student") {
			const studentRow = await pool.query(
				`SELECT roll_no FROM users WHERE id = $1 AND role = 'student' LIMIT 1`,
				[tokenUserId]
			);
			const rollNo = String(studentRow.rows[0]?.roll_no || "").trim().toUpperCase();

			if (rollNo) {
				const entriesByRollNo = await getAttendanceEntries({ rollNo });

				const merged = new Map();
				[...entriesById, ...entriesByRollNo].forEach((entry) => {
					const key = String(entry.id || `${entry.date}-${entry.subject}-${entry.studentId}-${entry.facultyId}`);
					if (!merged.has(key)) {
						merged.set(key, entry);
					}
				});

				entries = Array.from(merged.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
			}
		}

		const total = entries.length;
		const present = entries.filter((item) => item.status === "present").length;
		const absent = entries.filter((item) => item.status === "absent").length;

		return res.json({
			total,
			present,
			absent,
			percentage: total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0,
			entries,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch student attendance", error: error.message });
	}
});

router.get("/profile", auth, getStudentProfile);

router.get("/:audienceId/timetable/today", auth, async (req, res) => {
	try {
		req.params.audienceType = "faculty";
		req.params.audienceId = String(await resolveFacultyAudienceId(req));
		return getTodayTimetable(req, res);
	} catch (error) {
		return res.status(500).json({ message: "Failed to resolve timetable faculty", error: error.message });
	}
});

router.get("/:audienceId/timetable/week", auth, async (req, res) => {
	try {
		req.params.audienceType = "faculty";
		req.params.audienceId = String(await resolveFacultyAudienceId(req));
		return getWeekTimetable(req, res);
	} catch (error) {
		return res.status(500).json({ message: "Failed to resolve timetable faculty", error: error.message });
	}
});

module.exports = router;
