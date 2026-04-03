const { pool } = require("../config/db");
const { uploadFile } = require("../services/storage.service");

const MAX_CERTIFICATE_BYTES = 3 * 1024 * 1024;
const STUDENT_EVENT_FOR_OPTIONS = new Set([
  "Teaching",
  "Non Teaching",
  "AO Staff",
  "Workers-Daily",
  "Workers-Monthly",
  "Transport",
  "Maintenance",
  "Principal Office",
  "CFRD",
  "Student",
  "Scholars",
  "JRF",
  "Designation Account",
  "KPRIET",
  "Visiting Faculty",
  "Others",
  "HOD",
]);

const EVENT_MODE_OPTIONS = new Set(["On Campus", "Off Campus", "Online", "Hybrid"]);

const mapRow = (row) => ({
  id: row.id,
  ticket: row.ticket_no,
  status: row.status,
  acy: row.academic_year,
  name: row.event_name,
  eventMode: row.event_mode,
  eventFor: row.event_for,
  eventType: row.event_type,
  eventLevel: row.event_level,
  startDate: row.start_date,
  endDate: row.end_date,
  organization: row.organization,
  location: row.location,
  state: row.state,
  sdg: row.sdg,
  outcomeDetails: row.outcome_details,
  hasAchievement: Boolean(row.has_achievement),
  certificateUrl: row.certificate_url,
  certificateName: row.certificate_name,
  certificateProvider: row.certificate_provider,
  facultyRemarks: row.faculty_remarks,
  reviewedBy: row.reviewed_by,
  reviewedByName: row.reviewed_by_name,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  user: {
    studentId: row.student_id,
    username: row.student_roll_no,
    fullName: row.student_name,
    email: row.student_email,
    phone: row.student_phone,
    gender: row.student_gender,
    userType: "Student",
    department: row.department,
  },
});

const normalizeStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["approved", "rejected", "deleted", "pending"].includes(normalized)) {
    return normalized;
  }
  return "pending";
};

const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT id, name, email, role, roll_no, department
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const validateCreatePayload = (payload) => {
  const eventMode = String(payload?.eventMode || "").trim();
  const eventFor = String(payload?.eventFor || "").trim();
  const eventName = String(payload?.eventName || "").trim();
  const startDate = String(payload?.startDate || "").trim();

  if (!EVENT_MODE_OPTIONS.has(eventMode)) {
    return { valid: false, message: "Invalid event mode" };
  }

  if (!STUDENT_EVENT_FOR_OPTIONS.has(eventFor)) {
    return { valid: false, message: "Invalid event for" };
  }

  if (!eventName) {
    return { valid: false, message: "Event name is required" };
  }

  if (!startDate) {
    return { valid: false, message: "Start date is required" };
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return { valid: false, message: "Invalid start date" };
  }

  if (payload?.endDate) {
    const end = new Date(payload.endDate);
    if (Number.isNaN(end.getTime())) {
      return { valid: false, message: "Invalid end date" };
    }
    if (end < start) {
      return { valid: false, message: "End date must be on or after start date" };
    }
  }

  return { valid: true };
};

