const { verifyToken } = require("../utils/jwt");
const { getOrCreateSystemSettings } = require("../services/systemSettings.service");

const ALLOWED_PUBLIC_PATHS = new Set([
  "/",
  "/api/admin/settings/public",
  "/api/auth/login",
  "/api/auth/signup",
]);

module.exports = async (req, res, next) => {
  try {
    const settings = await getOrCreateSystemSettings();

    if (!settings.maintenanceMode) {
      return next();
    }

    if (ALLOWED_PUBLIC_PATHS.has(req.path)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyToken(token);
        if (decoded?.role === "admin") {
          return next();
        }
      } catch (error) {
        // Fall through and return maintenance response for non-admin/invalid tokens.
      }
    }

    return res.status(503).json({
      message: "System is under maintenance. Please try again later.",
    });
  } catch (error) {
    return next();
  }
};
