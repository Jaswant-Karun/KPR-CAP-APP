const { pool } = require("../config/db");

const normalizeStudentIds = (studentIds = []) => {
  if (!Array.isArray(studentIds)) return [];
  return [...new Set(studentIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id) && id > 0))];
};

const setFacultyControlMap = async ({ facultyId, batch, section, studentIds }) => {
  const safeFacultyId = Number(facultyId);
  if (Number.isNaN(safeFacultyId) || safeFacultyId <= 0) {
    throw new Error("Invalid facultyId");
  }

  const normalizedStudentIds = normalizeStudentIds(studentIds);

  const result = await pool.query(
    `INSERT INTO faculty_control_maps (faculty_id, batch, section, student_ids, updated_at)
     VALUES ($1, $2, $3, $4::int[], NOW())
     ON CONFLICT (faculty_id)
     DO UPDATE SET
       batch = EXCLUDED.batch,
       section = EXCLUDED.section,
       student_ids = EXCLUDED.student_ids,
       updated_at = NOW()
     RETURNING faculty_id, batch, section, student_ids, updated_at`,
    [
      safeFacultyId,
      batch ? String(batch).trim() : null,
      section ? String(section).trim() : null,
      normalizedStudentIds,
    ]
  );

  const row = result.rows[0];
  return {
    facultyId: Number(row.faculty_id),
    batch: row.batch,
    section: row.section,
    studentIds: Array.isArray(row.student_ids) ? row.student_ids.map((id) => Number(id)) : [],
    updatedAt: row.updated_at,
  };
};

const getFacultyControlMap = async (facultyId) => {
  const safeFacultyId = Number(facultyId);
  if (Number.isNaN(safeFacultyId) || safeFacultyId <= 0) {
    return null;
  }

  const result = await pool.query(
    `SELECT faculty_id, batch, section, student_ids, updated_at
     FROM faculty_control_maps
     WHERE faculty_id = $1
     LIMIT 1`,
    [safeFacultyId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    facultyId: Number(row.faculty_id),
    batch: row.batch,
    section: row.section,
    studentIds: Array.isArray(row.student_ids) ? row.student_ids.map((id) => Number(id)) : [],
    updatedAt: row.updated_at,
  };
};

module.exports = {
  setFacultyControlMap,
  getFacultyControlMap,
};
