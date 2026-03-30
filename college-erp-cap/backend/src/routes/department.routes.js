const express = require("express");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const router = express.Router();

router.use(auth);

router.get("/", listDepartments);

router.use(allowRoles(["admin"]));
router.post("/", createDepartment);
router.patch("/:departmentId", updateDepartment);
router.delete("/:departmentId", deleteDepartment);

module.exports = router;
