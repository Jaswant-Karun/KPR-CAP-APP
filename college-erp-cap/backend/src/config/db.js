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

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
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

const mapUserRow = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  password_hash: user.password_hash,
  role: user.role,
  roll_no: user.roll_no,
  department: user.department,
  resident_type: user.resident_type || "day-scholar",
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
      resident_type VARCHAR(20) DEFAULT 'day-scholar' CHECK (resident_type IN ('day-scholar', 'hosteller')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS resident_type VARCHAR(20) DEFAULT 'day-scholar';
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
    CREATE TABLE IF NOT EXISTS latecomer_requests (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(40) NOT NULL UNIQUE,
      student_id INT,
      student_name VARCHAR(120),
      roll_no VARCHAR(40),
      department VARCHAR(80),
      arrived_at TIMESTAMP NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      remarks TEXT,
      approved_by INT,
      approved_by_name VARCHAR(120),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS digital_assets (
      id SERIAL PRIMARY KEY,
      ticket_no INT NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
      group_name VARCHAR(80) NOT NULL,
      asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('file', 'link')),
      asset_name VARCHAR(180) NOT NULL,
      order_no INT NOT NULL DEFAULT 0,
      asset_url TEXT NOT NULL,
      created_by INT,
      created_by_name VARCHAR(120),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
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
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(40) NOT NULL UNIQUE,
      event_name VARCHAR(180) NOT NULL,
      venue VARCHAR(180) NOT NULL,
      event_datetime TIMESTAMP NOT NULL,
      department VARCHAR(80),
      event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('local_department', 'club_community')),
      max_participants INT NOT NULL DEFAULT 30,
      poster_url TEXT,
      created_by INT,
      created_by_name VARCHAR(120),
      created_by_role VARCHAR(20),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      student_id INT NOT NULL,
      student_name VARCHAR(120),
      student_roll_no VARCHAR(40),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (event_id, student_id)
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
    CREATE TABLE IF NOT EXISTS faculty_control_maps (
      faculty_id INT PRIMARY KEY,
      batch VARCHAR(40),
      section VARCHAR(20),
      student_ids INT[] NOT NULL DEFAULT ARRAY[]::INT[],
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS simple_feedback_entries (
      id SERIAL PRIMARY KEY,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      module VARCHAR(80) NOT NULL DEFAULT 'general',
      user_id INT,
      role VARCHAR(20) NOT NULL DEFAULT 'student',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT,
      title VARCHAR(180) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(30) NOT NULL DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_cycles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      academic_year VARCHAR(30) NOT NULL,
      semester INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
      created_by INT,
      created_by_name VARCHAR(120),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_questions (
      id SERIAL PRIMARY KEY,
      cycle_id INT NOT NULL REFERENCES feedback_cycles(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      order_no INT NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_submissions (
      id SERIAL PRIMARY KEY,
      ticket_no INT UNIQUE,
      cycle_id INT NOT NULL REFERENCES feedback_cycles(id) ON DELETE CASCADE,
      student_id INT NOT NULL,
      student_name VARCHAR(120),
      student_roll_no VARCHAR(40),
      department VARCHAR(80),
      status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (cycle_id, student_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_course_ratings (
      id SERIAL PRIMARY KEY,
      submission_id INT NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
      course_id INT,
      faculty_id INT,
      course_code VARCHAR(40),
      course_name VARCHAR(180),
      faculty_name VARCHAR(120),
      question_count INT NOT NULL,
      total_score NUMERIC(8,2) NOT NULL,
      percentage NUMERIC(6,2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (submission_id, course_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_answers (
      id SERIAL PRIMARY KEY,
      course_rating_id INT NOT NULL REFERENCES feedback_course_ratings(id) ON DELETE CASCADE,
      question_id INT,
      question_text TEXT NOT NULL,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_faculty_actions (
      id SERIAL PRIMARY KEY,
      cycle_id INT NOT NULL REFERENCES feedback_cycles(id) ON DELETE CASCADE,
      faculty_id INT NOT NULL,
      reason TEXT,
      admin_action TEXT,
      reason_submitted_at TIMESTAMP,
      action_taken_at TIMESTAMP,
      updated_by INT,
      updated_by_name VARCHAR(120),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (cycle_id, faculty_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ndc_achievements (
      id SERIAL PRIMARY KEY,
      ticket_no INT NOT NULL UNIQUE,
      student_id INT NOT NULL,
      student_name VARCHAR(120),
      student_roll_no VARCHAR(40),
      student_email VARCHAR(160),
      student_phone VARCHAR(30),
      student_gender VARCHAR(20),
      department VARCHAR(80),
      academic_year VARCHAR(30) NOT NULL,
      event_mode VARCHAR(30) NOT NULL,
      event_for VARCHAR(60) NOT NULL,
      event_type VARCHAR(120) NOT NULL,
      event_level VARCHAR(120) NOT NULL,
      event_name VARCHAR(220) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      organization VARCHAR(180),
      location VARCHAR(180),
      state VARCHAR(120),
      sdg TEXT,
      outcome_details TEXT,
      has_achievement BOOLEAN NOT NULL DEFAULT FALSE,
      certificate_url TEXT,
      certificate_name VARCHAR(255),
      certificate_public_id VARCHAR(255),
      certificate_provider VARCHAR(80),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
      faculty_remarks TEXT,
      reviewed_by INT,
      reviewed_by_name VARCHAR(120),
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id SERIAL PRIMARY KEY,
      title VARCHAR(220) NOT NULL,
      category VARCHAR(60) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'in-progress', 'resolved', 'approved', 'rejected')),
      created_by INT,
      role VARCHAR(20),
      created_by_name VARCHAR(120),
      created_by_email VARCHAR(160),
      created_by_roll_no VARCHAR(40),
      created_by_department VARCHAR(80),
      metadata JSONB,
      remarks TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_requests_created_by ON service_requests(created_by);`);

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
    name: "KPR Admin JK",
    email: "kpr123@kpriet.ac.in",
    role: "admin",
    roll_no: "ADM001",
    department: "Administration",
    resident_type: "day-scholar",
  },
  {
    name: "Student User",
    email: "student@kpriet.ac.in",
    role: "student",
    roll_no: "24CB023",
    department: "CSE",
    resident_type: "day-scholar",
  },
  {
    name: "Faculty User",
    email: "faculty@kpriet.ac.in",
    role: "faculty",
    roll_no: "FAC101",
    department: "CSE",
    resident_type: "day-scholar",
  },
  {
    name: "SIVASANKARI S",
    email: "cb003@kpriet.ac.in",
    role: "faculty",
    roll_no: "CB003",
    department: "CSB",
    resident_type: "day-scholar",
  },
  {
    name: "Shanmugapriya",
    email: "cb001@kpriet.ac.in",
    role: "faculty",
    roll_no: "CB001",
    department: "CSB",
    resident_type: "day-scholar",
  },
];

const SIVASANKARI_SEEDED_TIMETABLE = [
  // Monday
  { dayOfWeek: 1, periodNo: 1, subjectName: "U21CB502 - Formal Language and Automata Theory", startTime: "08:55", endTime: "09:50", room: "II CB", facultyName: "RH" },
  { dayOfWeek: 1, periodNo: 2, subjectName: "U21CB501 - Fundamentals of Management", startTime: "09:50", endTime: "10:45", room: "II CB", facultyName: "RMLS" },
  { dayOfWeek: 1, periodNo: 3, subjectName: "U21CB503 - Software Engineering Methodologies", startTime: "11:05", endTime: "12:00", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 1, periodNo: 4, subjectName: "U21CBP03 - PE I: E-Business Management", startTime: "12:00", endTime: "12:55", room: "II CB", facultyName: "SRM" },
  { dayOfWeek: 1, periodNo: 5, subjectName: "OE", startTime: "13:45", endTime: "14:35", room: "II CB", facultyName: "OE" },
  { dayOfWeek: 1, periodNo: 6, subjectName: "U21CB501 - Fundamentals of Management", startTime: "14:35", endTime: "15:25", room: "II CB", facultyName: "RMLS" },
  { dayOfWeek: 1, periodNo: 7, subjectName: "HM2", startTime: "15:25", endTime: "16:15", room: "II CB", facultyName: "HM2" },

  // Tuesday
  { dayOfWeek: 2, periodNo: 1, subjectName: "U21CBP03 - PE I: E-Business Management", startTime: "08:55", endTime: "09:50", room: "II CB", facultyName: "SRM" },
  { dayOfWeek: 2, periodNo: 2, subjectName: "U21AMP02 - PE II: Soft Computing", startTime: "09:50", endTime: "10:45", room: "II CB", facultyName: "ABB" },
  { dayOfWeek: 2, periodNo: 3, subjectName: "U21CB501 - Fundamentals of Management", startTime: "11:05", endTime: "12:00", room: "II CB", facultyName: "RMLS" },
  { dayOfWeek: 2, periodNo: 4, subjectName: "U21CB502 - Formal Language and Automata Theory", startTime: "12:00", endTime: "12:55", room: "II CB", facultyName: "RH" },
  { dayOfWeek: 2, periodNo: 5, subjectName: "GATE", startTime: "13:45", endTime: "14:35", room: "II CB", facultyName: "KD" },
  { dayOfWeek: 2, periodNo: 6, subjectName: "U21CBP03 - PE I: E-Business Management", startTime: "14:35", endTime: "15:25", room: "II CB", facultyName: "SRM" },
  { dayOfWeek: 2, periodNo: 7, subjectName: "HM1", startTime: "15:25", endTime: "16:15", room: "II CB", facultyName: "HM1" },

  // Wednesday
  { dayOfWeek: 3, periodNo: 1, subjectName: "U21CB503 - Software Engineering Methodologies", startTime: "08:55", endTime: "09:50", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 3, periodNo: 2, subjectName: "U21AMP02 - PE II: Soft Computing", startTime: "09:50", endTime: "10:45", room: "II CB", facultyName: "ABB" },
  { dayOfWeek: 3, periodNo: 3, subjectName: "U21CB504 Lab - Software Engineering Methodologies Lab", startTime: "11:05", endTime: "12:00", room: "Lab", facultyName: "TC/RK/NF2" },
  { dayOfWeek: 3, periodNo: 4, subjectName: "U21CB504 Lab - Software Engineering Methodologies Lab", startTime: "12:00", endTime: "12:55", room: "Lab", facultyName: "TC/RK/NF2" },
  { dayOfWeek: 3, periodNo: 5, subjectName: "OE", startTime: "13:45", endTime: "14:35", room: "II CB", facultyName: "OE" },
  { dayOfWeek: 3, periodNo: 6, subjectName: "HM2", startTime: "14:35", endTime: "15:25", room: "II CB", facultyName: "HM2" },
  { dayOfWeek: 3, periodNo: 7, subjectName: "U21CB501 - Fundamentals of Management", startTime: "15:25", endTime: "16:15", room: "II CB", facultyName: "RMLS" },

  // Thursday
  { dayOfWeek: 4, periodNo: 1, subjectName: "U21CB502 - Formal Language and Automata Theory", startTime: "08:55", endTime: "09:50", room: "II CB", facultyName: "RH" },
  { dayOfWeek: 4, periodNo: 2, subjectName: "U21AMP02 - PE II: Soft Computing", startTime: "09:50", endTime: "10:45", room: "II CB", facultyName: "ABB" },
  { dayOfWeek: 4, periodNo: 3, subjectName: "U21CB503 - Software Engineering Methodologies", startTime: "11:05", endTime: "12:00", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 4, periodNo: 4, subjectName: "U21CBP03 - PE I: E-Business Management", startTime: "12:00", endTime: "12:55", room: "II CB", facultyName: "SRM" },
  { dayOfWeek: 4, periodNo: 5, subjectName: "HM1", startTime: "13:45", endTime: "14:35", room: "II CB", facultyName: "HM1" },
  { dayOfWeek: 4, periodNo: 6, subjectName: "GATE", startTime: "14:35", endTime: "15:25", room: "II CB", facultyName: "KD" },
  { dayOfWeek: 4, periodNo: 7, subjectName: "MH", startTime: "15:25", endTime: "16:15", room: "II CB", facultyName: "TS/RMLS/NF2" },

  // Friday
  { dayOfWeek: 5, periodNo: 1, subjectName: "U21CB502 - Formal Language and Automata Theory", startTime: "08:55", endTime: "09:50", room: "II CB", facultyName: "RH" },
  { dayOfWeek: 5, periodNo: 2, subjectName: "HM1", startTime: "09:50", endTime: "10:45", room: "II CB", facultyName: "HM1" },
  { dayOfWeek: 5, periodNo: 3, subjectName: "U21CB504 Lab - Software Engineering Methodologies Lab", startTime: "11:05", endTime: "12:00", room: "Lab", facultyName: "TC/RK/NF2" },
  { dayOfWeek: 5, periodNo: 4, subjectName: "U21CB504 Lab - Software Engineering Methodologies Lab", startTime: "12:00", endTime: "12:55", room: "Lab", facultyName: "TC/RK/NF2" },
  { dayOfWeek: 5, periodNo: 5, subjectName: "OE", startTime: "13:45", endTime: "14:35", room: "II CB", facultyName: "OE" },
  { dayOfWeek: 5, periodNo: 6, subjectName: "GATE", startTime: "14:35", endTime: "15:25", room: "II CB", facultyName: "RMLS/TS" },
  { dayOfWeek: 5, periodNo: 7, subjectName: "HM2", startTime: "15:25", endTime: "16:15", room: "II CB", facultyName: "HM2" },

  // Saturday
  { dayOfWeek: 6, periodNo: 1, subjectName: "PT", startTime: "08:55", endTime: "09:50", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 6, periodNo: 2, subjectName: "PT", startTime: "09:50", endTime: "10:45", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 6, periodNo: 3, subjectName: "PT", startTime: "11:05", endTime: "12:00", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 6, periodNo: 4, subjectName: "PT", startTime: "12:00", endTime: "12:55", room: "II CB", facultyName: "TC" },
  { dayOfWeek: 6, periodNo: 5, subjectName: "Activity", startTime: "13:45", endTime: "14:35", room: "Campus", facultyName: "Activity" },
  { dayOfWeek: 6, periodNo: 6, subjectName: "Activity", startTime: "14:35", endTime: "15:25", room: "Campus", facultyName: "Activity" },
  { dayOfWeek: 6, periodNo: 7, subjectName: "Activity", startTime: "15:25", endTime: "16:15", room: "Campus", facultyName: "Activity" },
];

const seedSivasankariTimetable = async () => {
  const facultyResult = await pool.query(
    "SELECT id FROM users WHERE role = 'faculty' AND LOWER(email) = $1 LIMIT 1",
    ["cb003@kpriet.ac.in"]
  );

  if (facultyResult.rows.length === 0) {
    return;
  }

  const facultyId = Number(facultyResult.rows[0].id);

  for (const entry of SIVASANKARI_SEEDED_TIMETABLE) {
    await pool.query(
      `
        INSERT INTO timetables
          (audience_type, audience_id, day_of_week, period_no, subject_name, start_time, end_time, room, faculty_name, updated_at)
        VALUES
          ('faculty', $1, $2, $3, $4, $5, $6, $7, $8, NOW())
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
        facultyId,
        entry.dayOfWeek,
        entry.periodNo,
        entry.subjectName,
        entry.startTime,
        entry.endTime,
        entry.room,
        entry.facultyName,
      ]
    );
  }
};

const seedDefaults = async () => {
  const seedPassword = process.env.DEFAULT_USER_PASSWORD || "Password@123";
  const permanentAdminPassword = "Kprietuser@37";
  const cb001Password = "Shanmugapriya@37";
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  const adminPasswordHash = await bcrypt.hash(permanentAdminPassword, 10);
  const cb001PasswordHash = await bcrypt.hash(cb001Password, 10);

  for (const user of defaultUsers) {
    let userPasswordHash;
    if (user.email === "kpr123@kpriet.ac.in") {
      userPasswordHash = adminPasswordHash;
    } else if (user.email === "cb001@kpriet.ac.in") {
      userPasswordHash = cb001PasswordHash;
    } else {
      userPasswordHash = passwordHash;
    }

    await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role, roll_no, department, resident_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = CASE
            WHEN users.email = 'cb001@kpriet.ac.in' THEN EXCLUDED.password_hash
            WHEN users.email = 'kpr123@kpriet.ac.in' THEN EXCLUDED.password_hash
            ELSE users.password_hash
          END;
      `,
      [
        user.name,
        user.email,
        userPasswordHash,
        user.role,
        user.roll_no,
        user.department,
        user.resident_type || "day-scholar",
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

  await seedSivasankariTimetable();

  // Seed courses from timetable
  const coursesToSeed = [
    {
      code: "U21CB501",
      name: "Fundamentals of Management",
      credits: 3,
      semester: 5,
      category: "Theory",
      faculty_name: "Ms. R. M. Lakshitha Shree",
      department: "CSB",
      capacity: 75,
      description: "Fundamentals of Management - RMLS",
    },
    {
      code: "U21CB502",
      name: "Formal Language and Automata Theory",
      credits: 3,
      semester: 5,
      category: "Theory",
      faculty_name: "Ms. R. Haritha",
      department: "CSB",
      capacity: 75,
      description: "Formal Language and Automata Theory - RH",
    },
    {
      code: "U21CB503",
      name: "Software Engineering Methodologies",
      credits: 3,
      semester: 5,
      category: "Theory",
      faculty_name: "Ms. Tanisha",
      department: "CSB",
      capacity: 75,
      description: "Software Engineering Methodologies - TC",
    },
    {
      code: "U21CB504",
      name: "Software Engineering Methodologies Laboratory",
      credits: 2,
      semester: 5,
      category: "Lab",
      faculty_name: "Ms. Tanisha / Ms. R. Keerthy / New Faculty",
      department: "CSB",
      capacity: 75,
      description: "Software Engineering Methodologies Lab - TC/RK/NF2",
    },
    {
      code: "U21CBP03",
      name: "PE I: E-Business Management",
      credits: 3,
      semester: 5,
      category: "Professional Elective",
      faculty_name: "Ms. S. R. Maheswari",
      department: "CSB",
      capacity: 75,
      description: "PE I: E-Business Management - SRM",
    },
    {
      code: "U21AMP02",
      name: "PE II: Soft Computing",
      credits: 3,
      semester: 5,
      category: "Professional Elective",
      faculty_name: "Dr. A. Bazila Banu",
      department: "CSB",
      capacity: 75,
      description: "PE II: Soft Computing - ABB",
    },
  ];

  for (const course of coursesToSeed) {
    await pool.query(
      `INSERT INTO courses (code, name, credits, semester, category, faculty_name, department, capacity, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         credits = EXCLUDED.credits,
         semester = EXCLUDED.semester,
         category = EXCLUDED.category,
         faculty_name = EXCLUDED.faculty_name,
         department = EXCLUDED.department,
         capacity = EXCLUDED.capacity,
         description = EXCLUDED.description,
         updated_at = NOW();`,
      [
        course.code,
        course.name,
        course.credits,
        course.semester,
        course.category,
        course.faculty_name,
        course.department,
        course.capacity,
        course.description,
      ]
    );
  }

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

  const digitalAssetsCount = await pool.query("SELECT COUNT(*)::int AS count FROM digital_assets");
  if (Number(digitalAssetsCount.rows[0]?.count || 0) === 0) {
    await pool.query(
      `
        INSERT INTO digital_assets
          (ticket_no, status, group_name, asset_type, asset_name, order_no, asset_url, created_by, created_by_name, created_at, updated_at)
        VALUES
          (26, 'active', 'NSC', 'file', 'NSC 2025-26', 1, 'https://example.com/nsc-2025-26.pdf', 1, 'Admin User', NOW(), NOW()),
          (7, 'active', 'Others', 'file', 'Students Code of Conduct', 2, 'https://example.com/students-code-of-conduct.pdf', 1, 'Admin User', NOW(), NOW()),
          (6, 'active', 'Others', 'file', 'Standard Operating Procedure (SOP)', 3, 'https://example.com/sop.pdf', 1, 'Admin User', NOW(), NOW()),
          (5, 'active', 'Others', 'link', 'Intercom Numbers', 4, 'https://example.com/intercom', 1, 'Admin User', NOW(), NOW()),
          (4, 'active', 'Others', 'link', 'Brand Assets', 5, 'https://example.com/brand-assets', 1, 'Admin User', NOW(), NOW());
      `
    );
  }
};

const connectDB = async () => {
  try {
    // Step 1: Ensure the database exists (only for local PG, skip when using DATABASE_URL)
    if (!process.env.DATABASE_URL) {
      const dbName = process.env.PG_DATABASE || "kpr_erp";
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
    throw error;
  }
};

const getUserByEmail = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const result = await pool.query(
    "SELECT id, name, email, password_hash, role, roll_no, department, resident_type FROM users WHERE email = $1 LIMIT 1",
    [normalizedEmail]
  );
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
};

const createUser = async ({ name, email, passwordHash, role, rollNo, department, residentType }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role, roll_no, department, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, roll_no, department, resident_type;
    `,
    [
      name,
      normalizedEmail,
      passwordHash,
      role,
      rollNo || null,
      department || null,
      residentType || "day-scholar",
    ]
  );

  return mapUserRow({ ...result.rows[0], password_hash: passwordHash });
};

const getWeekTimetable = async ({ audienceType, audienceId }) => {
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
};

const getDayTimetable = async ({ audienceType, audienceId, dayOfWeek }) => {
  const rows = await getWeekTimetable({ audienceType, audienceId });
  return rows.filter((item) => item.day_of_week === dayOfWeek);
};

const upsertTimetableEntries = async ({ audienceType, audienceId, entries }) => {
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
