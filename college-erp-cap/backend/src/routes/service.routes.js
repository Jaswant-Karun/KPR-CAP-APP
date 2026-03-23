const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
	createServiceRequest,
	listServiceRequests,
	updateServiceRequestStatus,
	createGatepassRequest,
	listGatepassRequests,
	updateGatepassStatus,
} = require("../controllers/serviceController");

router.use(auth);

router.post("/requests", allowRoles(["student", "faculty", "admin"]), createServiceRequest);
router.get("/requests", allowRoles(["student", "faculty", "admin"]), listServiceRequests);
router.patch("/requests/:requestId/status", allowRoles(["faculty", "admin"]), updateServiceRequestStatus);

router.post("/gatepass", allowRoles(["student", "faculty", "admin"]), createGatepassRequest);
router.get("/gatepass", allowRoles(["student", "faculty", "admin"]), listGatepassRequests);
router.patch("/gatepass/:gatepassId/status", allowRoles(["faculty", "admin"]), updateGatepassStatus);

module.exports = router;
