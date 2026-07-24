const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

// Diagnostic endpoint - bypasses auth for testing
router.get("/diagnostic/check-password", async (req, res) => {
  try {
    const { email, password } = req.query;
    
    if (!email || !password) {
      return res.status(400).json({ message: "email and password query params required" });
    }

    // Query the user
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        email,
        found: false,
        message: "User not found in database"
      });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    return res.json({
      email,
      found: true,
      passwordMatch: match,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHashPrefix: String(user.password_hash).substring(0, 30)
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Diagnostic check failed", error: err.message });
  }
});

// Test endpoint to check timetable data
router.get("/diagnostic/timetable-data", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT audience_id, audience_type, COUNT(*) as count FROM timetables GROUP BY audience_id, audience_type ORDER BY audience_id"
    );

    const detailed = await pool.query(
      "SELECT * FROM timetables WHERE audience_id = 1587 LIMIT 5"
    );

    return res.json({
      summary: result.rows,
      sampleData: detailed.rows
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch timetable data", error: err.message });
  }
});

module.exports = router;
