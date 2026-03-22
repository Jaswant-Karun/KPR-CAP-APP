const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
	createServiceRequest,
	listServiceRequests,
	updateServiceRequestStatus,
} = require("../controllers/serviceController");

router.use(auth);

router.post("/requests", allowRoles(["student", "faculty", "admin"]), createServiceRequest);
router.get("/requests", allowRoles(["student", "faculty", "admin"]), listServiceRequests);
router.patch("/requests/:requestId/status", allowRoles(["faculty", "admin"]), updateServiceRequestStatus);

module.exports = router;
