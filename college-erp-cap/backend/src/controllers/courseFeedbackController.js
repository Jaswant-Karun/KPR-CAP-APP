const { pool, dbState } = require("../config/db");

const FEEDBACK_THRESHOLD_PERCENT = 70;

const requirePostgres = (res) => {
  if (dbState.mode !== "postgres") {
    res.status(503).json({ message: "Feedback module requires PostgreSQL mode" });
    return false;
  }
  return true;
};

const normalizeQuestionPayload = (questions = []) => {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((item, index) => ({
      text: String(item?.text || item?.question || "").trim(),
      order: Number(item?.order ?? index + 1),
    }))
    .filter((item) => item.text.length > 0)
    .sort((a, b) => a.order - b.order);
};

const getActiveCycle = async () => {
  const result = await pool.query(
    `SELECT * FROM feedback_cycles WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1`
  );
  return result.rows[0] || null;
};

const getCycleById = async (cycleId) => {
  const result = await pool.query(`SELECT * FROM feedback_cycles WHERE id = $1 LIMIT 1`, [cycleId]);
  return result.rows[0] || null;
};

const getCycleQuestions = async (cycleId) => {
  const result = await pool.query(
    `SELECT id, question_text, order_no
     FROM feedback_questions
     WHERE cycle_id = $1 AND is_active = TRUE
     ORDER BY order_no ASC, id ASC`,
    [cycleId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    text: row.question_text,
    order: row.order_no,
  }));
};

const getStudentRegisteredCourses = async (studentId) => {
  const result = await pool.query(
    `SELECT ce.course_id, c.code, c.name, c.faculty_id, c.faculty_name
     FROM course_enrollments ce
     JOIN courses c ON c.id = ce.course_id
     WHERE ce.student_id = $1
       AND ce.status = 'registered'
     ORDER BY c.code ASC`,
    [studentId]
  );

  return result.rows.map((row) => ({
    courseId: row.course_id,
    code: row.code,
    name: row.name,
    facultyId: row.faculty_id,
    facultyName: row.faculty_name,
  }));
};

const mapCycle = (cycle) => ({
  id: cycle.id,
  title: cycle.title,
  academicYear: cycle.academic_year,
  semester: cycle.semester,
  status: cycle.status,
  createdBy: cycle.created_by,
  createdByName: cycle.created_by_name,
  createdAt: cycle.created_at,
  updatedAt: cycle.updated_at,
});

const listCycles = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const result = await pool.query(
      `SELECT * FROM feedback_cycles ORDER BY created_at DESC`
    );

    return res.json({
      cycles: result.rows.map(mapCycle),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback cycles", error: error.message });
  }
};

