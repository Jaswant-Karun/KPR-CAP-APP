const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getStudentProfile } = require("../controllers/studentController");
const {
	getTodayTimetable,
	getWeekTimetable,
} = require("../controllers/timetableController");

router.get("/profile", auth, getStudentProfile);

router.get("/:audienceId/timetable/today", auth, (req, res) => {
	req.params.audienceType = "student";
	return getTodayTimetable(req, res);
});

router.get("/:audienceId/timetable/week", auth, (req, res) => {
	req.params.audienceType = "student";
	return getWeekTimetable(req, res);
});

module.exports = router;
