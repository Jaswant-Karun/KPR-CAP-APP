const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
	getAllStudents,
	getStudentById,
	editStudentDetails,
	deleteStudent,
	getAllFaculty,
	getFacultyById,
	getFacultyControlledStudents,
	getFacultyControlMapForAdmin,
	setFacultyControlMapForAdmin,
	editFacultyDetails,
	deleteFaculty,
	getAdminDashboardStats,
} = require("../controllers/adminController");

const UNIQUE_ADMIN_EMAIL = "kpr0123@kpriet.ac.in";

const enforceUniqueAdminEmail = (req, res, next) => {
	if (!req.user || req.user.email !== UNIQUE_ADMIN_EMAIL) {
		return res.status(403).json({
			message: "Access denied. Only the unique admin user can access this endpoint.",
		});
	}
	return next();
};

// Apply authentication + admin role + unique admin email to all admin routes
router.use(auth, role(["admin"]), enforceUniqueAdminEmail);

// Dashboard
router.get("/dashboard", getAdminDashboardStats);

// Student management (admin-only)
router.get("/students", getAllStudents);
router.get("/students/:studentId", getStudentById);
router.put("/students/:studentId", editStudentDetails);
router.delete("/students/:studentId", deleteStudent);

// Faculty management (admin-only)
router.get("/faculty", getAllFaculty);
router.get("/faculty/:facultyId", getFacultyById);
router.get("/faculty/:facultyId/students", getFacultyControlledStudents);
router.get("/faculty/:facultyId/control-map", getFacultyControlMapForAdmin);
router.post("/faculty/:facultyId/control-map", setFacultyControlMapForAdmin);
router.put("/faculty/:facultyId", editFacultyDetails);
router.delete("/faculty/:facultyId", deleteFaculty);

module.exports = router;
