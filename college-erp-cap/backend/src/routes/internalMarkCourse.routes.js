const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  listInternalMarkCourses,
  createInternalMarkCourse,
  updateInternalMarkCourse,
  deleteInternalMarkCourse,
} = require("../controllers/internalMarkCourseController");

router.use(auth);
router.use(allowRoles(["faculty", "admin"]));

router.get("/", listInternalMarkCourses);
router.post("/", createInternalMarkCourse);
router.patch("/:courseId", updateInternalMarkCourse);
router.delete("/:courseId", deleteInternalMarkCourse);

module.exports = router;
