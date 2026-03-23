const express = require("express");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  listStudentsForRole,
  listRegistrations,
  createRegistration,
  updateRegistration,
  getRegistrationHistory,
  getRegistrationInternals,
  downloadRegistration,
} = require("../controllers/cfacController");

const router = express.Router();

router.use(auth);
router.use(allowRoles(["student", "faculty", "admin"]));

router.get("/students", listStudentsForRole);
router.get("/registrations", listRegistrations);
router.post("/registrations", createRegistration);
router.patch("/registrations/:registrationId", updateRegistration);
router.get("/registrations/:registrationId/history", getRegistrationHistory);
router.get("/registrations/:registrationId/internals", getRegistrationInternals);
router.get("/registrations/:registrationId/download", downloadRegistration);

module.exports = router;
