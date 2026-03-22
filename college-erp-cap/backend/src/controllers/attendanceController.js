const attendanceEntries = [];

const addAttendanceEntry = (entry) => {
	attendanceEntries.push({
		id: attendanceEntries.length + 1,
		...entry,
		createdAt: new Date().toISOString(),
	});
};

const getAttendanceSummary = (req, res) => {
	const studentId = req.query.studentId ? Number(req.query.studentId) : null;
	const rows = studentId
		? attendanceEntries.filter((entry) => entry.studentId === studentId)
		: attendanceEntries;

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
};

module.exports = {
	addAttendanceEntry,
	getAttendanceSummary,
};
