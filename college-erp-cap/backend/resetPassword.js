const { Pool } = require("pg");

// Try to connect WITHOUT password first (default setup)
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "", // empty password - default on Windows installations
  database: "postgres",
});

async function resetPassword() {
  try {
    console.log("Attempting to connect to PostgreSQL...");
    await pool.query("SELECT 1");
    console.log("✅ Connected successfully");

    console.log("Setting password for postgres user...");
    await pool.query("ALTER USER postgres WITH PASSWORD 'Admin@123';");
    console.log("✅ Password updated to: Admin@123");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Try connecting with: ALTER USER postgres WITH PASSWORD 'Admin@123';");
    process.exit(1);
  }
}

resetPassword();
