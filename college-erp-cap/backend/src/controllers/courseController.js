const { pool, dbState } = require("../config/db");

let courses = [];
let nextCourseId = 1;
let courseEnrollments = [];
let nextEnrollmentId = 1;

const createCourse = async (req, res) => {
  try {
    const { code, name, credits = 3, semester, category, department, capacity = 60, description = "" } = req.body;
    const facultyId = req.user?.id;
    const facultyName = req.user?.name;

    if (!code || !name) {
      return res.status(400).json({ message: "Course code and name are required" });
    }

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const duplicateCode = courses.find((c) => c.code === code);
    if (duplicateCode) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    if (dbState.mode === "postgres") {
      const checkDuplicate = await pool.query("SELECT id FROM courses WHERE code = $1", [code]);
      if (checkDuplicate.rows.length > 0) {
        return res.status(400).json({ message: "Course code already exists" });
      }

      const result = await pool.query(
        `INSERT INTO courses (code, name, credits, semester, category, faculty_id, faculty_name, department, capacity, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [code, name, credits, semester || null, category || null, facultyId, facultyName, department, capacity, description]
      );

      const row = result.rows[0];
      return res.status(201).json({
        message: "Course created successfully",
        course: {
          id: row.id,
          code: row.code,
          name: row.name,
          credits: row.credits,
          semester: row.semester,
          category: row.category,
          facultyId: row.faculty_id,
          facultyName: row.faculty_name,
          department: row.department,
          capacity: row.capacity,
          enrolled: 0,
          description: row.description,
          createdAt: row.created_at,
        },
      });
    }

    const newCourse = {
      id: nextCourseId++,
      code,
      name,
      credits,
      semester: semester || null,
      category: category || null,
      facultyId,
      facultyName,
      department,
      capacity,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    courses.push(newCourse);
    res.status(201).json({
      message: "Course created successfully",
      course: { ...newCourse, enrolled: 0 },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Failed to create course" });
  }
};

const getCoursesByDepartment = async (req, res) => {
  try {
    const department = req.query.department || req.user?.department || "";
    const semester = req.query.semester || "";

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    if (dbState.mode === "postgres") {
      const query = `
        SELECT c.*, COUNT(ce.id) as enrolled_count
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.department = $1
        ${semester ? "AND c.semester = $2" : ""}
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      const params = semester ? [department, semester] : [department];
      const result = await pool.query(query, params);

      const courseList = result.rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        credits: row.credits,
        semester: row.semester,
        category: row.category,
        facultyId: row.faculty_id,
        facultyName: row.faculty_name,
        department: row.department,
        capacity: row.capacity,
        enrolled: Number(row.enrolled_count || 0),
        status: Number(row.enrolled_count || 0) >= row.capacity ? "full" : "open",
        description: row.description,
        createdAt: row.created_at,
      }));

      return res.json({ courses: courseList });
    }

    let filtered = courses.filter(
      (c) => c.department.toLowerCase() === department.toLowerCase()
    );

    if (semester) {
      filtered = filtered.filter((c) => c.semester === Number(semester));
    }

    const courseList = filtered.map((course) => {
      const enrolledCount = courseEnrollments.filter((e) => e.courseId === course.id).length;
      return {
        ...course,
        enrolled: enrolledCount,
        status: enrolledCount >= course.capacity ? "full" : "open",
      };
    });

    res.json({ courses: courseList });
  } catch (error) {
    console.error("Error getting courses:", error);
    res.status(500).json({ message: "Failed to get courses" });
  }
};

