const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { normalizeUploadPayload } = require("../middleware/upload.middleware");
const {
  createNdcAchievement,
  listNdcAchievements,
  getNdcAchievementById,
  updateNdcAchievementStatus,
  markNdcAchievementDeleted,
} = require("../controllers/ndcAchievementController");

router.use(auth);

router.get("/", allowRoles(["student", "faculty", "admin"]), listNdcAchievements);
router.get("/:achievementId", allowRoles(["student", "faculty", "admin"]), getNdcAchievementById);
router.post("/", allowRoles(["student"]), normalizeUploadPayload, createNdcAchievement);
router.patch("/:achievementId/status", allowRoles(["faculty"]), updateNdcAchievementStatus);
router.patch("/:achievementId/delete", allowRoles(["student"]), markNdcAchievementDeleted);

module.exports = router;
