const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { getUserByEmail, createUser } = require("../config/db");
const auth = require("../middleware/auth.middleware");
const { getCurrentUser, logout } = require("../controllers/authController");
const {
  normalizeEmail,
  isAllowedCollegeEmail,
  hasStrongPassword,
} = require("../validations/auth.validation");
const { signToken } = require("../utils/jwt");

const UNIQUE_ADMIN_EMAIL = "kpr0123@kpriet.ac.in";

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "student", rollNo, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (!hasStrongPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isAllowedCollegeEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Only @kpriet.ac.in email is allowed" });
    }

    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const allowedRoles = ["student", "faculty", "admin"];
    let safeRole = allowedRoles.includes(role) ? role : "student";

    // Enforce a single unique admin login identity.
    if (safeRole === "admin" && normalizedEmail !== UNIQUE_ADMIN_EMAIL) {
      return res.status(403).json({
        message: `Only ${UNIQUE_ADMIN_EMAIL} can be registered as admin`,
      });
    }

    if (normalizedEmail === UNIQUE_ADMIN_EMAIL) {
      safeRole = "admin";
    }

    const localPart = normalizedEmail.split("@")[0];
    if (rollNo && localPart !== String(rollNo).trim().toLowerCase()) {
      return res.status(400).json({
        message: "Email username must match roll number (example: 24cb023@kpriet.ac.in)",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: safeRole,
      rollNo: rollNo ? String(rollNo).trim() : null,
      department: department ? String(department).trim() : null,
    });

    const token = signToken({ id: createdUser.id, role: createdUser.role, email: createdUser.email });

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
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isAllowedCollegeEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Only @kpriet.ac.in email is allowed" });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: "Role mismatch" });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNo: user.roll_no,
        department: user.department,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.get("/me", auth, getCurrentUser);
router.post("/logout", auth, logout);

module.exports = router;
