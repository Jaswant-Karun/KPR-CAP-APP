const { pool, dbState } = require("../config/db");

let internalMarkCourses = [];
let nextInternalMarkCourseId = 1;

const listInternalMarkCourses = async (req, res) => {
  try {
    const role = req.user?.role;
    const facultyId = Number(req.user?.id);
    const department = req.query.department || req.user?.department || null;

    if (dbState.mode === "postgres") {
      let result;
      if (role === "admin") {
        result = await pool.query(
          `
            SELECT *
            FROM internal_mark_courses
            WHERE ($1::text IS NULL OR department = $1)
            ORDER BY updated_at DESC, id DESC
          `,
          [department]
        );
      } else {
        result = await pool.query(
          `
            SELECT *
            FROM internal_mark_courses
            WHERE faculty_id = $1
              AND ($2::text IS NULL OR department = $2)
            ORDER BY updated_at DESC, id DESC
          `,
          [facultyId, department]
        );
      }

      return res.json({
        courses: result.rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          maxMarks: row.max_marks,
          department: row.department,
          facultyId: row.faculty_id,
          facultyName: row.faculty_name,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      });
    }

    const courses = internalMarkCourses.filter((course) => {
      if (role !== "admin" && course.facultyId !== facultyId) return false;
      if (department && course.department !== department) return false;
      return true;
    });

    return res.json({ courses });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch internal mark courses" });
  }
};

const createInternalMarkCourse = async (req, res) => {
  try {
    const { code, name, maxMarks = 25, department } = req.body || {};
    const facultyId = Number(req.user?.id);
    const facultyName = req.user?.name || null;

    if (!code || !name) {
      return res.status(400).json({ message: "code and name are required" });
    }

    if (dbState.mode === "postgres") {
      const duplicate = await pool.query(
        `SELECT id FROM internal_mark_courses WHERE faculty_id = $1 AND code = $2 LIMIT 1`,
        [facultyId, String(code).trim().toUpperCase()]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ message: "Course code already exists" });
      }

      const result = await pool.query(
        `
          INSERT INTO internal_mark_courses
            (code, name, max_marks, department, faculty_id, faculty_name, updated_at)
          VALUES
            ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *
        `,
        [
          String(code).trim().toUpperCase(),
          String(name).trim(),
          Number(maxMarks) || 25,
          department || req.user?.department || null,
          facultyId,
          facultyName,
        ]
      );

      const row = result.rows[0];
      return res.status(201).json({
        message: "Internal mark course created",
        course: {
          id: row.id,
          code: row.code,
          name: row.name,
          maxMarks: row.max_marks,
          department: row.department,
          facultyId: row.faculty_id,
          facultyName: row.faculty_name,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    }

    const duplicate = internalMarkCourses.find(
      (course) => course.facultyId === facultyId && course.code === String(code).trim().toUpperCase()
    );
    if (duplicate) {
      return res.status(409).json({ message: "Course code already exists" });
    }

    const newCourse = {
      id: nextInternalMarkCourseId++,
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      maxMarks: Number(maxMarks) || 25,
      department: department || req.user?.department || null,
      facultyId,
      facultyName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    internalMarkCourses.push(newCourse);
    return res.status(201).json({ message: "Internal mark course created", course: newCourse });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create internal mark course" });
  }
};

const updateInternalMarkCourse = async (req, res) => {
  try {
    const role = req.user?.role;
    const facultyId = Number(req.user?.id);
    const courseId = Number(req.params.courseId);
    const { code, name, maxMarks, department } = req.body || {};

    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    if (dbState.mode === "postgres") {
      const existing = await pool.query(`SELECT * FROM internal_mark_courses WHERE id = $1 LIMIT 1`, [courseId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Course not found" });
      }
      const row = existing.rows[0];
      if (role !== "admin" && Number(row.faculty_id) !== facultyId) {
        return res.status(403).json({ message: "Not authorized to edit this course" });
      }

      const nextCode = code ? String(code).trim().toUpperCase() : row.code;
      if (nextCode !== row.code) {
        const duplicate = await pool.query(
          `SELECT id FROM internal_mark_courses WHERE faculty_id = $1 AND code = $2 AND id <> $3 LIMIT 1`,
          [Number(row.faculty_id), nextCode, courseId]
        );
        if (duplicate.rows.length > 0) {
          return res.status(409).json({ message: "Course code already exists" });
        }
      }

      const updated = await pool.query(
        `
          UPDATE internal_mark_courses
          SET
            code = COALESCE($2, code),
            name = COALESCE($3, name),
            max_marks = COALESCE($4, max_marks),
            department = COALESCE($5, department),
            updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [
          courseId,
          code ? String(code).trim().toUpperCase() : null,
          name ? String(name).trim() : null,
          maxMarks !== undefined ? Number(maxMarks) : null,
          department || null,
        ]
      );

      const next = updated.rows[0];
      return res.json({
        message: "Internal mark course updated",
        course: {
          id: next.id,
          code: next.code,
          name: next.name,
          maxMarks: next.max_marks,
          department: next.department,
          facultyId: next.faculty_id,
          facultyName: next.faculty_name,
          createdAt: next.created_at,
          updatedAt: next.updated_at,
        },
      });
    }

    const index = internalMarkCourses.findIndex((course) => course.id === courseId);
    if (index < 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (role !== "admin" && internalMarkCourses[index].facultyId !== facultyId) {
      return res.status(403).json({ message: "Not authorized to edit this course" });
    }

    internalMarkCourses[index] = {
      ...internalMarkCourses[index],
      code: code ? String(code).trim().toUpperCase() : internalMarkCourses[index].code,
      name: name ? String(name).trim() : internalMarkCourses[index].name,
      maxMarks: maxMarks !== undefined ? Number(maxMarks) : internalMarkCourses[index].maxMarks,
      department: department || internalMarkCourses[index].department,
      updatedAt: new Date().toISOString(),
    };

    return res.json({ message: "Internal mark course updated", course: internalMarkCourses[index] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update internal mark course" });
  }
};

const deleteInternalMarkCourse = async (req, res) => {
  try {
    const role = req.user?.role;
    const facultyId = Number(req.user?.id);
    const courseId = Number(req.params.courseId);

    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    if (dbState.mode === "postgres") {
      const existing = await pool.query(`SELECT * FROM internal_mark_courses WHERE id = $1 LIMIT 1`, [courseId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (role !== "admin" && Number(existing.rows[0].faculty_id) !== facultyId) {
        return res.status(403).json({ message: "Not authorized to delete this course" });
      }

      await pool.query(`DELETE FROM internal_mark_courses WHERE id = $1`, [courseId]);
      return res.json({ message: "Internal mark course deleted" });
    }

    const index = internalMarkCourses.findIndex((course) => course.id === courseId);
    if (index < 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (role !== "admin" && internalMarkCourses[index].facultyId !== facultyId) {
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

    internalMarkCourses.splice(index, 1);
    return res.json({ message: "Internal mark course deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete internal mark course" });
  }
};

module.exports = {
  listInternalMarkCourses,
  createInternalMarkCourse,
  updateInternalMarkCourse,
  deleteInternalMarkCourse,
};
