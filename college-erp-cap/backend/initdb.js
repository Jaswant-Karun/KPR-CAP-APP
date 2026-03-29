const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const pgHost = process.env.PG_HOST || "localhost";
const pgPort = Number(process.env.PG_PORT || 5432);
const pgUser = process.env.PG_USER || "postgres";
const pgPassword = process.env.PG_PASSWORD || "postgres";
const dbName = process.env.PG_DATABASE || "kpr_erp";

async function initializeDatabase() {
  // First, connect to 'postgres' database to create our database
  const adminPool = new Pool({
    host: pgHost,
    port: pgPort,
    user: pgUser,
    password: pgPassword,
    database: "postgres", // Connect to default postgres database
  });

  try {
    console.log(`\n📦 Initializing PostgreSQL database setup...`);
    console.log(`🔗 Connecting as ${pgUser}@${pgHost}:${pgPort}`);

    // Check if database exists and create if it doesn't
    const checkDbResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDbResult.rows.length === 0) {
      console.log(`\n📝 Creating database: ${dbName}...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully!`);
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }

    await adminPool.end();

    // Now connect to the actual database and create schema
    console.log(`\n🏗️  Creating database schema...`);
    const mainPool = new Pool({
      host: pgHost,
      port: pgPort,
      user: pgUser,
      password: pgPassword,
      database: dbName,
    });

    // Create tables
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(160) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
        roll_no VARCHAR(40),
        department VARCHAR(80),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log(`  ✓ users table ready`);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id SERIAL PRIMARY KEY,
        audience_type VARCHAR(20) NOT NULL CHECK (audience_type IN ('student', 'faculty')),
        audience_id INT,
        day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        period_no INT NOT NULL CHECK (period_no > 0),
        subject_name VARCHAR(120) NOT NULL,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        room VARCHAR(50),
        faculty_name VARCHAR(120),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (audience_type, audience_id, day_of_week, period_no)
      );
    `);
    console.log(`  ✓ timetables table ready`);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS attendance_entries (
        id SERIAL PRIMARY KEY,
        faculty_id INT NOT NULL,
        student_id INT NOT NULL,
        roll_no VARCHAR(40),
        student_name VARCHAR(120),
        attendance_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'on-duty')),
        subject VARCHAR(120) NOT NULL DEFAULT 'General',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (faculty_id, student_id, attendance_date, subject)
      );
    `);
    console.log(`  ✓ attendance_entries table ready`);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS id_card_upload_audit (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(40),
        uploader_id INT,
        uploader_role VARCHAR(20),
        uploader_email VARCHAR(160),
        uploader_name VARCHAR(120),
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_public_id VARCHAR(255),
        file_provider VARCHAR(50),
        client_ip VARCHAR(80),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log(`  ✓ id_card_upload_audit table ready`);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS student_id_card_photos (
        student_id INT PRIMARY KEY,
        file_url TEXT NOT NULL,
        file_public_id VARCHAR(255),
        file_provider VARCHAR(50),
        updated_by INT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log(`  ✓ student_id_card_photos table ready`);

    // Check if default users exist
    const usersCount = await mainPool.query(`SELECT COUNT(*) FROM users`);
    if (usersCount.rows[0].count === 0) {
      console.log(`\n👥 Seeding default users...`);
      const bcrypt = require("bcryptjs");
      const seedPassword = process.env.DEFAULT_USER_PASSWORD || "Admin@123";
      const passwordHash = await bcrypt.hash(seedPassword, 10);

      const defaultUsers = [
        {
          name: "Admin User",
          email: "kpr0123@kpriet.ac.in",
          role: "admin",
          roll_no: "ADM001",
          department: "Administration",
        },
        {
          name: "Student User",
          email: "student@kpriet.ac.in",
          role: "student",
          roll_no: "24CB023",
          department: "CSE",
        },
        {
          name: "Faculty User",
          email: "faculty@kpriet.ac.in",
          role: "faculty",
          roll_no: "FAC101",
          department: "CSE",
        },
      ];

      for (const user of defaultUsers) {
        await mainPool.query(
          `INSERT INTO users (name, email, password_hash, role, roll_no, department)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING`,
          [user.name, user.email, passwordHash, user.role, user.roll_no, user.department]
        );
        console.log(`  ✓ Created: ${user.email} (${user.role})`);
      }
    } else {
      console.log(`✅ Users already exist in database`);
    }

    await mainPool.end();

    console.log(`\n✅ Database initialization complete!\n`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Database initialization failed:`, error.message);
    process.exit(1);
  }
}

initializeDatabase();
