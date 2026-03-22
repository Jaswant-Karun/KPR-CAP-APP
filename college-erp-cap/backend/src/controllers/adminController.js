const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DATABASE || "college_erp",
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// ============================================
// STUDENT MANAGEMENT
// ============================================

const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, roll_no, department, created_at 
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
      `SELECT id, name, email, role, roll_no, department, created_at 
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
    const { name, email, department, rollNo } = req.body;

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

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $1 AND role = 'student'
      RETURNING id, name, email, role, roll_no, department, created_at
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

    res.json({
      summary: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalStudents: parseInt(totalStudents.rows[0].count),
        totalFaculty: parseInt(totalFaculty.rows[0].count),
      },
      departmentWise: departmentStats.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
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
  editFacultyDetails,
  deleteFaculty,

  // Dashboard
  getAdminDashboardStats,
};
