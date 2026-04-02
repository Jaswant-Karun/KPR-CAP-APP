const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { normalizeUploadPayload } = require("../middleware/upload.middleware");
const {
	createServiceRequest,
	listServiceRequests,
	updateServiceRequestStatus,
	acceptIdCardReissueRequest,
	escalateIdCardReissueRequest,
	grantIboxRequisitionPermission,
	convertIboxRequisitionToComplaint,
	deleteServiceRequest,
	createHallTicket,
	listHallTickets,
	downloadHallTicket,
	replaceHallTicket,
	deleteHallTicket,
	verifyHallTicket,
	listHallTicketAudit,
	createGatepassRequest,
	listGatepassRequests,
	updateGatepassStatus,
	createLatecomerRequest,
	listLatecomerRequests,
	updateLatecomerStatus,
	createAoBooking,
	listAoBookings,
	deleteAoBooking,
	updateAoBookingStatus,
	createFusionBooking,
	listFusionBookings,
	deleteFusionBooking,
	updateFusionBookingStatus,
	createEvent,
	updateEvent,
	deleteEvent,
	listEvents,
	registerEvent,
	unregisterEvent,
	listWaiverRequests,
	updateWaiverRequestStatus,
} = require("../controllers/serviceController");

router.use(auth);

router.post("/requests", allowRoles(["student", "faculty", "admin"]), createServiceRequest);
router.get("/requests", allowRoles(["student", "faculty", "admin"]), listServiceRequests);
router.patch("/requests/:requestId/status", allowRoles(["faculty", "admin"]), updateServiceRequestStatus);
router.patch("/requests/:requestId/id-card-accept", allowRoles(["faculty", "admin"]), acceptIdCardReissueRequest);
router.patch("/requests/:requestId/id-card-escalate", allowRoles(["faculty"]), escalateIdCardReissueRequest);
router.patch("/requests/:requestId/ibox-permission", allowRoles(["student"]), grantIboxRequisitionPermission);
router.post("/requests/:requestId/ibox-convert", allowRoles(["faculty"]), convertIboxRequisitionToComplaint);
router.delete("/requests/:requestId", allowRoles(["student", "faculty", "admin"]), deleteServiceRequest);

router.post("/hall-tickets/upload", allowRoles(["admin"]), normalizeUploadPayload, createHallTicket);
router.get("/hall-tickets", allowRoles(["student", "faculty", "admin"]), listHallTickets);
router.get("/hall-tickets/:hallTicketId/download", allowRoles(["student", "faculty", "admin"]), downloadHallTicket);
router.patch("/hall-tickets/:hallTicketId/verify", allowRoles(["faculty", "admin"]), verifyHallTicket);
router.patch("/hall-tickets/:hallTicketId/replace", allowRoles(["admin"]), normalizeUploadPayload, replaceHallTicket);
router.delete("/hall-tickets/:hallTicketId", allowRoles(["admin"]), deleteHallTicket);
router.get("/hall-tickets/audit", allowRoles(["admin", "faculty"]), listHallTicketAudit);

router.post("/gatepass", allowRoles(["student", "faculty", "admin"]), createGatepassRequest);
router.get("/gatepass", allowRoles(["student", "faculty", "admin"]), listGatepassRequests);
router.patch("/gatepass/:gatepassId/status", allowRoles(["faculty", "admin"]), updateGatepassStatus);

router.post("/latecomers", allowRoles(["student"]), createLatecomerRequest);
router.get("/latecomers", allowRoles(["student", "faculty", "admin"]), listLatecomerRequests);
router.patch("/latecomers/:requestId/status", allowRoles(["faculty", "admin"]), updateLatecomerStatus);

router.post("/ao-bookings", allowRoles(["student", "faculty", "admin"]), createAoBooking);
router.get("/ao-bookings", allowRoles(["student", "faculty", "admin"]), listAoBookings);
router.delete("/ao-bookings/:bookingId", allowRoles(["student", "faculty", "admin"]), deleteAoBooking);
router.patch("/ao-bookings/:bookingId/status", allowRoles(["faculty", "admin"]), updateAoBookingStatus);

router.post("/fusion-bookings", allowRoles(["student", "faculty", "admin"]), createFusionBooking);
router.get("/fusion-bookings", allowRoles(["student", "faculty", "admin"]), listFusionBookings);
router.delete("/fusion-bookings/:bookingId", allowRoles(["student", "faculty", "admin"]), deleteFusionBooking);
router.patch("/fusion-bookings/:bookingId/status", allowRoles(["faculty", "admin"]), updateFusionBookingStatus);

router.post("/events", allowRoles(["faculty", "admin"]), normalizeUploadPayload, createEvent);
router.get("/events", allowRoles(["student", "faculty", "admin"]), listEvents);
router.patch("/events/:eventId", allowRoles(["faculty", "admin"]), normalizeUploadPayload, updateEvent);
router.delete("/events/:eventId", allowRoles(["faculty", "admin"]), deleteEvent);
router.post("/events/:eventId/register", allowRoles(["student"]), registerEvent);
router.delete("/events/:eventId/register", allowRoles(["student"]), unregisterEvent);

router.get("/waivers", allowRoles(["student", "faculty", "admin"]), listWaiverRequests);
router.patch("/waivers/:waiverId/status", allowRoles(["faculty", "admin"]), updateWaiverRequestStatus);

module.exports = router;
