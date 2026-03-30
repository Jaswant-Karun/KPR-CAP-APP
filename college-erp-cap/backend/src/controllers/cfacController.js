const { pool } = require("../config/db");
const { getFacultyControlMap } = require("../store/facultyControlStore");
const { resolveCb001RosterStudentIds } = require("../services/cb001Roster.service");

let schemaReady = false;

const ensureCfacSchema = async () => {
  if (schemaReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cfac_registrations (
      id SERIAL PRIMARY KEY,
      ticket_no VARCHAR(30) UNIQUE NOT NULL,
      student_id INT NOT NULL,
      student_roll_no VARCHAR(40),
      student_name VARCHAR(120),
      status VARCHAR(30) NOT NULL DEFAULT 'Approved',
      acy VARCHAR(30) NOT NULL DEFAULT '2025-26',
      sem INT NOT NULL DEFAULT 4,
      courses INT NOT NULL DEFAULT 13,
      rmc INT NOT NULL DEFAULT 24,
      mcr INT NOT NULL DEFAULT 24,
      wcr INT NOT NULL DEFAULT 0,
      scr INT NOT NULL DEFAULT 0,
      acr INT NOT NULL DEFAULT 4,
      tcr INT NOT NULL DEFAULT 28,
      course_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cfac_registration_history (
      id SERIAL PRIMARY KEY,
      registration_id INT NOT NULL REFERENCES cfac_registrations(id) ON DELETE CASCADE,
      username VARCHAR(40),
      client_ip VARCHAR(60),
      action VARCHAR(40) NOT NULL,
      details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cfac_internal_marks (
      id SERIAL PRIMARY KEY,
      registration_id INT NOT NULL REFERENCES cfac_registrations(id) ON DELETE CASCADE,
      course_code VARCHAR(40) NOT NULL,
      internal1 NUMERIC(5,2),
      internal2 NUMERIC(5,2),
      internal3 NUMERIC(5,2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (registration_id, course_code)
    );
  `);

  schemaReady = true;
};

const defaultCourseCodes = [
  "U21AD401",
  "U21AD405",
  "U21CB401",
  "U21CB402",
  "U21CS401",
  "U21CS403",
  "U21CS404",
  "U21ECX01",
  "U21MA409",
  "U21MYC04",
  "U210CB04",
  "U21SSG01",
  "U21VCB03",
];

const allowedRegistrationStatuses = new Set(["Approved", "Pending", "Rejected", "Draft"]);

const normalizeCourseCodes = (codes) => {
  if (!Array.isArray(codes)) return [];
  return [...new Set(codes.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean))];
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const resolveStatus = (value, fallback = "Approved") => {
  const safe = String(value || fallback).trim();
  return allowedRegistrationStatuses.has(safe) ? safe : fallback;
};

const upsertInternalMarks = async (registrationId, courseCodes, internalMarks = []) => {
  const targetCodes = normalizeCourseCodes(courseCodes);
  const marksMap = new Map();

  if (Array.isArray(internalMarks)) {
    for (const row of internalMarks) {
      const code = String(row?.courseCode || "").trim().toUpperCase();
      if (!code) continue;
      marksMap.set(code, {
        internal1: toNumberOrNull(row?.internal1),
        internal2: toNumberOrNull(row?.internal2),
        internal3: toNumberOrNull(row?.internal3),
      });
    }
  }

  if (targetCodes.length === 0) {
    await pool.query(`DELETE FROM cfac_internal_marks WHERE registration_id = $1`, [registrationId]);
    return;
  }

  await pool.query(
    `
      DELETE FROM cfac_internal_marks
      WHERE registration_id = $1
        AND course_code <> ALL($2::text[])
    `,
    [registrationId, targetCodes]
  );

  for (const code of targetCodes) {
    const row = marksMap.get(code) || {};
    await pool.query(
      `
        INSERT INTO cfac_internal_marks
          (registration_id, course_code, internal1, internal2, internal3, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (registration_id, course_code)
        DO UPDATE
        SET
          internal1 = COALESCE(EXCLUDED.internal1, cfac_internal_marks.internal1),
          internal2 = COALESCE(EXCLUDED.internal2, cfac_internal_marks.internal2),
          internal3 = COALESCE(EXCLUDED.internal3, cfac_internal_marks.internal3),
          updated_at = NOW()
      `,
      [registrationId, code, row.internal1 ?? null, row.internal2 ?? null, row.internal3 ?? null]
    );
  }
};

const getInternalMarksRows = async (registrationId) => {
  const rows = await pool.query(
    `
      SELECT course_code, internal1, internal2, internal3, updated_at
      FROM cfac_internal_marks
      WHERE registration_id = $1
      ORDER BY course_code ASC
    `,
    [registrationId]
  );

  return rows.rows.map((item) => ({
    courseCode: normalizeCourseCodes([item.course_code])[0] || item.course_code,
    internal1: item.internal1 === null ? null : Number(item.internal1),
    internal2: item.internal2 === null ? null : Number(item.internal2),
    internal3: item.internal3 === null ? null : Number(item.internal3),
    updatedAt: item.updated_at,
  }));
};

const getAllowedStudentIdsForFaculty = async (facultyId) => {
	const cb001Roster = await resolveCb001RosterStudentIds(pool, facultyId);
  const controlMap = getFacultyControlMap(facultyId);
  const mappedStudentIds = controlMap && Array.isArray(controlMap.studentIds)
    ? controlMap.studentIds.map((id) => Number(id)).filter((id) => id > 0)
    : [];

  const department = cb001Roster.department || null;
  const students = await pool.query(
    `SELECT id FROM users WHERE role = 'student' AND ($1::text IS NULL OR department = $1)`,
    [department]
  );

  const departmentStudentIds = students.rows
    .map((row) => Number(row.id))
    .filter((id) => !Number.isNaN(id) && id > 0);

  const rosterStudentIds = cb001Roster.shouldApply ? cb001Roster.studentIds : [];

  return [...new Set([...departmentStudentIds, ...mappedStudentIds, ...rosterStudentIds])];
};

const ensureStudentRegistration = async (studentId, studentRollNo, studentName) => {
  const existing = await pool.query(
    `SELECT * FROM cfac_registrations WHERE student_id = $1 ORDER BY id DESC LIMIT 1`,
    [studentId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const ticketNo = String(11000 + Number(studentId || 0));
  const inserted = await pool.query(
    `
      INSERT INTO cfac_registrations
        (ticket_no, student_id, student_roll_no, student_name, status, acy, sem, courses, rmc, mcr, wcr, scr, acr, tcr, course_codes)
      VALUES
        ($1, $2, $3, $4, 'Approved', '2025-26', 4, 13, 24, 24, 0, 0, 4, 28, $5)
      RETURNING *
    `,
    [ticketNo, studentId, studentRollNo || null, studentName || null, defaultCourseCodes]
  );

  const registration = inserted.rows[0];

  await upsertInternalMarks(registration.id, registration.course_codes || [], []);

  await pool.query(
    `
      INSERT INTO cfac_registration_history (registration_id, username, client_ip, action, details)
      VALUES
        ($1, $2, $3, 'Add', $4),
        ($1, $2, $3, 'Change', $5)
    `,
    [
      registration.id,
      studentRollNo || "student",
      "127.0.0.1",
      "status: New, count: 0, rmc: 24, mcr: 24, wcr: 0, scr: 0, acr: 4, tcr: 28",
      "added: default semester course set",
    ]
  );

  return registration;
};

const mapRegistration = (row) => ({
  id: row.id,
  ticket: row.ticket_no,
  status: row.status,
  studentId: row.student_id,
  studentRollNo: row.student_roll_no,
  studentName: row.student_name,
  acy: row.acy,
  sem: row.sem,
  courses: row.courses,
  rmc: row.rmc,
  mcr: row.mcr,
  wcr: row.wcr,
  scr: row.scr,
  acr: row.acr,
  tcr: row.tcr,
  registeredCourseCount: Number(row.registered_course_count || 0),
  courseCodes: row.course_codes || [],
});

const pushHistoryEvent = async (registrationId, req, action, details) => {
  await pool.query(
    `
      INSERT INTO cfac_registration_history (registration_id, username, client_ip, action, details)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      registrationId,
      req.user?.rollNo || req.user?.email || "user",
      req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      action,
      details,
    ]
  );
};

const listStudentsForRole = async (req, res) => {
  try {
    await ensureCfacSchema();

    if (req.user?.role === "student") {
      const currentStudent = await pool.query(
        `SELECT id, name, roll_no, department FROM users WHERE id = $1 AND role = 'student' LIMIT 1`,
        [Number(req.user?.id)]
      );
      return res.json({ total: currentStudent.rows.length, students: currentStudent.rows });
    }

    if (req.user?.role === "admin") {
      const students = await pool.query(
        `SELECT id, name, roll_no, department FROM users WHERE role = 'student' ORDER BY COALESCE(roll_no, ''), name ASC`
      );
      return res.json({ total: students.rows.length, students: students.rows });
    }

    const facultyId = Number(req.user?.id);
    const allowedStudentIds = await getAllowedStudentIdsForFaculty(facultyId);
    if (allowedStudentIds.length === 0) {
      return res.json({ total: 0, students: [] });
    }

    const students = await pool.query(
      `
        SELECT id, name, roll_no, department
        FROM users
        WHERE role = 'student' AND id = ANY($1::int[])
        ORDER BY COALESCE(roll_no, ''), name ASC
      `,
      [allowedStudentIds]
    );

    return res.json({ total: students.rows.length, students: students.rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch CFAC students", error: error.message });
  }
};

const listRegistrations = async (req, res) => {
  try {
    await ensureCfacSchema();

    const role = req.user?.role;
    const defaultStudentId = Number(req.user?.id);
    const requestedStudentId = Number(req.query.studentId);

    let studentId = defaultStudentId;
    if ((role === "faculty" || role === "admin") && !Number.isNaN(requestedStudentId) && requestedStudentId > 0) {
      studentId = requestedStudentId;
    }

    if (!Number.isNaN(studentId) && studentId > 0) {
      if (role === "faculty") {
        const allowedStudentIds = await getAllowedStudentIdsForFaculty(Number(req.user?.id));
        if (!allowedStudentIds.includes(studentId)) {
          return res.status(403).json({ message: "Selected student is outside your assigned list" });
        }
      }

      const studentUser = await pool.query(
        `SELECT id, roll_no, name FROM users WHERE id = $1 LIMIT 1`,
        [studentId]
      );

      if (studentUser.rows.length > 0) {
        await ensureStudentRegistration(
          studentUser.rows[0].id,
          studentUser.rows[0].roll_no,
          studentUser.rows[0].name
        );
      }
    }

    let result;
    if (role === "student") {
      result = await pool.query(
        `
          SELECT r.*, COALESCE(ec.registered_count, 0) AS registered_course_count
          FROM cfac_registrations r
          LEFT JOIN (
            SELECT student_id, COUNT(*)::int AS registered_count
            FROM course_enrollments
            WHERE status = 'registered'
            GROUP BY student_id
          ) ec ON ec.student_id = r.student_id
          WHERE r.student_id = $1
          ORDER BY r.id DESC
        `,
        [defaultStudentId]
      );
    } else if (!Number.isNaN(requestedStudentId) && requestedStudentId > 0) {
      result = await pool.query(
        `
          SELECT r.*, COALESCE(ec.registered_count, 0) AS registered_course_count
          FROM cfac_registrations r
          LEFT JOIN (
            SELECT student_id, COUNT(*)::int AS registered_count
            FROM course_enrollments
            WHERE status = 'registered'
            GROUP BY student_id
          ) ec ON ec.student_id = r.student_id
          WHERE r.student_id = $1
          ORDER BY r.id DESC
        `,
        [requestedStudentId]
      );
    } else {
      result = await pool.query(`
        SELECT r.*, COALESCE(ec.registered_count, 0) AS registered_course_count
        FROM cfac_registrations r
        LEFT JOIN (
          SELECT student_id, COUNT(*)::int AS registered_count
          FROM course_enrollments
          WHERE status = 'registered'
          GROUP BY student_id
        ) ec ON ec.student_id = r.student_id
        ORDER BY r.id DESC
        LIMIT 100
      `);
    }

    return res.json({
      total: result.rows.length,
      registrations: result.rows.map(mapRegistration),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch CFAC registrations", error: error.message });
  }
};

const getRegistrationHistory = async (req, res) => {
  try {
    await ensureCfacSchema();
    const registrationId = Number(req.params.registrationId);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    await pushHistoryEvent(registrationId, req, "History", "viewed history records");

    const rows = await pool.query(
      `
        SELECT id, username, client_ip, action, details, created_at
        FROM cfac_registration_history
        WHERE registration_id = $1
        ORDER BY created_at DESC
      `,
      [registrationId]
    );

    return res.json({
      total: rows.rows.length,
      history: rows.rows.map((row) => ({
        id: row.id,
        username: row.username,
        clientIp: row.client_ip,
        action: row.action,
        dateTime: row.created_at,
        details: row.details,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch CFAC history", error: error.message });
  }
};

const getRegistrationInternals = async (req, res) => {
  try {
    await ensureCfacSchema();
    const registrationId = Number(req.params.registrationId);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    await pushHistoryEvent(registrationId, req, "ViewInternals", "opened internal marks");

    const result = await pool.query(`SELECT id FROM cfac_registrations WHERE id = $1 LIMIT 1`, [registrationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const internals = await getInternalMarksRows(registrationId);

    return res.json({ total: internals.length, internals });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch internal marks", error: error.message });
  }
};

const createRegistration = async (req, res) => {
  try {
    await ensureCfacSchema();

    if (!["admin", "faculty"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Only admin/faculty can create registrations" });
    }

    const payload = req.body || {};
    const studentId = Number(payload.studentId);
    if (Number.isNaN(studentId) || studentId <= 0) {
      return res.status(400).json({ message: "studentId is required" });
    }

    if (req.user?.role === "faculty") {
      const allowedStudentIds = await getAllowedStudentIdsForFaculty(Number(req.user?.id));
      if (!allowedStudentIds.includes(studentId)) {
        return res.status(403).json({ message: "Selected student is outside your assigned list" });
      }
    }

    const studentResult = await pool.query(
      `SELECT id, roll_no, name FROM users WHERE id = $1 AND role = 'student' LIMIT 1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentResult.rows[0];
    const courseCodes = normalizeCourseCodes(payload.courseCodes || defaultCourseCodes);
    const ticketNo = String(payload.ticketNo || `${Date.now()}`);
    const status = resolveStatus(payload.status, "Approved");

    const inserted = await pool.query(
      `
        INSERT INTO cfac_registrations
          (ticket_no, student_id, student_roll_no, student_name, status, acy, sem, courses, rmc, mcr, wcr, scr, acr, tcr, course_codes, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING *
      `,
      [
        ticketNo,
        student.id,
        payload.studentRollNo || student.roll_no || null,
        payload.studentName || student.name || null,
        status,
        String(payload.acy || "2025-26"),
        Number(payload.sem) || 4,
        Number(payload.courses) || courseCodes.length,
        Number(payload.rmc) || 24,
        Number(payload.mcr) || 24,
        Number(payload.wcr) || 0,
        Number(payload.scr) || 0,
        Number(payload.acr) || 4,
        Number(payload.tcr) || 28,
        courseCodes,
      ]
    );

    const registration = inserted.rows[0];
    await upsertInternalMarks(registration.id, courseCodes, payload.internalMarks || []);
    await pushHistoryEvent(
      registration.id,
      req,
      "Add",
      `created registration for ${registration.student_roll_no || registration.student_name || registration.student_id}`
    );

    return res.status(201).json({
      message: "Registration created",
      registration: mapRegistration(registration),
      internals: await getInternalMarksRows(registration.id),
    });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key value") && String(error.message || "").includes("ticket_no")) {
      return res.status(409).json({ message: "ticketNo already exists" });
    }
    return res.status(500).json({ message: "Failed to create registration", error: error.message });
  }
};

const updateRegistration = async (req, res) => {
  try {
    await ensureCfacSchema();

    if (!["admin", "faculty"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Only admin/faculty can update registrations" });
    }

    const registrationId = Number(req.params.registrationId);
    if (Number.isNaN(registrationId) || registrationId <= 0) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const existingResult = await pool.query(`SELECT * FROM cfac_registrations WHERE id = $1 LIMIT 1`, [registrationId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const existing = existingResult.rows[0];
    if (req.user?.role === "faculty") {
      const allowedStudentIds = await getAllowedStudentIdsForFaculty(Number(req.user?.id));
      if (!allowedStudentIds.includes(Number(existing.student_id))) {
        return res.status(403).json({ message: "Selected registration is outside your assigned list" });
      }
    }

    const payload = req.body || {};
    const nextCourseCodes = payload.courseCodes ? normalizeCourseCodes(payload.courseCodes) : (existing.course_codes || []);
    const nextStatus = payload.status ? resolveStatus(payload.status, existing.status) : existing.status;

    const updated = await pool.query(
      `
        UPDATE cfac_registrations
        SET
          ticket_no = COALESCE($2, ticket_no),
          status = $3,
          student_roll_no = COALESCE($4, student_roll_no),
          student_name = COALESCE($5, student_name),
          acy = COALESCE($6, acy),
          sem = COALESCE($7, sem),
          courses = COALESCE($8, courses),
          rmc = COALESCE($9, rmc),
          mcr = COALESCE($10, mcr),
          wcr = COALESCE($11, wcr),
          scr = COALESCE($12, scr),
          acr = COALESCE($13, acr),
          tcr = COALESCE($14, tcr),
          course_codes = $15,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        registrationId,
        payload.ticketNo || null,
        nextStatus,
        payload.studentRollNo || null,
        payload.studentName || null,
        payload.acy ? String(payload.acy) : null,
        payload.sem !== undefined ? Number(payload.sem) : null,
        payload.courses !== undefined ? Number(payload.courses) : nextCourseCodes.length,
        payload.rmc !== undefined ? Number(payload.rmc) : null,
        payload.mcr !== undefined ? Number(payload.mcr) : null,
        payload.wcr !== undefined ? Number(payload.wcr) : null,
        payload.scr !== undefined ? Number(payload.scr) : null,
        payload.acr !== undefined ? Number(payload.acr) : null,
        payload.tcr !== undefined ? Number(payload.tcr) : null,
        nextCourseCodes,
      ]
    );

    await upsertInternalMarks(registrationId, nextCourseCodes, payload.internalMarks || []);
    await pushHistoryEvent(registrationId, req, "Change", "registration updated");

    return res.json({
      message: "Registration updated",
      registration: mapRegistration(updated.rows[0]),
      internals: await getInternalMarksRows(registrationId),
    });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key value") && String(error.message || "").includes("ticket_no")) {
      return res.status(409).json({ message: "ticketNo already exists" });
    }
    return res.status(500).json({ message: "Failed to update registration", error: error.message });
  }
};

const downloadRegistration = async (req, res) => {
  try {
    await ensureCfacSchema();
    const registrationId = Number(req.params.registrationId);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    await pushHistoryEvent(registrationId, req, "Download", "downloaded registration file");

    const result = await pool.query(
      `SELECT * FROM cfac_registrations WHERE id = $1 LIMIT 1`,
      [registrationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const row = mapRegistration(result.rows[0]);
    return res.json({
      fileName: `cfac-registration-${row.ticket}.txt`,
      content: [
        `Ticket: ${row.ticket}`,
        `Student: ${row.studentName || "Student"}`,
        `Roll No: ${row.studentRollNo || "--"}`,
        `ACY: ${row.acy}`,
        `Semester: ${row.sem}`,
        `Status: ${row.status}`,
        `Courses: ${row.courseCodes.join(", ")}`,
      ].join("\n"),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to download registration", error: error.message });
  }
};

module.exports = {
  listStudentsForRole,
  listRegistrations,
  createRegistration,
  updateRegistration,
  getRegistrationHistory,
  getRegistrationInternals,
  downloadRegistration,
};
