const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  listCycles,
  createCycle,
  activateCycle,
  getStudentFeedbackContext,
  submitStudentFeedback,
  listFeedbackUsers,
  getSubmissionDetails,
  listStudentReports,
  listFacultyPerformance,
  submitFacultyReason,
  submitAdminAction,
} = require("../controllers/courseFeedbackController");

router.use(auth);

router.get("/cycles", allowRoles(["admin", "faculty"]), listCycles);
router.post("/cycles", allowRoles(["admin"]), createCycle);
router.patch("/cycles/:cycleId/activate", allowRoles(["admin"]), activateCycle);

router.get("/student/context", allowRoles(["student"]), getStudentFeedbackContext);
router.post("/student/submit", allowRoles(["student"]), submitStudentFeedback);
router.get("/student/reports", allowRoles(["student"]), listStudentReports);

router.get("/users", allowRoles(["admin", "faculty"]), listFeedbackUsers);
router.get("/users/:submissionId", allowRoles(["admin", "faculty", "student"]), getSubmissionDetails);

router.get("/faculty/performance", allowRoles(["admin", "faculty"]), listFacultyPerformance);
router.post("/faculty/cycles/:cycleId/reason", allowRoles(["faculty"]), submitFacultyReason);
router.post("/admin/cycles/:cycleId/faculty/:facultyId/action", allowRoles(["admin"]), submitAdminAction);

module.exports = router;
