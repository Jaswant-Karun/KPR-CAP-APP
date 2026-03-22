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

const attendanceStore = [];

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

const getStudentsForFaculty = async (req, res) => {
	try {
		const faculty = await pool.query(
			`SELECT department FROM users WHERE id = $1 AND role = 'faculty'`,
			[Number(req.params.facultyId || req.user?.id)]
		);

		const department = faculty.rows[0]?.department;
		const result = await pool.query(
			`SELECT id, name, email, roll_no, department FROM users WHERE role = 'student' AND ($1::text IS NULL OR department = $1) ORDER BY name ASC`,
			[department || null]
		);

		return res.json({ total: result.rows.length, students: result.rows });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch students", error: error.message });
	}
};

const submitAttendance = (req, res) => {
	const payload = req.body || {};
	if (!payload.studentId || !payload.date || !payload.status) {
		return res.status(400).json({ message: "studentId, date and status are required" });
	}

	const record = {
		id: attendanceStore.length + 1,
		facultyId: Number(req.params.facultyId || req.user?.id),
		studentId: Number(payload.studentId),
		date: String(payload.date),
		status: String(payload.status).toLowerCase(),
		subject: payload.subject || "General",
		createdAt: new Date().toISOString(),
	};

	attendanceStore.push(record);
	return res.status(201).json({ message: "Attendance submitted", record });
};

const getFacultyReports = (req, res) => {
	const facultyId = Number(req.params.facultyId || req.user?.id);
	const rows = attendanceStore.filter((item) => item.facultyId === facultyId);
	return res.json({ totalAttendanceEntries: rows.length, attendance: rows });
};

module.exports = {
	getFacultyProfile,
	getStudentsForFaculty,
	submitAttendance,
	getFacultyReports,
};
