const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { normalizeUploadPayload } = require("../middleware/upload.middleware");
const { uploadStudentIdCardPhoto } = require("../controllers/studentController");
// Faculty uploads ID card photo for a student
router.post(
  "/:facultyId/students/:studentId/id-card-photo",
  auth,
  allowRoles(["faculty", "admin"]),
  normalizeUploadPayload,
  uploadStudentIdCardPhoto
);
const {
	listFacultyMembers,
	getFacultyProfile,
	getStudentsForFaculty,
	submitAttendance,
	getFacultyReports,
	uploadIdCardPhoto,
} = require("../controllers/facultyController");
// Faculty ID card photo upload
router.post("/:facultyId/id-card-photo", auth, allowRoles(["faculty", "admin"]), normalizeUploadPayload, uploadIdCardPhoto);

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
