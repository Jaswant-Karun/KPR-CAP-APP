const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
	getTodayTimetable,
	getWeekTimetable,
	upsertWeekTimetable,
} = require("../controllers/timetableController");

router.get("/today", auth, getTodayTimetable);
router.get("/week", auth, getWeekTimetable);
router.post("/bulk-upsert", auth, allowRoles(["admin", "faculty"]), upsertWeekTimetable);

module.exports = router;
