const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getStudentProfile } = require("../controllers/studentController");
const { getUserByEmail } = require("../config/db");
const { getAttendanceEntries } = require("../controllers/facultyController");
const {
	getTodayTimetable,
	getWeekTimetable,
} = require("../controllers/timetableController");

const resolveFacultyAudienceId = (req) => {
	const requested = Number(req.query.facultyId);
	if (!Number.isNaN(requested) && requested > 0) {
		return requested;
	}

	const defaultFacultyId = Number(process.env.DEFAULT_FACULTY_ID || 3);
	return Number.isNaN(defaultFacultyId) ? 3 : defaultFacultyId;
};

router.get("/:studentId/attendance", auth, async (req, res) => {
	try {
		const student = await getUserByEmail(req.user?.email || "");
		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		const rollNo = String(student.roll_no || "").toUpperCase();
		const studentId = Number(req.params.studentId || req.user?.id);
		const allEntries = getAttendanceEntries();
		const entries = allEntries.filter((item) => {
			const byRoll = rollNo && String(item.rollNo || "").toUpperCase() === rollNo;
			const byStudentId = Number(item.studentId) === studentId;
			return byRoll || byStudentId;
		});

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

router.get("/:audienceId/timetable/today", auth, (req, res) => {
	req.params.audienceType = "faculty";
	req.params.audienceId = String(resolveFacultyAudienceId(req));
	return getTodayTimetable(req, res);
});

router.get("/:audienceId/timetable/week", auth, (req, res) => {
	req.params.audienceType = "faculty";
	req.params.audienceId = String(resolveFacultyAudienceId(req));
	return getWeekTimetable(req, res);
});

module.exports = router;
