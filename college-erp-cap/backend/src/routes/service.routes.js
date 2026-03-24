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
	createAoBooking,
	listAoBookings,
	deleteAoBooking,
	updateAoBookingStatus,
	createFusionBooking,
	listFusionBookings,
	deleteFusionBooking,
	updateFusionBookingStatus,
} = require("../controllers/serviceController");

router.use(auth);

router.post("/requests", allowRoles(["student", "faculty", "admin"]), createServiceRequest);
router.get("/requests", allowRoles(["student", "faculty", "admin"]), listServiceRequests);
router.patch("/requests/:requestId/status", allowRoles(["faculty", "admin"]), updateServiceRequestStatus);

router.post("/gatepass", allowRoles(["student"]), createGatepassRequest);
router.get("/gatepass", allowRoles(["student", "faculty", "admin"]), listGatepassRequests);
router.patch("/gatepass/:gatepassId/status", allowRoles(["faculty", "admin"]), updateGatepassStatus);

router.post("/ao-bookings", allowRoles(["student", "faculty", "admin"]), createAoBooking);
router.get("/ao-bookings", allowRoles(["student", "faculty", "admin"]), listAoBookings);
router.delete("/ao-bookings/:bookingId", allowRoles(["student", "faculty", "admin"]), deleteAoBooking);
router.patch("/ao-bookings/:bookingId/status", allowRoles(["faculty", "admin"]), updateAoBookingStatus);

router.post("/fusion-bookings", allowRoles(["student", "faculty", "admin"]), createFusionBooking);
router.get("/fusion-bookings", allowRoles(["student", "faculty", "admin"]), listFusionBookings);
router.delete("/fusion-bookings/:bookingId", allowRoles(["student", "faculty", "admin"]), deleteFusionBooking);
router.patch("/fusion-bookings/:bookingId/status", allowRoles(["faculty", "admin"]), updateFusionBookingStatus);

module.exports = router;
