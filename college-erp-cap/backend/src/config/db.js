const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Create a temporary pool to connect to the default 'postgres' database
// This is used only to create the target database if it doesn't exist
const adminPool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: "postgres", // Always connect to 'postgres' database for admin operations
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DATABASE || "kpr_erp",
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const dbState = {
  mode: "postgres",
};

const memoryStore = {
  users: [],
  timetables: [],
  nextTimetableId: 1,
};

const mapUserRow = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  password_hash: user.password_hash,
  role: user.role,
  roll_no: user.roll_no,
  department: user.department,
});

const isAllowedCollegeEmail = (email = "") => /^[a-zA-Z0-9._%+-]+@kpriet\.ac\.in$/i.test(String(email).trim());

const createSchema = async () => {
  await pool.query(`
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

  await pool.query(`
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
};

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

const seedDefaults = async () => {
  const seedPassword = process.env.DEFAULT_USER_PASSWORD || "Password@123";
  const uniqueAdminPassword = process.env.UNIQUE_ADMIN_PASSWORD || "Kprietuser";
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  const uniqueAdminPasswordHash = await bcrypt.hash(uniqueAdminPassword, 10);

  if (dbState.mode === "postgres") {
    for (const user of defaultUsers) {
      const userPasswordHash = user.email === "kpr0123@kpriet.ac.in"
        ? uniqueAdminPasswordHash
        : passwordHash;

      await pool.query(
        `
          INSERT INTO users (name, email, password_hash, role, roll_no, department)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (email)
          DO NOTHING;
        `,
        [
          user.name,
          user.email,
          userPasswordHash,
          user.role,
          user.roll_no,
          user.department,
        ]
      );
    }
    return;
  }

  if (memoryStore.users.length === 0) {
    memoryStore.users = defaultUsers.map((user, index) => ({
      ...user,
      id: index + 1,
      password_hash: user.email === "kpr0123@kpriet.ac.in" ? uniqueAdminPasswordHash : passwordHash,
    }));
  }
};

const connectDB = async () => {
  try {
    const dbName = process.env.PG_DATABASE || "kpr_erp";
    
    // Step 1: Ensure the database exists
    try {
      const checkDb = await adminPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );
      
      if (checkDb.rows.length === 0) {
        console.log(`📦 Creating database: ${dbName}...`);
        await adminPool.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Database ${dbName} created`);
      } else {
        console.log(`✅ Database ${dbName} exists`);
      }
    } catch (dbCheckError) {
      console.warn(`⚠️  Could not verify database existence: ${dbCheckError.message}`);
    } finally {
      try {
        await adminPool.end();
      } catch (e) {
        // Ignore error on pool close
      }
    }
    
    // Step 2: Connect to the target database
    await pool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL");
    
    // Step 3: Create schema and seed data
    await createSchema();
    dbState.mode = "postgres";
    await seedDefaults();
    console.log("✅ Database schema initialized");
  } catch (error) {
    console.error("❌ PostgreSQL Connection Error:");
    console.error("   Code:", error.code);
    console.error("   Message:", error.message);
    if (error.detail) {
      console.error("   Detail:", error.detail);
    }
    dbState.mode = "memory";
    await seedDefaults();
    console.warn("⚠️ PostgreSQL unavailable. Running with in-memory fallback mode.");
  }
};

const getUserByEmail = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (dbState.mode === "postgres") {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, roll_no, department FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail]
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  return memoryStore.users.find((user) => user.email === normalizedEmail) || null;
};

const createUser = async ({ name, email, passwordHash, role, rollNo, department }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (dbState.mode === "postgres") {
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role, roll_no, department)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, role, roll_no, department;
      `,
      [
        name,
        normalizedEmail,
        passwordHash,
        role,
        rollNo || null,
        department || null,
      ]
    );

    return mapUserRow({ ...result.rows[0], password_hash: passwordHash });
  }

  const nextId = memoryStore.users.length > 0
    ? Math.max(...memoryStore.users.map((user) => user.id)) + 1
    : 1;

  const memoryUser = {
    id: nextId,
    name,
    email: normalizedEmail,
    password_hash: passwordHash,
    role,
    roll_no: rollNo || null,
    department: department || null,
  };

  memoryStore.users.push(memoryUser);
  return memoryUser;
};

const getWeekTimetable = async ({ audienceType, audienceId }) => {
  if (dbState.mode === "postgres") {
    const result = await pool.query(
      `
        SELECT id, day_of_week, period_no, subject_name, start_time, end_time, room, faculty_name
        FROM timetables
        WHERE audience_type = $1
          AND (
            (audience_id IS NULL AND $2::int IS NULL)
            OR audience_id = $2
          )
        ORDER BY day_of_week ASC, period_no ASC;
      `,
      [audienceType, audienceId]
    );
    return result.rows;
  }

  return memoryStore.timetables
    .filter(
      (item) =>
        item.audience_type === audienceType &&
        ((item.audience_id === null && audienceId === null) || item.audience_id === audienceId)
    )
    .sort((a, b) => (a.day_of_week - b.day_of_week) || (a.period_no - b.period_no));
};

const getDayTimetable = async ({ audienceType, audienceId, dayOfWeek }) => {
  const rows = await getWeekTimetable({ audienceType, audienceId });
  return rows.filter((item) => item.day_of_week === dayOfWeek);
};

const upsertTimetableEntries = async ({ audienceType, audienceId, entries }) => {
  if (dbState.mode === "postgres") {
    await pool.query("BEGIN");
    try {
      for (const entry of entries) {
        await pool.query(
          `
            INSERT INTO timetables
              (audience_type, audience_id, day_of_week, period_no, subject_name, start_time, end_time, room, faculty_name, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (audience_type, audience_id, day_of_week, period_no)
            DO UPDATE SET
              subject_name = EXCLUDED.subject_name,
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              room = EXCLUDED.room,
              faculty_name = EXCLUDED.faculty_name,
              updated_at = NOW();
          `,
          [
            audienceType,
            audienceId,
            entry.dayOfWeek,
            entry.periodNo,
            entry.subjectName,
            entry.startTime || null,
            entry.endTime || null,
            entry.room || null,
            entry.facultyName || null,
          ]
        );
      }
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
    return;
  }

  for (const entry of entries) {
    const existingIndex = memoryStore.timetables.findIndex(
      (row) =>
        row.audience_type === audienceType &&
        row.audience_id === audienceId &&
        row.day_of_week === entry.dayOfWeek &&
        row.period_no === entry.periodNo
    );

    const updatedRow = {
      id: existingIndex >= 0 ? memoryStore.timetables[existingIndex].id : memoryStore.nextTimetableId++,
      audience_type: audienceType,
      audience_id: audienceId,
      day_of_week: entry.dayOfWeek,
      period_no: entry.periodNo,
      subject_name: entry.subjectName,
      start_time: entry.startTime || null,
      end_time: entry.endTime || null,
      room: entry.room || null,
      faculty_name: entry.facultyName || null,
    };

    if (existingIndex >= 0) {
      memoryStore.timetables[existingIndex] = updatedRow;
    } else {
      memoryStore.timetables.push(updatedRow);
    }
  }
};

module.exports = {
  pool,
  dbState,
  connectDB,
  getUserByEmail,
  createUser,
  isAllowedCollegeEmail,
  getWeekTimetable,
  getDayTimetable,
  upsertTimetableEntries,
};