const getCoursesByFaculty = async (req, res) => {
  try {
    const facultyId = req.user?.id;

    if (!facultyId) {
      return res.status(400).json({ message: "Faculty ID is required" });
    }

    if (dbState.mode === "postgres") {
      const result = await pool.query(
        `SELECT c.*, COUNT(ce.id) as enrolled_count
         FROM courses c
         LEFT JOIN course_enrollments ce ON c.id = ce.course_id
         WHERE c.faculty_id = $1
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [facultyId]
      );

      const courseList = result.rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        credits: row.credits,
        semester: row.semester,
        category: row.category,
        facultyId: row.faculty_id,
        facultyName: row.faculty_name,
        department: row.department,
        capacity: row.capacity,
        enrolled: Number(row.enrolled_count || 0),
        status: Number(row.enrolled_count || 0) >= row.capacity ? "full" : "open",
        description: row.description,
        createdAt: row.created_at,
      }));

      return res.json({ courses: courseList });
    }

    const facultyCourses = courses.filter((c) => c.facultyId === facultyId);

    const courseList = facultyCourses.map((course) => {
      const enrolledCount = courseEnrollments.filter((e) => e.courseId === course.id).length;
      return {
        ...course,
        enrolled: enrolledCount,
        status: enrolledCount >= course.capacity ? "full" : "open",
      };
    });

    res.json({ courses: courseList });
  } catch (error) {
    console.error("Error getting faculty courses:", error);
    res.status(500).json({ message: "Failed to get faculty courses" });
  }
};

const enrollStudent = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = req.user?.id;
    const studentName = req.user?.name;
    const studentRollNo = req.user?.roll_no;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (dbState.mode === "postgres") {
      const courseCk = await pool.query("SELECT * FROM courses WHERE id = $1", [courseId]);
      if (courseCk.rows.length === 0) {
        return res.status(404).json({ message: "Course not found" });
      }

      const course = courseCk.rows[0];
      const enrollmentCk = await pool.query(
        "SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        [courseId, studentId]
      );
      if (enrollmentCk.rows.length > 0) {
        return res.status(400).json({ message: "Student already enrolled in this course" });
      }

      const enrollmentCount = await pool.query(
        "SELECT COUNT(*) FROM course_enrollments WHERE course_id = $1",
        [courseId]
      );
      if (Number(enrollmentCount.rows[0].count) >= course.capacity) {
        return res.status(400).json({ message: "Course is full" });
      }

      const result = await pool.query(
        `INSERT INTO course_enrollments (course_id, student_id, student_name, student_roll_no)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [courseId, studentId, studentName, studentRollNo]
      );

      const row = result.rows[0];
      return res.status(201).json({
        message: "Student enrolled successfully",
        enrollment: {
          id: row.id,
          courseId: row.course_id,
          studentId: row.student_id,
          studentName: row.student_name,
          studentRollNo: row.student_roll_no,
          status: row.status,
          createdAt: row.created_at,
        },
      });
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const existingEnrollment = courseEnrollments.find(
      (e) => e.courseId === courseId && e.studentId === studentId
    );
    if (existingEnrollment) {
      return res.status(400).json({ message: "Student already enrolled in this course" });
    }

    const enrolledCount = courseEnrollments.filter((e) => e.courseId === courseId).length;
    if (enrolledCount >= course.capacity) {
      return res.status(400).json({ message: "Course is full" });
    }

    const newEnrollment = {
      id: nextEnrollmentId++,
      courseId,
      studentId,
      studentName,
      studentRollNo,
      status: "registered",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    courseEnrollments.push(newEnrollment);
    res.status(201).json({
      message: "Student enrolled successfully",
      enrollment: newEnrollment,
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ message: "Failed to enroll student" });
  }
};

const getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (dbState.mode === "postgres") {
      const result = await pool.query(
        `SELECT ce.*, c.code, c.name, c.credits, c.category, c.faculty_name
         FROM course_enrollments ce
         JOIN courses c ON ce.course_id = c.id
         WHERE ce.student_id = $1
         ORDER BY ce.created_at DESC`,
        [studentId]
      );

      const enrollments = result.rows.map((row) => ({
        id: row.id,
        courseId: row.course_id,
        code: row.code,
        name: row.name,
        credits: row.credits,
        category: row.category,
        facultyName: row.faculty_name,
        status: row.status,
        createdAt: row.created_at,
      }));

      return res.json({ enrollments });
    }

    const enrollments = courseEnrollments
      .filter((e) => e.studentId === studentId)
      .map((enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId);
        return {
          ...enrollment,
          code: course?.code,
          name: course?.name,
          credits: course?.credits,
          category: course?.category,
          facultyName: course?.facultyName,
        };
      });

    res.json({ enrollments });
  } catch (error) {
    console.error("Error getting student enrollments:", error);
    res.status(500).json({ message: "Failed to get enrollments" });
  }
};

