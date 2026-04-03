const { Pool } = require("pg");
const { getFacultyControlMap, setFacultyControlMap } = require("../store/facultyControlStore");
const { CB001_ROSTER } = require("../data/cb001Roster");
const { resolveCb001RosterStudentIds } = require("../services/cb001Roster.service");
const {
  getOrCreateSystemSettings,
  updateSystemSettings: saveSystemSettings,
  getPublicSystemSettings: fetchPublicSystemSettings,
} = require("../services/systemSettings.service");

const CB001_EMAIL = "cb001@kpriet.ac.in";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DATABASE || "kpr_erp",
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// ============================================
// STUDENT MANAGEMENT
// ============================================

const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, roll_no, department, resident_type, created_at 
       FROM users WHERE role = 'student' ORDER BY created_at DESC`
    );
    res.json({
      total: result.rows.length,
      students: result.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(
      `SELECT id, name, email, role, roll_no, department, resident_type, created_at 
       FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student", error: error.message });
  }
};

const editStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, email, department, rollNo, residentType } = req.body;

    // Validate student exists
    const student = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [email, studentId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    // Update student details
    const updateFields = [];
    const values = [studentId];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${++paramCount}`);
      values.push(name);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${++paramCount}`);
      values.push(email);
    }
    if (department !== undefined) {
      updateFields.push(`department = $${++paramCount}`);
      values.push(department);
    }
    if (rollNo !== undefined) {
      updateFields.push(`roll_no = $${++paramCount}`);
      values.push(rollNo);
    }
    if (residentType !== undefined) {
      const normalizedResidentType = String(residentType).trim().toLowerCase();
      if (!["day-scholar", "hosteller"].includes(normalizedResidentType)) {
        return res.status(400).json({ message: "residentType must be day-scholar or hosteller" });
      }
      updateFields.push(`resident_type = $${++paramCount}`);
      values.push(normalizedResidentType);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $1 AND role = 'student'
      RETURNING id, name, email, role, roll_no, department, resident_type, created_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: "Student details updated successfully",
      student: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update student", error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student exists
    const student = await pool.query(
      `SELECT id, name, email FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete student
    await pool.query(`DELETE FROM users WHERE id = $1`, [studentId]);

    res.json({
      message: "Student deleted successfully",
      deletedStudent: student.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student", error: error.message });
  }
};

// ============================================
// FACULTY MANAGEMENT
// ============================================

const getAllFaculty = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, roll_no, department, created_at 
       FROM users WHERE role = 'faculty' ORDER BY created_at DESC`
    );
    res.json({
      total: result.rows.length,
      faculty: result.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty", error: error.message });
  }
};

const getFacultyById = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const result = await pool.query(
      `SELECT id, name, email, role, roll_no, department, created_at 
       FROM users WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty", error: error.message });
  }
};

const getFacultyControlledStudents = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const facultyResult = await pool.query(
      `SELECT id, name, department FROM users WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (facultyResult.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const faculty = facultyResult.rows[0];
    const controlMap = await getFacultyControlMap(facultyId);

    let studentsResult;
    if (controlMap && controlMap.studentIds.length > 0) {
      studentsResult = await pool.query(
        `SELECT id, name, email, roll_no, department FROM users
         WHERE role = 'student' AND id = ANY($1::int[])
         ORDER BY COALESCE(roll_no, ''), name ASC`,
        [controlMap.studentIds]
      );
    } else {
      studentsResult = await pool.query(
        `SELECT id, name, email, roll_no, department FROM users
         WHERE role = 'student' AND ($1::text IS NULL OR department = $1)
         ORDER BY COALESCE(roll_no, ''), name ASC`,
        [faculty.department || null]
      );
    }

    return res.json({
      faculty,
      mapping: controlMap,
      mappingMode: controlMap ? "explicit-batch-section" : "department-fallback",
      total: studentsResult.rows.length,
      students: studentsResult.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch controlled students", error: error.message });
  }
};

const getFacultyControlMapForAdmin = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const faculty = await pool.query(
      `SELECT id, name, department FROM users WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (faculty.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    return res.json({
      faculty: faculty.rows[0],
      mapping: await getFacultyControlMap(facultyId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch faculty control map", error: error.message });
  }
};

const setFacultyControlMapForAdmin = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { batch, section, studentIds } = req.body || {};

    const faculty = await pool.query(
      `SELECT id, name, department FROM users WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (faculty.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds must be a non-empty array" });
    }

    const saved = await setFacultyControlMap({
      facultyId,
      batch,
      section,
      studentIds,
    });

    return res.json({
      message: "Faculty control mapping saved",
      faculty: faculty.rows[0],
      mapping: saved,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save faculty control map", error: error.message });
  }
};

const editFacultyDetails = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { name, email, department, rollNo } = req.body;

    // Validate faculty exists
    const faculty = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (faculty.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Check if email is already taken
    if (email) {
      const emailCheck = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [email, facultyId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    // Update faculty details
    const updateFields = [];
    const values = [facultyId];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${++paramCount}`);
      values.push(name);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${++paramCount}`);
      values.push(email);
    }
    if (department !== undefined) {
      updateFields.push(`department = $${++paramCount}`);
      values.push(department);
    }
    if (rollNo !== undefined) {
      updateFields.push(`roll_no = $${++paramCount}`);
      values.push(rollNo);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $1 AND role = 'faculty'
      RETURNING id, name, email, role, roll_no, department, created_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: "Faculty details updated successfully",
      faculty: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update faculty", error: error.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Verify faculty exists
    const faculty = await pool.query(
      `SELECT id, name, email FROM users WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (faculty.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Delete faculty
    await pool.query(`DELETE FROM users WHERE id = $1`, [facultyId]);

    res.json({
      message: "Faculty deleted successfully",
      deletedFaculty: faculty.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete faculty", error: error.message });
  }
};

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

const getAdminDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalStudents = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = 'student'`
    );
    const totalFaculty = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = 'faculty'`
    );
    const totalUsers = await pool.query(
      `SELECT COUNT(*) FROM users`
    );

    // Get department-wise breakdown
    const departmentStats = await pool.query(
      `SELECT department, role, COUNT(*) as count 
       FROM users 
       WHERE role IN ('student', 'faculty')
       GROUP BY department, role 
       ORDER BY department`
    );

    let cb001ControlledStudents = 0;
    const cb001Faculty = await pool.query(
      `SELECT id FROM users WHERE role = 'faculty' AND LOWER(email) = $1 LIMIT 1`,
      [CB001_EMAIL]
    );

    if (cb001Faculty.rows.length > 0) {
      const roster = await resolveCb001RosterStudentIds(pool, Number(cb001Faculty.rows[0].id));
      cb001ControlledStudents = Array.isArray(roster.studentIds) ? roster.studentIds.length : 0;
    }

    res.json({
      summary: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalStudents: parseInt(totalStudents.rows[0].count),
        totalFaculty: parseInt(totalFaculty.rows[0].count),
        cb001ControlledStudents,
        cb001ExpectedStudents: CB001_ROSTER.length,
      },
      departmentWise: departmentStats.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSystemSettings();
    return res.json({ settings });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch system settings", error: error.message });
  }
};

const getPublicSystemSettings = async (req, res) => {
  try {
    const settings = await fetchPublicSystemSettings();
    return res.json({
      settings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch public system settings", error: error.message });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const nextSettings = await saveSystemSettings(req.body || {});

    return res.json({
      message: "System settings updated successfully",
      settings: nextSettings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update system settings", error: error.message });
  }
};

module.exports = {
  // Students
  getAllStudents,
  getStudentById,
  editStudentDetails,
  deleteStudent,

  // Faculty
  getAllFaculty,
  getFacultyById,
  getFacultyControlledStudents,
  getFacultyControlMapForAdmin,
  setFacultyControlMapForAdmin,
  editFacultyDetails,
  deleteFaculty,

  // Dashboard
  getAdminDashboardStats,

  // System settings
  getSystemSettings,
  getPublicSystemSettings,
  updateSystemSettings,
};
