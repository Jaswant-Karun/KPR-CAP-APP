const { pool } = require("../config/db");

const addAttendanceEntry = async (entry) => {
	const studentId = Number(entry?.studentId);
	const status = String(entry?.status || "").toLowerCase();
	if (!Number.isInteger(studentId) || studentId <= 0) {
		throw new Error("Valid studentId is required");
	}
	if (!["present", "absent", "on-duty"].includes(status)) {
		throw new Error("status must be present, absent, or on-duty");
	}

	await pool.query(
		`INSERT INTO attendance_entries
			(faculty_id, student_id, roll_no, student_name, attendance_date, status, subject, created_at, updated_at)
		 VALUES
			($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6, COALESCE($7, 'General'), NOW(), NOW())`,
		[
			Number(entry?.facultyId || 0),
			studentId,
			entry?.rollNo || null,
			entry?.studentName || null,
			entry?.date || null,
			status,
			entry?.subject || "General",
		]
	);
};

const getAttendanceSummary = async (req, res) => {
	try {
		const studentId = req.query.studentId ? Number(req.query.studentId) : null;
		const params = [];
		let where = "";
		if (Number.isInteger(studentId) && studentId > 0) {
			params.push(studentId);
			where = "WHERE student_id = $1";
		}

		const result = await pool.query(
			`SELECT id, faculty_id, student_id, roll_no, student_name, attendance_date, status, subject, created_at, updated_at
			 FROM attendance_entries
			 ${where}
			 ORDER BY attendance_date DESC, id DESC`,
			params
		);

		const rows = result.rows.map((row) => ({
			id: row.id,
			facultyId: row.faculty_id,
			studentId: row.student_id,
			rollNo: row.roll_no,
			studentName: row.student_name,
			date: String(row.attendance_date).slice(0, 10),
			status: String(row.status || "").toLowerCase(),
			subject: row.subject,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));

		const total = rows.length;
		const present = rows.filter((entry) => entry.status === "present").length;
		const absent = rows.filter((entry) => entry.status === "absent").length;

		return res.json({
			total,
			present,
			absent,
			percentage: total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0,
			entries: rows,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to load attendance summary", error: error.message });
	}
};

module.exports = {
	addAttendanceEntry,
	getAttendanceSummary,
};