const getStudentEnrollmentsForFaculty = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (dbState.mode === "postgres") {
      const studentResult = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'student' LIMIT 1",
        [studentId]
      );
      if (studentResult.rows.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const result = await pool.query(
        `SELECT ce.*, c.code, c.name, c.credits, c.category, c.faculty_name
         FROM course_enrollments ce
         JOIN courses c ON ce.course_id = c.id
         WHERE ce.student_id = $1
         ORDER BY ce.created_at DESC`,
        [studentId]
      );

      const enrollments = result.rows.map((row) => ({
        id: row.id,
        courseId: row.course_id,
        code: row.code,
        name: row.name,
        credits: row.credits,
        category: row.category,
        facultyName: row.faculty_name,
        status: row.status,
        createdAt: row.created_at,
      }));

      return res.json({ enrollments });
    }

    const enrollments = courseEnrollments
      .filter((e) => e.studentId === studentId)
      .map((enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId);
        return {
          ...enrollment,
          code: course?.code,
          name: course?.name,
          credits: course?.credits,
          category: course?.category,
          facultyName: course?.facultyName,
        };
      });

    return res.json({ enrollments });
  } catch (error) {
    console.error("Error getting student enrollments for faculty:", error);
    return res.status(500).json({ message: "Failed to get enrollments" });
  }
};

const getCourseEnrollments = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const facultyId = req.user?.id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (dbState.mode === "postgres") {
      const courseCk = await pool.query(
        "SELECT * FROM courses WHERE id = $1 AND faculty_id = $2",
        [courseId, facultyId]
      );
      if (courseCk.rows.length === 0) {
        return res.status(403).json({ message: "Not authorized to view this course enrollments" });
      }

      const result = await pool.query(
        `SELECT * FROM course_enrollments WHERE course_id = $1 ORDER BY created_at DESC`,
        [courseId]
      );

      const enrollments = result.rows.map((row) => ({
        id: row.id,
        courseId: row.course_id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentRollNo: row.student_roll_no,
        status: row.status,
        createdAt: row.created_at,
      }));

      return res.json({ enrollments });
    }

    const course = courses.find((c) => c.id === courseId && c.facultyId === facultyId);
    if (!course) {
      return res.status(403).json({ message: "Not authorized to view this course enrollments" });
    }

    const enrollments = courseEnrollments
      .filter((e) => e.courseId === courseId)
      .map((enrollment) => ({
        id: enrollment.id,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        studentRollNo: enrollment.studentRollNo,
        status: enrollment.status,
        createdAt: enrollment.createdAt,
      }));

    res.json({ enrollments });
  } catch (error) {
    console.error("Error getting course enrollments:", error);
    res.status(500).json({ message: "Failed to get course enrollments" });
  }
};

const dropCourse = async (req, res) => {
  try {
    const enrollmentId = Number(req.params.enrollmentId);
    const studentId = req.user?.id;

    if (!enrollmentId) {
      return res.status(400).json({ message: "Enrollment ID is required" });
    }

    if (dbState.mode === "postgres") {
      const enrollmentCk = await pool.query(
        "SELECT * FROM course_enrollments WHERE id = $1 AND student_id = $2",
        [enrollmentId, studentId]
      );
      if (enrollmentCk.rows.length === 0) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      await pool.query(
        "UPDATE course_enrollments SET status = $1, updated_at = NOW() WHERE id = $2",
        ["dropped", enrollmentId]
      );

      return res.json({ message: "Course dropped successfully" });
    }

    const enrollmentIdx = courseEnrollments.findIndex(
      (e) => e.id === enrollmentId && e.studentId === studentId
    );
    if (enrollmentIdx < 0) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    courseEnrollments[enrollmentIdx].status = "dropped";
    res.json({ message: "Course dropped successfully" });
  } catch (error) {
    console.error("Error dropping course:", error);
    res.status(500).json({ message: "Failed to drop course" });
  }
};

module.exports = {
  createCourse,
  getCoursesByDepartment,
  getCoursesByFaculty,
  enrollStudent,
  getStudentEnrollments,
  getStudentEnrollmentsForFaculty,
  getCourseEnrollments,
  dropCourse,
};
