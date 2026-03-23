const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
	listFacultyMembers,
  getFacultyProfile,
  getStudentsForFaculty,
  submitAttendance,
  getFacultyReports,
} = require("../controllers/facultyController");
const {
	getTodayTimetable,
	getWeekTimetable,
} = require("../controllers/timetableController");

router.get("/list/all", auth, allowRoles(["student", "faculty", "admin"]), listFacultyMembers);
router.get("/:facultyId", auth, allowRoles(["faculty", "admin"]), getFacultyProfile);
router.get("/:facultyId/students", auth, allowRoles(["faculty", "admin"]), getStudentsForFaculty);
router.post("/:facultyId/attendance", auth, allowRoles(["faculty", "admin"]), submitAttendance);
router.get("/:facultyId/reports", auth, allowRoles(["faculty", "admin"]), getFacultyReports);

router.get("/:audienceId/timetable/today", auth, (req, res) => {
	req.params.audienceType = "faculty";
	return getTodayTimetable(req, res);
});

router.get("/:audienceId/timetable/week", auth, (req, res) => {
	req.params.audienceType = "faculty";
	return getWeekTimetable(req, res);
});

module.exports = router;