const createNdcAchievement = async (req, res) => {
  try {
    const actorRole = String(req.user?.role || "").toLowerCase();
    if (actorRole !== "student") {
      return res.status(403).json({ message: "Only students can create participation records" });
    }

    const payload = req.body || {};
    const validation = validateCreatePayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    if (req.upload?.size && req.upload.size > MAX_CERTIFICATE_BYTES) {
      return res.status(400).json({ message: "Certificate size must be less than or equal to 3 MB" });
    }

    const userInfo = (await getUserById(req.user?.id)) || {};

    let certificateUrl = null;
    let certificatePublicId = null;
    let certificateProvider = null;
    let certificateName = null;

    if (req.upload?.buffer) {
      const stored = await uploadFile({
        buffer: req.upload.buffer,
        filename: req.upload.originalname || `ndc-cert-${Date.now()}`,
        folder: `kpr-erp/ndc-achievements/${req.user?.id || "student"}`,
      });

      certificateUrl = stored?.url || stored?.secure_url || null;
      certificatePublicId = stored?.publicId || stored?.public_id || null;
      certificateProvider = stored?.provider || "unknown";
      certificateName = req.upload.originalname || "certificate";
    }

    const record = {
      academicYear: String(payload.academicYear || "").trim() || `${new Date().getFullYear()}`,
      eventMode: String(payload.eventMode || "").trim(),
      eventFor: String(payload.eventFor || "").trim(),
      eventType: String(payload.eventType || "").trim() || "Others",
      eventLevel: String(payload.eventLevel || "").trim() || "Others",
      eventName: String(payload.eventName || "").trim(),
      startDate: String(payload.startDate || "").trim(),
      endDate: String(payload.endDate || "").trim() || null,
      organization: String(payload.organization || "").trim() || null,
      location: String(payload.location || "").trim() || null,
      state: String(payload.state || "").trim() || null,
      sdg: String(payload.sdg || "").trim() || null,
      outcomeDetails: String(payload.outcomeDetails || "").trim() || null,
      hasAchievement: Boolean(payload.hasAchievement),
      studentPhone: String(payload.phone || "").trim() || null,
      studentGender: String(payload.gender || "").trim() || null,
      studentName: userInfo.name || req.user?.name || req.user?.email || "Student",
      studentEmail: userInfo.email || req.user?.email || null,
      studentRollNo: userInfo.roll_no || req.user?.rollNo || null,
      department: userInfo.department || req.user?.department || null,
      certificateUrl,
      certificateName,
      certificatePublicId,
      certificateProvider,
    };

    const nextIdResult = await pool.query(
      "SELECT nextval(pg_get_serial_sequence('ndc_achievements', 'id')) AS id"
    );
    const nextId = Number(nextIdResult.rows[0].id);
    const ticketNo = 45000 + nextId;

    const insertResult = await pool.query(
      `INSERT INTO ndc_achievements
        (id, ticket_no, student_id, student_name, student_roll_no, student_email, student_phone, student_gender, department,
         academic_year, event_mode, event_for, event_type, event_level, event_name, start_date, end_date,
         organization, location, state, sdg, outcome_details, has_achievement,
         certificate_url, certificate_name, certificate_public_id, certificate_provider,
         status, created_at, updated_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15, $16::date, $17::date,
         $18, $19, $20, $21, $22, $23,
         $24, $25, $26, $27,
         'pending', NOW(), NOW())
       RETURNING *`,
      [
        nextId,
        ticketNo,
        req.user?.id,
        record.studentName,
        record.studentRollNo,
        record.studentEmail,
        record.studentPhone,
        record.studentGender,
        record.department,
        record.academicYear,
        record.eventMode,
        record.eventFor,
        record.eventType,
        record.eventLevel,
        record.eventName,
        record.startDate,
        record.endDate,
        record.organization,
        record.location,
        record.state,
        record.sdg,
        record.outcomeDetails,
        record.hasAchievement,
        record.certificateUrl,
        record.certificateName,
        record.certificatePublicId,
        record.certificateProvider,
      ]
    );

    return res.status(201).json({
      message: "Participation record created",
      achievement: mapRow(insertResult.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create participation record", error: error.message });
  }
};

const listNdcAchievements = async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    const status = normalizeStatus(req.query?.status);
    const search = String(req.query?.search || "").trim().toLowerCase();
    const departmentFilter = String(req.query?.department || "").trim();

    const params = [];
    let where = " WHERE 1=1 ";

    if (role === "student") {
      params.push(req.user?.id);
      where += ` AND student_id = $${params.length}`;
    } else if (role === "faculty") {
      const me = await getUserById(req.user?.id);
      params.push(me?.department || req.user?.department || "");
      where += ` AND department = $${params.length}`;
    }

    if (req.query?.status && req.query.status !== "all") {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    if (departmentFilter && role === "admin") {
      params.push(departmentFilter);
      where += ` AND department = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      where += `
        AND (
          LOWER(COALESCE(event_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(student_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(student_roll_no, '')) LIKE $${params.length}
          OR CAST(ticket_no AS TEXT) LIKE $${params.length}
        )`;
    }

    const listResult = await pool.query(
      `SELECT *
       FROM ndc_achievements
       ${where}
       ORDER BY created_at DESC`,
      params
    );

    const departmentsResult = await pool.query(
      `SELECT DISTINCT department
       FROM ndc_achievements
       WHERE department IS NOT NULL AND department <> ''
       ORDER BY department ASC`
    );

    return res.json({
      total: listResult.rows.length,
      achievements: listResult.rows.map(mapRow),
      departments: departmentsResult.rows.map((row) => row.department),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to list participation records", error: error.message });
  }
};

const getNdcAchievementById = async (req, res) => {
  try {
    const id = Number(req.params.achievementId);
    if (!id) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const role = String(req.user?.role || "").toLowerCase();

    const result = await pool.query(`SELECT * FROM ndc_achievements WHERE id = $1 LIMIT 1`, [id]);
    const row = result.rows[0] || null;

    if (!row) {
      return res.status(404).json({ message: "Participation record not found" });
    }

    if (role === "student" && Number(row.student_id) !== Number(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (role === "faculty" && String(row.department || "") !== String(req.user?.department || "")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ achievement: mapRow(row) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load participation details", error: error.message });
  }
};

const updateNdcAchievementStatus = async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can approve or reject participation records" });
    }

    const id = Number(req.params.achievementId);
    if (!id) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const status = String(req.body?.status || "").trim().toLowerCase();
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }

    const remarks = String(req.body?.remarks || "").trim();

    const check = await pool.query(`SELECT * FROM ndc_achievements WHERE id = $1 LIMIT 1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Participation record not found" });
    }

    const current = check.rows[0];
    if (!current) {
      return res.status(404).json({ message: "Participation record not found" });
    }

    if (String(current.department || "") !== String(req.user?.department || "")) {
      return res.status(403).json({ message: "You can only review records from your department" });
    }

    if (String(current.status || "").toLowerCase() === "deleted") {
      return res.status(400).json({ message: "Deleted records cannot be reviewed" });
    }

    const updated = await pool.query(
      `UPDATE ndc_achievements
       SET status = $1,
           faculty_remarks = $2,
           reviewed_by = $3,
           reviewed_by_name = $4,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        status,
        remarks || null,
        req.user?.id || null,
        req.user?.name || req.user?.email || "Faculty",
        id,
      ]
    );

    return res.json({
      message: `Participation record ${status}`,
      achievement: mapRow(updated.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to review participation record", error: error.message });
  }
};

const markNdcAchievementDeleted = async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (role !== "student") {
      return res.status(403).json({ message: "Only students can delete their participation records" });
    }

    const id = Number(req.params.achievementId);
    if (!id) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const check = await pool.query(
      `SELECT id, student_id, status
       FROM ndc_achievements
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Participation record not found" });
    }

    if (Number(check.rows[0].student_id) !== Number(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await pool.query(
      `UPDATE ndc_achievements
       SET status = 'deleted', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return res.json({ message: "Participation record marked as deleted", achievement: mapRow(updated.rows[0]) });

    const target = null;
    if (!target) {
      return res.status(404).json({ message: "Participation record not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete participation record", error: error.message });
  }
};

module.exports = {
  createNdcAchievement,
  listNdcAchievements,
  getNdcAchievementById,
  updateNdcAchievementStatus,
  markNdcAchievementDeleted,
};
