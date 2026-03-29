const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DATABASE || "kpr_erp",
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const seedAdminUser = async () => {
  try {
    const adminEmail = "kpr0123@kpriet.ac.in";
    const adminPassword = "Kprietuser";
    const adminName = "KPR Admin";

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Check if admin already exists
    const existingAdmin = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log("✓ Admin user already exists with email:", adminEmail);
      const existingUser = existingAdmin.rows[0];
      console.log("  - Name:", existingUser.name);
      console.log("  - Role:", existingUser.role);
      console.log("  - Created At:", existingUser.created_at);

      // Update password if needed
      const result = await pool.query(
        `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *`,
        [passwordHash, adminEmail]
      );
      console.log("\n✓ Admin password updated successfully");
      console.log("\n--- ADMIN LOGIN CREDENTIALS ---");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
      console.log("Role: ADMIN");
      console.log("-------------------------------\n");
      return;
    }

    // Create new admin user
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role, roll_no, department)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, role, created_at
      `,
      [adminName, adminEmail, passwordHash, "admin", "ADM001", "Administration"]
    );

    const newAdmin = result.rows[0];
    console.log("✓ Admin user created successfully!");
    console.log("\n--- ADMIN LOGIN CREDENTIALS ---");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Role: ADMIN");
    console.log("Name:", newAdmin.name);
    console.log("ID:", newAdmin.id);
    console.log("Created At:", newAdmin.created_at);
    console.log("-------------------------------\n");

    console.log("⚠️  IMPORTANT NOTES:");
    console.log("1. This admin user (kpr0123@kpriet.ac.in) is the ONLY admin user allowed");
    console.log("2. Admin can view, edit, and delete student and faculty records");
    console.log("3. All admin operations require authentication with this email");
    console.log("4. Keep these credentials secure!\n");

  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedAdminUser();
