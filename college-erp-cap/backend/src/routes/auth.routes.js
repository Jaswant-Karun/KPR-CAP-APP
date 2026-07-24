const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { getUserByEmail, createUser, pool } = require("../config/db");
const auth = require("../middleware/auth.middleware");
const { getCurrentUser, logout } = require("../controllers/authController");
const {
  normalizeEmail,
  isAllowedCollegeEmail,
  hasStrongPassword,
} = require("../validations/auth.validation");
const { signToken } = require("../utils/jwt");
const { getOrCreateSystemSettings } = require("../services/systemSettings.service");

const buildAuthSuccess = (user, message = "Login successful") => {
  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    residentType: user.resident_type || "day-scholar",
  });

  return {
    message,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.roll_no,
      department: user.department,
      residentType: user.resident_type || "day-scholar",
    },
  };
};

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "student", rollNo, department } = req.body;
    const systemSettings = await getOrCreateSystemSettings();

    const allowedRoles = ["student", "faculty", "admin"];
    const normalizedRole = String(role || "student").trim().toLowerCase();
    let safeRole = allowedRoles.includes(normalizedRole) ? normalizedRole : "student";

    let normalizedEmail = normalizeEmail(email);
    let effectivePassword = password;
    let effectiveName = String(name || "").trim();
    let effectiveRollNo = rollNo ? String(rollNo).trim() : null;
    let effectiveDepartment = department ? String(department).trim() : null;

    if (!effectiveName || !normalizedEmail || !effectivePassword) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (systemSettings.enforceStrongPassword && !hasStrongPassword(effectivePassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      });
    }

    if (!isAllowedCollegeEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Only @kpriet.ac.in email is allowed" });
    }

    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    if (safeRole === "student" && !systemSettings.allowStudentSignup) {
      return res.status(403).json({ message: "Student signup is currently disabled by admin" });
    }

    if (safeRole === "faculty" && !systemSettings.allowFacultySignup) {
      return res.status(403).json({ message: "Faculty signup is currently disabled by admin" });
    }

    const localPart = normalizedEmail.split("@")[0];
    if (safeRole !== "admin" && effectiveRollNo && localPart !== String(effectiveRollNo).trim().toLowerCase()) {
      return res.status(400).json({
        message: "Email username must match roll number (example: 24cb023@kpriet.ac.in)",
      });
    }

    const passwordHash = await bcrypt.hash(effectivePassword, 10);
    const createdUser = await createUser({
      name: effectiveName,
      email: normalizedEmail,
      passwordHash,
      role: safeRole,
      rollNo: effectiveRollNo,
      department: effectiveDepartment,
      residentType: "day-scholar",
    });

    const token = signToken({
      id: createdUser.id,
      role: createdUser.role,
      email: createdUser.email,
      residentType: createdUser.resident_type || "day-scholar",
    });

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        rollNo: createdUser.roll_no,
        department: createdUser.department,
        residentType: createdUser.resident_type || "day-scholar",
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const systemSettings = await getOrCreateSystemSettings();
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isAllowedCollegeEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Only @kpriet.ac.in email is allowed" });
    }

    const user = await getUserByEmail(normalizedEmail);
    console.log(`[AUTH DEBUG] Login attempt for ${normalizedEmail}, User found: ${!!user}, Password provided: ${!!password}`);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requestedRole = role ? String(role).trim().toLowerCase() : "";
    const passwordHash = user.password_hash;
    console.log(`[AUTH DEBUG] Comparing password. Hash exists: ${!!passwordHash}, Hash starts with: ${String(passwordHash).substring(0, 30)}`);
    
    let match = await bcrypt.compare(password, passwordHash);
    console.log(`[AUTH DEBUG] Password match result: ${match}`);

    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (requestedRole && user.role !== requestedRole) {
      return res.status(401).json({ message: "Role mismatch" });
    }

    if (systemSettings.maintenanceMode && user.role !== "admin") {
      return res.status(503).json({ message: "System is under maintenance. Please try again later." });
    }

    return res.json(buildAuthSuccess(user));
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.get("/me", auth, getCurrentUser);
router.post("/logout", auth, logout);

module.exports = router;
