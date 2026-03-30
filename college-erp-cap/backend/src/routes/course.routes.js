const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  createCourse,
  getCoursesByDepartment,
  getCoursesByFaculty,
  enrollStudent,
  getStudentEnrollments,
  getStudentEnrollmentsForFaculty,
  getCourseEnrollments,
  dropCourse,
} = require("../controllers/courseController");

router.use(auth);

// Faculty only - create and manage courses
router.post("/", allowRoles(["faculty", "admin"]), createCourse);
router.get("/faculty/my-courses", allowRoles(["faculty", "admin"]), getCoursesByFaculty);
router.get("/faculty/student/:studentId/enrollments", allowRoles(["faculty", "admin"]), getStudentEnrollmentsForFaculty);
router.get("/faculty/:courseId/enrollments", allowRoles(["faculty", "admin"]), getCourseEnrollments);

// Student - browse and enroll in courses
router.get("/department", allowRoles(["student", "faculty", "admin"]), getCoursesByDepartment);
router.post("/:courseId/enroll", allowRoles(["student"]), enrollStudent);
router.get("/student/my-enrollments", allowRoles(["student"]), getStudentEnrollments);
router.patch("/enrollments/:enrollmentId/drop", allowRoles(["student"]), dropCourse);

module.exports = router;
