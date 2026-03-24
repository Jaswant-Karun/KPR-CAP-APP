const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { normalizeUploadPayload } = require("../middleware/upload.middleware");
const { uploadStudentIdCard, listIdCardUploadAudit } = require("../controllers/filesController");

router.get("/upload/audit", auth, allowRoles(["faculty", "admin"]), listIdCardUploadAudit);

router.post(
	"/upload",
	auth,
	allowRoles(["faculty", "admin"]),
	normalizeUploadPayload,
	uploadStudentIdCard
);

module.exports = router;