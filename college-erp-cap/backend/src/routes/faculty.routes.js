const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const {
	getTodayTimetable,
	getWeekTimetable,
} = require("../controllers/timetableController");

router.get("/:audienceId/timetable/today", auth, (req, res) => {
	req.params.audienceType = "faculty";
	return getTodayTimetable(req, res);
});

router.get("/:audienceId/timetable/week", auth, (req, res) => {
	req.params.audienceType = "faculty";
	return getWeekTimetable(req, res);
});

module.exports = router;
