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

const DEFAULT_SYSTEM_SETTINGS = {
  allowStudentSignup: true,
  allowFacultySignup: true,
  enforceStrongPassword: true,
  maintenanceMode: false,
  buttonSoundEnabled: true,
  appTheme: "dark",
  defaultDepartment: "CSE",
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
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL UNIQUE,
      short_name VARCHAR(40),
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
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

  await pool.query(`
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

  await pool.query(`
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_id_card_photos (
      student_id INT PRIMARY KEY,
      file_url TEXT NOT NULL,
      file_public_id VARCHAR(255),
      file_provider VARCHAR(50),
      updated_by INT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hall_tickets (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(40) NOT NULL UNIQUE,
      student_id INT NOT NULL,
      student_name VARCHAR(120),
      roll_no VARCHAR(40),
      resident_type VARCHAR(20) NOT NULL DEFAULT 'day-scholar' CHECK (resident_type IN ('day-scholar', 'hosteller')),
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_public_id VARCHAR(255),
      file_provider VARCHAR(50),
      uploaded_by INT,
      uploaded_by_name VARCHAR(120),
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
      remarks TEXT,
      verified_by INT,
      verified_by_name VARCHAR(120),
      verified_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE hall_tickets
    ADD COLUMN IF NOT EXISTS resident_type VARCHAR(20) NOT NULL DEFAULT 'day-scholar';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hall_ticket_audit (
      id SERIAL PRIMARY KEY,
      hall_ticket_id INT,
      ticket_no VARCHAR(40),
      student_id INT,
      action VARCHAR(30) NOT NULL,
      actor_id INT,
      actor_role VARCHAR(20),
      actor_name VARCHAR(120),
      remarks TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gatepass_requests (
      id SERIAL PRIMARY KEY,
      ticket_no INT NOT NULL UNIQUE,
      student_id INT,
      student_name VARCHAR(120),
      roll_no VARCHAR(40),
      type VARCHAR(50) NOT NULL DEFAULT 'Day Pass',
      pass_category VARCHAR(20) NOT NULL DEFAULT 'day-scholar',
      reason TEXT NOT NULL,
      from_date TIMESTAMP NOT NULL,
      to_date TIMESTAMP NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      approved_by INT,
      approved_by_name VARCHAR(120),
      remarks TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE gatepass_requests
    ADD COLUMN IF NOT EXISTS pass_category VARCHAR(20) NOT NULL DEFAULT 'day-scholar';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ao_service_bookings (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(40) NOT NULL UNIQUE,
      student_id INT,
      student_name VARCHAR(120),
      service_name VARCHAR(120) NOT NULL,
      subject TEXT NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fusion_space_bookings (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(40) NOT NULL UNIQUE,
      student_id INT,
      student_name VARCHAR(120),
      event_name VARCHAR(160) NOT NULL,
      attendee_count INT NOT NULL DEFAULT 1,
      cooking_required VARCHAR(10) NOT NULL DEFAULT 'No',
      event_date VARCHAR(40),
      duration VARCHAR(80),
      details TEXT,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS waiver_requests (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(40) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'in-review')) DEFAULT 'pending',
      student_id INT,
      student_name VARCHAR(120),
      serial_no VARCHAR(40),
      acy VARCHAR(30),
      sem VARCHAR(20),
      waiver_type VARCHAR(80),
      courses TEXT,
      grade VARCHAR(20),
      point NUMERIC(5,2),
      credit INT,
      department VARCHAR(80),
      batch VARCHAR(30),
      section VARCHAR(20),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      credits INT NOT NULL DEFAULT 3,
      semester INT,
      category VARCHAR(40),
      faculty_id INT,
      faculty_name VARCHAR(120),
      department VARCHAR(80) NOT NULL,
      capacity INT NOT NULL DEFAULT 60,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id SERIAL PRIMARY KEY,
      course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id INT NOT NULL,
      student_name VARCHAR(120),
      student_roll_no VARCHAR(40),
      status VARCHAR(30) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'dropped', 'completed')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (course_id, student_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS internal_mark_courses (
      id SERIAL PRIMARY KEY,
      code VARCHAR(40) NOT NULL,
      name VARCHAR(160) NOT NULL,
      max_marks INT NOT NULL DEFAULT 25,
      department VARCHAR(80),
      faculty_id INT,
      faculty_name VARCHAR(120),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (faculty_id, code)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(80) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
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

    await pool.query(
      `
        INSERT INTO system_settings (key, value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (key)
        DO NOTHING;
      `,
      ["global", JSON.stringify(DEFAULT_SYSTEM_SETTINGS)]
    );

    // Seed departments
    const departments = [
      { code: "CSB", name: "Computer Science and Business Systems", short_name: "CSB" },
      { code: "CSE", name: "Computer Science and Engineering", short_name: "CSE" },
      { code: "AIDS", name: "Artificial Intelligence and Data Science", short_name: "AIDS" },
      { code: "AIML", name: "Artificial Intelligence and Machine Learning", short_name: "AIML" },
      { code: "IT", name: "Information Technology", short_name: "IT" },
      { code: "ECE", name: "Electronics and Communication Engineering", short_name: "ECE" },
      { code: "EEE", name: "Electrical and Electronics Engineering", short_name: "EEE" },
      { code: "CHE", name: "Chemical Engineering", short_name: "CHE" },
      { code: "CE", name: "Civil Engineering", short_name: "CE" },
      { code: "ME", name: "Mechanical Engineering", short_name: "ME" },
      { code: "MECH", name: "Mechatronics Engineering", short_name: "MECH" },
      { code: "BME", name: "Biomedical Engineering", short_name: "BME" },
      { code: "CYS", name: "Cybersecurity Engineering", short_name: "CYS" },
    ];

    for (const dept of departments) {
      await pool.query(
        `
          INSERT INTO departments (code, name, short_name, is_active)
          VALUES ($1, $2, $3, TRUE)
          ON CONFLICT (code) DO NOTHING;
        `,
        [dept.code, dept.name, dept.short_name]
      );
    }

    const studentResult = await pool.query(
      "SELECT id, name, roll_no, department FROM users WHERE email = $1 LIMIT 1",
      ["student@kpriet.ac.in"]
    );

    const defaultStudent = studentResult.rows[0] || {};
    const defaultStudentId = defaultStudent.id || null;
    const defaultStudentName = defaultStudent.name || "Student User";
    const defaultSerial = defaultStudent.roll_no || "24CB023";
    const defaultDepartment = defaultStudent.department || "CSE";

    await pool.query(
      `
        INSERT INTO waiver_requests
          (ticket_no, status, student_id, student_name, serial_no, acy, sem, waiver_type, courses, grade, point, credit, department, batch, section, is_active, created_at, updated_at)
        VALUES
          ('WVR-2401', 'approved', $1, $2, $3, '2025-2026', 'III', 'Tuition', 'CS301, CS302', 'A', 8.90, 4, $4, '2024-2028', 'A', TRUE, NOW(), NOW()),
          ('WVR-2402', 'in-review', $1, $2, $3, '2025-2026', 'III', 'Exam', 'MA302', 'B+', 8.00, 3, $4, '2024-2028', 'A', TRUE, NOW(), NOW()),
          ('WVR-2392', 'pending', NULL, 'Nivetha R', '23CB066', '2024-2025', 'V', 'Arrear', 'CS501', 'B', 7.50, 3, 'CSE', '2023-2027', 'B', TRUE, NOW(), NOW()),
          ('WVR-2358', 'rejected', NULL, 'Karthik P', '22EC041', '2023-2024', 'VI', 'Condonation', 'EC604', 'C+', 6.80, 2, 'ECE', '2022-2026', 'C', FALSE, NOW(), NOW())
        ON CONFLICT (ticket_no) DO NOTHING;
      `,
      [defaultStudentId, defaultStudentName, defaultSerial, defaultDepartment]
    );

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