const createCycle = async (req, res) => {
  const client = await pool.connect();
  try {
    if (!requirePostgres(res)) return;

    const title = String(req.body?.title || "Course Faculty Feedback").trim();
    const academicYear = String(req.body?.academicYear || "").trim();
    const semester = Number(req.body?.semester);
    const activateNow = Boolean(req.body?.activateNow ?? true);
    const questions = normalizeQuestionPayload(req.body?.questions);

    if (!academicYear) {
      return res.status(400).json({ message: "academicYear is required" });
    }

    if (!semester || semester < 1 || semester > 10) {
      return res.status(400).json({ message: "semester must be between 1 and 10" });
    }

    if (questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    await client.query("BEGIN");

    if (activateNow) {
      await client.query(
        `UPDATE feedback_cycles SET status = 'closed', updated_at = NOW() WHERE status = 'active'`
      );
    }

    const cycleResult = await client.query(
      `INSERT INTO feedback_cycles
         (title, academic_year, semester, status, created_by, created_by_name, created_at, updated_at)
       VALUES
         ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        title,
        academicYear,
        semester,
        activateNow ? "active" : "draft",
        req.user?.id || null,
        req.user?.name || req.user?.email || "Admin",
      ]
    );

    const cycle = cycleResult.rows[0];

    for (const question of questions) {
      await client.query(
        `INSERT INTO feedback_questions (cycle_id, question_text, order_no, is_active, created_at)
         VALUES ($1, $2, $3, TRUE, NOW())`,
        [cycle.id, question.text, question.order]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: activateNow
        ? "Feedback cycle created and activated"
        : "Feedback cycle created as draft",
      cycle: mapCycle(cycle),
      questions,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create feedback cycle", error: error.message });
  } finally {
    client.release();
  }
};

const activateCycle = async (req, res) => {
  const client = await pool.connect();
  try {
    if (!requirePostgres(res)) return;

    const cycleId = Number(req.params.cycleId);
    if (!cycleId) {
      return res.status(400).json({ message: "Invalid cycle id" });
    }

    const target = await getCycleById(cycleId);
    if (!target) {
      return res.status(404).json({ message: "Feedback cycle not found" });
    }

    await client.query("BEGIN");
    await client.query(`UPDATE feedback_cycles SET status = 'closed', updated_at = NOW() WHERE status = 'active'`);
    const result = await client.query(
      `UPDATE feedback_cycles
       SET status = 'active', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [cycleId]
    );
    await client.query("COMMIT");

    return res.json({
      message: "Feedback cycle activated",
      cycle: mapCycle(result.rows[0]),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to activate cycle", error: error.message });
  } finally {
    client.release();
  }
};

const getStudentFeedbackContext = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const cycle = await getActiveCycle();
    if (!cycle) {
      return res.json({
        cycle: null,
        questions: [],
        courses: [],
        canSubmit: false,
        message: "No active feedback cycle available",
      });
    }

    const questions = await getCycleQuestions(cycle.id);
    const courses = await getStudentRegisteredCourses(req.user?.id);

    const submitted = await pool.query(
      `SELECT id, ticket_no, created_at
       FROM feedback_submissions
       WHERE cycle_id = $1 AND student_id = $2
       LIMIT 1`,
      [cycle.id, req.user?.id]
    );

    return res.json({
      cycle: mapCycle(cycle),
      questions,
      courses,
      alreadySubmitted: submitted.rows.length > 0,
      submission: submitted.rows[0]
        ? {
            id: submitted.rows[0].id,
            ticketNo: submitted.rows[0].ticket_no,
            submittedAt: submitted.rows[0].created_at,
          }
        : null,
      canSubmit: submitted.rows.length === 0 && courses.length > 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback context", error: error.message });
  }
};

const submitStudentFeedback = async (req, res) => {
  const client = await pool.connect();
  try {
    if (!requirePostgres(res)) return;

    const cycle = await getActiveCycle();
    if (!cycle) {
      return res.status(400).json({ message: "No active feedback cycle available" });
    }

    const answersByCourse = Array.isArray(req.body?.responses) ? req.body.responses : [];
    if (answersByCourse.length === 0) {
      return res.status(400).json({ message: "responses are required" });
    }

    const questions = await getCycleQuestions(cycle.id);
    if (questions.length === 0) {
      return res.status(400).json({ message: "No active questions configured for this cycle" });
    }

    const questionIds = new Set(questions.map((q) => Number(q.id)));
    const registeredCourses = await getStudentRegisteredCourses(req.user?.id);
    if (registeredCourses.length === 0) {
      return res.status(400).json({ message: "No registered courses found for this student" });
    }

    const registeredCourseMap = new Map(registeredCourses.map((course) => [Number(course.courseId), course]));

    const requestedCourseIds = answersByCourse.map((item) => Number(item?.courseId));
    const distinctCourseIds = [...new Set(requestedCourseIds)];

    if (distinctCourseIds.length !== registeredCourses.length) {
      return res.status(400).json({
        message: "Feedback must be submitted for all registered courses",
      });
    }

    for (const courseId of distinctCourseIds) {
      if (!registeredCourseMap.has(courseId)) {
        return res.status(400).json({ message: `Invalid course in response payload: ${courseId}` });
      }
    }

    const existing = await pool.query(
      `SELECT id FROM feedback_submissions WHERE cycle_id = $1 AND student_id = $2 LIMIT 1`,
      [cycle.id, req.user?.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Feedback already submitted for this cycle" });
    }

    await client.query("BEGIN");

    const submissionResult = await client.query(
      `INSERT INTO feedback_submissions
         (cycle_id, student_id, student_name, student_roll_no, department, status, created_at, updated_at)
       VALUES
         ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW())
       RETURNING *`,
      [
        cycle.id,
        req.user?.id,
        req.user?.name || req.user?.email || "Student",
        req.user?.roll_no || null,
        req.user?.department || null,
      ]
    );

    const submission = submissionResult.rows[0];
    const ticketNo = 68000 + Number(submission.id);

    await client.query(
      `UPDATE feedback_submissions SET ticket_no = $2, updated_at = NOW() WHERE id = $1`,
      [submission.id, ticketNo]
    );

    const perCoursePercentages = [];

    for (const responseBlock of answersByCourse) {
      const courseId = Number(responseBlock?.courseId);
      const course = registeredCourseMap.get(courseId);
      const answerRows = Array.isArray(responseBlock?.answers) ? responseBlock.answers : [];

      if (answerRows.length !== questions.length) {
        throw new Error(`Course ${course.code} does not contain all question ratings`);
      }

      const ratingsMap = new Map();
      for (const answer of answerRows) {
        const questionId = Number(answer?.questionId);
        const rating = Number(answer?.rating);

        if (!questionIds.has(questionId)) {
          throw new Error(`Invalid question id: ${questionId}`);
        }

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          throw new Error(`Ratings must be between 1 and 5 (course ${course.code})`);
        }

        ratingsMap.set(questionId, rating);
      }

      if (ratingsMap.size !== questions.length) {
        throw new Error(`Duplicate or missing question ratings for course ${course.code}`);
      }

      let totalScore = 0;
      for (const question of questions) {
        totalScore += ratingsMap.get(question.id);
      }

      const maxScore = questions.length * 5;
      const percentage = Number(((totalScore / maxScore) * 100).toFixed(2));

      const courseRatingResult = await client.query(
        `INSERT INTO feedback_course_ratings
           (submission_id, course_id, faculty_id, course_code, course_name, faculty_name, question_count, total_score, percentage, created_at, updated_at)
         VALUES
           ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING id`,
        [
          submission.id,
          courseId,
          course.facultyId || null,
          course.code,
          course.name,
          course.facultyName || null,
          questions.length,
          totalScore,
          percentage,
        ]
      );

      const courseRatingId = courseRatingResult.rows[0].id;

      for (const question of questions) {
        await client.query(
          `INSERT INTO feedback_answers
             (course_rating_id, question_id, question_text, rating, created_at)
           VALUES
             ($1, $2, $3, $4, NOW())`,
          [courseRatingId, question.id, question.text, ratingsMap.get(question.id)]
        );
      }

      perCoursePercentages.push(percentage);
    }

    await client.query("COMMIT");

    const overallPercentage = perCoursePercentages.length
      ? Number(
          (
            perCoursePercentages.reduce((acc, value) => acc + Number(value || 0), 0) /
            perCoursePercentages.length
          ).toFixed(2)
        )
      : 0;

    return res.status(201).json({
      message: "Feedback submitted successfully",
      submission: {
        id: submission.id,
        ticketNo,
        submittedAt: submission.created_at,
        overallPercentage,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(400).json({ message: error.message || "Failed to submit feedback" });
  } finally {
    client.release();
  }
};

const listFeedbackUsers = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const cycleIdParam = Number(req.query?.cycleId);
    const search = String(req.query?.search || "").trim();

    let cycle = null;
    if (cycleIdParam > 0) {
      cycle = await getCycleById(cycleIdParam);
    } else {
      cycle = await getActiveCycle();
    }

    if (!cycle) {
      return res.json({ cycle: null, users: [] });
    }

    const values = [cycle.id];
    let whereSearch = "";

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      whereSearch = `
        AND (
          CAST(s.ticket_no AS TEXT) ILIKE $${values.length}
          OR LOWER(COALESCE(s.student_name, '')) ILIKE $${values.length}
          OR LOWER(COALESCE(s.student_roll_no, '')) ILIKE $${values.length}
        )
      `;
    }

    const facultyFilter = req.user?.role === "faculty"
      ? `
        AND EXISTS (
          SELECT 1
          FROM feedback_course_ratings fcrf
          WHERE fcrf.submission_id = s.id
            AND fcrf.faculty_id = ${Number(req.user?.id) || 0}
        )
      `
      : "";

    const result = await pool.query(
      `SELECT
          s.id,
          s.ticket_no,
          s.student_id,
          s.student_name,
          s.student_roll_no,
          s.created_at,
          COALESCE(registered.total_registered, 0) AS total_registered,
          COALESCE(submitted.total_submitted, 0) AS total_submitted,
          COALESCE(submitted.overall_percentage, 0) AS overall_percentage
       FROM feedback_submissions s
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total_registered
         FROM course_enrollments ce
         WHERE ce.student_id = s.student_id
           AND ce.status = 'registered'
       ) registered ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS total_submitted,
           COALESCE(AVG(fcr.percentage), 0)::numeric(5,2) AS overall_percentage
         FROM feedback_course_ratings fcr
         WHERE fcr.submission_id = s.id
       ) submitted ON TRUE
       WHERE s.cycle_id = $1
       ${facultyFilter}
       ${whereSearch}
       ORDER BY s.created_at DESC`,
      values
    );

    const users = result.rows.map((row) => ({
      submissionId: row.id,
      ticket: row.ticket_no,
      studentId: row.student_id,
      studentName: row.student_name,
      studentRollNo: row.student_roll_no,
      submittedAt: row.created_at,
      submittedLevels: {
        done: Number(row.total_submitted || 0),
        total: Number(row.total_registered || 0),
      },
      submitted: Number(row.total_submitted || 0) > 0,
      overallPercentage: Number(row.overall_percentage || 0),
    }));

    return res.json({
      cycle: mapCycle(cycle),
      users,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback users", error: error.message });
  }
};

const getSubmissionDetails = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const submissionId = Number(req.params.submissionId);
    if (!submissionId) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const submissionResult = await pool.query(
      `SELECT s.*, c.title, c.academic_year, c.semester
       FROM feedback_submissions s
       JOIN feedback_cycles c ON c.id = s.cycle_id
       WHERE s.id = $1
       LIMIT 1`,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const submission = submissionResult.rows[0];

    if (req.user?.role === "student" && Number(submission.student_id) !== Number(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === "faculty") {
      const facultyOwnCheck = await pool.query(
        `SELECT 1
         FROM feedback_course_ratings
         WHERE submission_id = $1 AND faculty_id = $2
         LIMIT 1`,
        [submissionId, req.user?.id]
      );
      if (facultyOwnCheck.rows.length === 0) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const coursesResult = await pool.query(
      `SELECT id, course_id, faculty_id, course_code, course_name, faculty_name, question_count, total_score, percentage
       FROM feedback_course_ratings
       WHERE submission_id = $1
       ORDER BY course_code ASC`,
      [submissionId]
    );

    const courseRows = coursesResult.rows;
    const courseRatingIds = courseRows.map((row) => row.id);

    let responses = [];
    if (courseRatingIds.length > 0) {
      const responseResult = await pool.query(
        `SELECT
            fa.id,
            fa.course_rating_id,
            fa.question_id,
            fa.question_text,
            fa.rating,
            fcr.course_code,
            fcr.course_name,
            fcr.faculty_id,
            fcr.faculty_name
         FROM feedback_answers fa
         JOIN feedback_course_ratings fcr ON fcr.id = fa.course_rating_id
         WHERE fa.course_rating_id = ANY($1::int[])
         ORDER BY fcr.course_code ASC, fa.question_id ASC`,
        [courseRatingIds]
      );

      responses = responseResult.rows.map((row) => ({
        id: row.id,
        courseRatingId: row.course_rating_id,
        questionId: row.question_id,
        questionName: row.question_text,
        courseCode: row.course_code,
        courseName: row.course_name,
        facultyCode: row.faculty_id,
        facultyName: row.faculty_name,
        answer: row.rating,
        answerText: row.rating ? `${row.rating} star` : "-",
      }));
    }

    const overallPercentage = courseRows.length
      ? Number(
          (
            courseRows.reduce((acc, row) => acc + Number(row.percentage || 0), 0) /
            courseRows.length
          ).toFixed(2)
        )
      : 0;

    const exposePercentage = req.user?.role !== "student";

    return res.json({
      details: {
        submissionId: submission.id,
        ticket: submission.ticket_no,
        type: submission.title,
        name: submission.title,
        academicYear: submission.academic_year,
        semester: submission.semester,
        serialNumber: submission.id,
        createdAt: submission.created_at,
        studentName: submission.student_name,
        studentRollNo: submission.student_roll_no,
      },
      courses: courseRows.map((row) => ({
        id: row.id,
        sem: submission.semester,
        courseId: row.course_id,
        courseCode: row.course_code,
        courseName: row.course_name,
        facultyCode: row.faculty_id,
        facultyName: row.faculty_name,
        ...(exposePercentage ? { percentage: Number(row.percentage || 0) } : {}),
      })),
      responses,
      ...(exposePercentage ? { overallPercentage } : {}),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load submission details", error: error.message });
  }
};

const listStudentReports = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const result = await pool.query(
      `SELECT
          s.id,
          s.ticket_no,
          s.created_at,
          c.title,
          c.academic_year,
          c.semester,
          COUNT(fcr.id)::int AS course_count,
          COALESCE(AVG(fcr.percentage), 0)::numeric(5,2) AS overall_percentage
       FROM feedback_submissions s
       JOIN feedback_cycles c ON c.id = s.cycle_id
       LEFT JOIN feedback_course_ratings fcr ON fcr.submission_id = s.id
       WHERE s.student_id = $1
       GROUP BY s.id, s.ticket_no, s.created_at, c.title, c.academic_year, c.semester
       ORDER BY s.created_at DESC`,
      [req.user?.id]
    );

    const reports = result.rows.map((row) => ({
      submissionId: row.id,
      ticket: row.ticket_no,
      title: row.title,
      academicYear: row.academic_year,
      semester: row.semester,
      courseCount: row.course_count,
      submittedAt: row.created_at,
    }));

    return res.json({ reports });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback reports", error: error.message });
  }
};

const listFacultyPerformance = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const cycleIdParam = Number(req.query?.cycleId);
    const cycle = cycleIdParam > 0 ? await getCycleById(cycleIdParam) : await getActiveCycle();

    if (!cycle) {
      return res.json({ cycle: null, performance: [] });
    }

    const roleFilter = req.user?.role === "faculty" ? "AND fcr.faculty_id = $2" : "";
    const values = req.user?.role === "faculty" ? [cycle.id, req.user?.id] : [cycle.id];

    const result = await pool.query(
      `SELECT
          fcr.faculty_id,
          COALESCE(fcr.faculty_name, 'Faculty') AS faculty_name,
          COUNT(*)::int AS total_course_feedback,
          COUNT(DISTINCT fcr.submission_id)::int AS total_students,
          COALESCE(AVG(fcr.percentage), 0)::numeric(5,2) AS average_percentage,
          ffa.reason,
          ffa.admin_action,
          ffa.reason_submitted_at,
          ffa.action_taken_at
       FROM feedback_course_ratings fcr
       JOIN feedback_submissions fs ON fs.id = fcr.submission_id
       LEFT JOIN feedback_faculty_actions ffa
         ON ffa.cycle_id = fs.cycle_id
        AND ffa.faculty_id = fcr.faculty_id
       WHERE fs.cycle_id = $1
         ${roleFilter}
       GROUP BY fcr.faculty_id, fcr.faculty_name, ffa.reason, ffa.admin_action, ffa.reason_submitted_at, ffa.action_taken_at
       ORDER BY average_percentage DESC`,
      values
    );

    const performance = result.rows.map((row) => {
      const averagePercentage = Number(row.average_percentage || 0);
      return {
        facultyId: row.faculty_id,
        facultyName: row.faculty_name,
        totalCourseFeedback: row.total_course_feedback,
        totalStudents: row.total_students,
        averagePercentage,
        thresholdStatus: averagePercentage >= FEEDBACK_THRESHOLD_PERCENT ? "ok" : "below-threshold",
        requiresReason: averagePercentage < FEEDBACK_THRESHOLD_PERCENT,
        reason: row.reason || "",
        adminAction: row.admin_action || "",
        reasonSubmittedAt: row.reason_submitted_at,
        actionTakenAt: row.action_taken_at,
      };
    });

    return res.json({
      cycle: mapCycle(cycle),
      threshold: FEEDBACK_THRESHOLD_PERCENT,
      performance,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load faculty performance", error: error.message });
  }
};

const submitFacultyReason = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const cycleId = Number(req.params.cycleId);
    if (!cycleId) {
      return res.status(400).json({ message: "Invalid cycle id" });
    }

    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const performanceResult = await pool.query(
      `SELECT COALESCE(AVG(fcr.percentage), 0)::numeric(5,2) AS average_percentage
       FROM feedback_course_ratings fcr
       JOIN feedback_submissions fs ON fs.id = fcr.submission_id
       WHERE fs.cycle_id = $1 AND fcr.faculty_id = $2`,
      [cycleId, req.user?.id]
    );

    const averagePercentage = Number(performanceResult.rows[0]?.average_percentage || 0);
    if (averagePercentage >= FEEDBACK_THRESHOLD_PERCENT) {
      return res.status(400).json({ message: "Reason is only required when percentage is below 70" });
    }

    await pool.query(
      `INSERT INTO feedback_faculty_actions
         (cycle_id, faculty_id, reason, reason_submitted_at, updated_by, updated_by_name, updated_at)
       VALUES
         ($1, $2, $3, NOW(), $4, $5, NOW())
       ON CONFLICT (cycle_id, faculty_id)
       DO UPDATE
       SET reason = EXCLUDED.reason,
           reason_submitted_at = NOW(),
           updated_by = EXCLUDED.updated_by,
           updated_by_name = EXCLUDED.updated_by_name,
           updated_at = NOW()`,
      [
        cycleId,
        req.user?.id,
        reason,
        req.user?.id || null,
        req.user?.name || req.user?.email || "Faculty",
      ]
    );

    return res.json({ message: "Reason submitted to admin" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit reason", error: error.message });
  }
};

const submitAdminAction = async (req, res) => {
  try {
    if (!requirePostgres(res)) return;

    const cycleId = Number(req.params.cycleId);
    const facultyId = Number(req.params.facultyId);
    const action = String(req.body?.action || "").trim();

    if (!cycleId || !facultyId) {
      return res.status(400).json({ message: "Invalid cycle or faculty id" });
    }

    if (!action) {
      return res.status(400).json({ message: "Admin action is required" });
    }

    await pool.query(
      `INSERT INTO feedback_faculty_actions
         (cycle_id, faculty_id, admin_action, action_taken_at, updated_by, updated_by_name, updated_at)
       VALUES
         ($1, $2, $3, NOW(), $4, $5, NOW())
       ON CONFLICT (cycle_id, faculty_id)
       DO UPDATE
       SET admin_action = EXCLUDED.admin_action,
           action_taken_at = NOW(),
           updated_by = EXCLUDED.updated_by,
           updated_by_name = EXCLUDED.updated_by_name,
           updated_at = NOW()`,
      [
        cycleId,
        facultyId,
        action,
        req.user?.id || null,
        req.user?.name || req.user?.email || "Admin",
      ]
    );

    return res.json({ message: "Admin action recorded" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to record admin action", error: error.message });
  }
};

module.exports = {
  listCycles,
  createCycle,
  activateCycle,
  getStudentFeedbackContext,
  submitStudentFeedback,
  listFeedbackUsers,
  getSubmissionDetails,
  listStudentReports,
  listFacultyPerformance,
  submitFacultyReason,
  submitAdminAction,
};
