// ID Card Photo Upload
const uploadIdCardPhoto = async (req, res) => {
	try {
		if (!req.upload) {
			return res.status(400).json({ message: 'No ID card photo uploaded' });
		}
		const facultyId = Number(req.params.facultyId || req.user?.id);
		// Simulate DB update: In real app, update DB with file info
		// Here, just return the uploaded file info for demo
		// You should update the faculty record in DB with req.upload info
		return res.status(200).json({
			message: 'ID card photo uploaded',
			idCardPhoto: {
				url: `/uploads/${req.upload.originalname}`,
				publicId: req.upload.originalname,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: 'Failed to upload ID card photo', error: error.message });
	}
};
const { pool, dbState } = require("../config/db");
const { getFacultyControlMap } = require("../store/facultyControlStore");
const { resolveCb001RosterStudentIds } = require("../services/cb001Roster.service");

const attendanceStore = [];

const ATTENDANCE_STATUS = new Set(["present", "absent", "on-duty"]);

const isValidDateInput = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());

const normalizeRow = (row) => ({
	id: Number(row.id),
	facultyId: Number(row.faculty_id),
	studentId: Number(row.student_id),
	rollNo: row.roll_no,
	studentName: row.student_name,
	date: String(row.attendance_date).slice(0, 10),
	status: String(row.status || "").toLowerCase(),
	subject: row.subject,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const getFacultyProfile = async (req, res) => {
	try {
		const facultyId = Number(req.params.facultyId || req.user?.id);
		const result = await pool.query(
			`SELECT id, name, email, role, roll_no, department, created_at FROM users WHERE id = $1 AND role = 'faculty'`,
			[facultyId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Faculty not found" });
		}

		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch faculty profile", error: error.message });
	}
};

const listFacultyMembers = async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT id, name, email, roll_no, department FROM users WHERE role = 'faculty' ORDER BY name ASC`
		);
		return res.json({ total: result.rows.length, faculty: result.rows });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch faculty directory", error: error.message });
	}
};

const getStudentsForFaculty = async (req, res) => {
	try {
		const facultyId = Number(req.params.facultyId || req.user?.id);
		const cb001Roster = await resolveCb001RosterStudentIds(pool, facultyId);
		const department = cb001Roster.department;
		const controlMap = getFacultyControlMap(facultyId);

		const departmentStudents = await pool.query(
			`SELECT id, name, email, roll_no, department FROM users WHERE role = 'student' AND ($1::text IS NULL OR department = $1) ORDER BY COALESCE(roll_no, ''), name ASC`,
			[department || null]
		);

		const mappedStudentIds = controlMap && Array.isArray(controlMap.studentIds)
			? controlMap.studentIds.map((id) => Number(id)).filter((id) => id > 0)
			: [];
		const rosterStudentIds = cb001Roster.shouldApply ? cb001Roster.studentIds : [];

		const departmentStudentIds = departmentStudents.rows.map((row) => Number(row.id)).filter((id) => id > 0);
		const mergedStudentIds = [...new Set([...departmentStudentIds, ...mappedStudentIds, ...rosterStudentIds])];

		let result = { rows: [] };
		if (mergedStudentIds.length > 0) {
			result = await pool.query(
				`SELECT id, name, email, roll_no, department FROM users WHERE role = 'student' AND id = ANY($1::int[]) ORDER BY COALESCE(roll_no, ''), name ASC`,
				[mergedStudentIds]
			);
		}

		return res.json({
			total: result.rows.length,
			mapping: controlMap,
			students: result.rows,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch students", error: error.message });
	}
};

const submitAttendance = async (req, res) => {
	const payload = req.body || {};
	if (!payload.studentId || !payload.date || !payload.status) {
		return res.status(400).json({ message: "studentId, date and status are required" });
	}

	const facultyId = Number(req.params.facultyId || req.user?.id);
	const studentId = Number(payload.studentId);
	const status = String(payload.status || "").toLowerCase();
	const attendanceDate = String(payload.date || "").trim();

	if (!Number.isInteger(studentId) || studentId <= 0) {
		return res.status(400).json({ message: "Valid studentId is required" });
	}

	if (!Number.isInteger(facultyId) || facultyId <= 0) {
		return res.status(400).json({ message: "Valid facultyId is required" });
	}

	if (!isValidDateInput(attendanceDate)) {
		return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
	}

	if (!ATTENDANCE_STATUS.has(status)) {
		return res.status(400).json({ message: "status must be present, absent, or on-duty" });
	}

	const rollNo = payload.rollNo ? String(payload.rollNo).toUpperCase() : null;
	const studentName = payload.studentName ? String(payload.studentName).toUpperCase() : null;
	const subject = String(payload.subject || "General").trim() || "General";

	try {
		if (dbState.mode === "postgres") {
			const result = await pool.query(
				`
					INSERT INTO attendance_entries
						(faculty_id, student_id, roll_no, student_name, attendance_date, status, subject)
					VALUES
						($1, $2, $3, $4, $5::date, $6, $7)
					ON CONFLICT (faculty_id, student_id, attendance_date, subject)
					DO UPDATE SET
						roll_no = EXCLUDED.roll_no,
						student_name = EXCLUDED.student_name,
						status = EXCLUDED.status,
						updated_at = NOW()
					RETURNING id, faculty_id, student_id, roll_no, student_name, attendance_date, status, subject, created_at, updated_at;
				`,
				[facultyId, studentId, rollNo, studentName, attendanceDate, status, subject]
			);

			return res.status(201).json({ message: "Attendance submitted", record: normalizeRow(result.rows[0]) });
		}

		const existingIndex = attendanceStore.findIndex(
			(item) =>
				Number(item.facultyId) === facultyId &&
				Number(item.studentId) === studentId &&
				String(item.date) === attendanceDate &&
				String(item.subject) === subject
		);

		if (existingIndex >= 0) {
			attendanceStore[existingIndex] = {
				...attendanceStore[existingIndex],
				rollNo,
				studentName,
				status,
				subject,
				updatedAt: new Date().toISOString(),
			};
			return res.status(201).json({ message: "Attendance submitted", record: attendanceStore[existingIndex] });
		}

		const record = {
			id: attendanceStore.length + 1,
			facultyId,
			studentId,
			rollNo,
			studentName,
			date: attendanceDate,
			status,
			subject,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		attendanceStore.push(record);
		return res.status(201).json({ message: "Attendance submitted", record });
	} catch (error) {
		return res.status(500).json({ message: "Failed to submit attendance", error: error.message });
	}
};

const getAttendanceEntries = async (filters = {}) => {
	const facultyId = filters.facultyId ? Number(filters.facultyId) : null;
	const studentId = filters.studentId ? Number(filters.studentId) : null;
	const rollNo = filters.rollNo ? String(filters.rollNo).toUpperCase() : null;
	const date = filters.date ? String(filters.date) : null;
	const fromDate = filters.fromDate ? String(filters.fromDate) : null;
	const toDate = filters.toDate ? String(filters.toDate) : null;
	const subject = filters.subject ? String(filters.subject) : null;

	if (dbState.mode === "postgres") {
		const where = [];
		const values = [];

		if (Number.isInteger(facultyId) && facultyId > 0) {
			values.push(facultyId);
			where.push(`faculty_id = $${values.length}`);
		}

		if (Number.isInteger(studentId) && studentId > 0) {
			values.push(studentId);
			where.push(`student_id = $${values.length}`);
		}

		if (rollNo) {
			values.push(rollNo);
			where.push(`UPPER(COALESCE(roll_no, '')) = $${values.length}`);
		}

		if (date && isValidDateInput(date)) {
			values.push(date);
			where.push(`attendance_date = $${values.length}::date`);
		} else {
			if (fromDate && isValidDateInput(fromDate)) {
				values.push(fromDate);
				where.push(`attendance_date >= $${values.length}::date`);
			}

			if (toDate && isValidDateInput(toDate)) {
				values.push(toDate);
				where.push(`attendance_date <= $${values.length}::date`);
			}
		}

		if (subject && subject !== "all") {
			values.push(subject);
			where.push(`subject = $${values.length}`);
		}

		const sql = `
			SELECT id, faculty_id, student_id, roll_no, student_name, attendance_date, status, subject, created_at, updated_at
			FROM attendance_entries
			${where.length ? `WHERE ${where.join(" AND ")}` : ""}
			ORDER BY attendance_date DESC, subject ASC, student_name ASC;
		`;

		const result = await pool.query(sql, values);
		return result.rows.map(normalizeRow);
	}

	return attendanceStore
		.filter((item) => {
			if (Number.isInteger(facultyId) && facultyId > 0 && Number(item.facultyId) !== facultyId) {
				return false;
			}
			if (Number.isInteger(studentId) && studentId > 0 && Number(item.studentId) !== studentId) {
				return false;
			}
			if (rollNo && String(item.rollNo || "").toUpperCase() !== rollNo) {
				return false;
			}
			if (date && String(item.date) !== date) {
				return false;
			}
			if (!date && fromDate && String(item.date) < fromDate) {
				return false;
			}
			if (!date && toDate && String(item.date) > toDate) {
				return false;
			}
			if (subject && subject !== "all" && String(item.subject) !== subject) {
				return false;
			}
			return true;
		})
		.sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

const getFacultyReports = async (req, res) => {
	try {
		const facultyId = Number(req.params.facultyId || req.user?.id);
		const attendance = await getAttendanceEntries({
			facultyId,
			date: req.query.date,
			fromDate: req.query.fromDate,
			toDate: req.query.toDate,
			subject: req.query.subject,
			studentId: req.query.studentId,
		});

		return res.json({
			totalAttendanceEntries: attendance.length,
			attendance,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch faculty reports", error: error.message });
	}
};

module.exports = {
	listFacultyMembers,
	getFacultyProfile,
	getStudentsForFaculty,
	submitAttendance,
	getFacultyReports,
	getAttendanceEntries,
	uploadIdCardPhoto,
};
