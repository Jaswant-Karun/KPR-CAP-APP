const bcrypt = require("bcryptjs");
const { CB001_ROSTER } = require("../data/cb001Roster");

const CB001_EMAIL = "cb001@kpriet.ac.in";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getFacultyById = async (pool, facultyId) => {
  const result = await pool.query(
    `SELECT id, email, department FROM users WHERE id = $1 AND role = 'faculty' LIMIT 1`,
    [Number(facultyId)]
  );
  return result.rows[0] || null;
};

const getUniqueEmailForRollNo = async (pool, rollNo) => {
  const base = `${String(rollNo).toLowerCase()}@kpriet.ac.in`;

  const exact = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [base]);
  if (exact.rows.length === 0) {
    return base;
  }

  for (let index = 1; index <= 999; index += 1) {
    const candidate = `${String(rollNo).toLowerCase()}.${index}@kpriet.ac.in`;
    const result = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [candidate]);
    if (result.rows.length === 0) {
      return candidate;
    }
  }

  return `${String(rollNo).toLowerCase()}.${Date.now()}@kpriet.ac.in`;
};

const syncCb001RosterStudents = async (pool, department) => {
  const rollNos = CB001_ROSTER.map((row) => row.rollNo);
  const existing = await pool.query(
    `SELECT id, roll_no FROM users WHERE role = 'student' AND roll_no = ANY($1::text[])`,
    [rollNos]
  );

  const existingByRoll = new Map(
    existing.rows.map((row) => [String(row.roll_no || "").toUpperCase(), Number(row.id)])
  );

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "Password@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  for (const row of CB001_ROSTER) {
    const rollNo = String(row.rollNo).toUpperCase();
    if (existingByRoll.has(rollNo)) {
      continue;
    }

    const email = await getUniqueEmailForRollNo(pool, rollNo);

    const inserted = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role, roll_no, department)
        VALUES ($1, $2, $3, 'student', $4, $5)
        RETURNING id, roll_no;
      `,
      [row.name, email, passwordHash, rollNo, department || "CSE"]
    );

    existingByRoll.set(rollNo, Number(inserted.rows[0].id));
  }

  return CB001_ROSTER
    .map((row) => existingByRoll.get(String(row.rollNo).toUpperCase()))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const resolveCb001RosterStudentIds = async (pool, facultyId) => {
  const faculty = await getFacultyById(pool, facultyId);
  if (!faculty) {
    return { shouldApply: false, studentIds: [], department: null, facultyEmail: null };
  }

  const facultyEmail = normalizeEmail(faculty.email);
  if (facultyEmail !== CB001_EMAIL) {
    return {
      shouldApply: false,
      studentIds: [],
      department: faculty.department || null,
      facultyEmail,
    };
  }

  const studentIds = await syncCb001RosterStudents(pool, faculty.department || "CSE");

  return {
    shouldApply: true,
    studentIds,
    department: faculty.department || "CSE",
    facultyEmail,
  };
};

module.exports = {
  resolveCb001RosterStudentIds,
};
