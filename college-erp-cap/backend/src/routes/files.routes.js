const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { normalizeUploadPayload } = require("../middleware/upload.middleware");
const {
	uploadStudentIdCard,
	listIdCardUploadAudit,
	getStudentIdCard,
	deleteStudentIdCard,
} = require("../controllers/filesController");

router.get("/upload/audit", auth, allowRoles(["faculty"]), listIdCardUploadAudit);

router.post(
	"/upload",
	auth,
		allowRoles(["faculty"]),
	normalizeUploadPayload,
	uploadStudentIdCard
);

router.get("/upload/student/:studentId", auth, allowRoles(["faculty"]), getStudentIdCard);
router.delete("/upload/student/:studentId", auth, allowRoles(["faculty"]), deleteStudentIdCard);

module.exports = router;