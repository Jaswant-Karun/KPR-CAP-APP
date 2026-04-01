const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  listDigitalAssets,
  createDigitalAsset,
  deleteDigitalAsset,
} = require("../controllers/digitalAssetsController");

router.use(auth);

router.get("/", allowRoles(["student", "faculty", "admin"]), listDigitalAssets);
router.post("/", allowRoles(["admin"]), createDigitalAsset);
router.delete("/:assetId", allowRoles(["admin"]), deleteDigitalAsset);

module.exports = router;
