const AttendanceStatus = {
	PRESENT: "present",
	ABSENT: "absent",
	ON_DUTY: "on-duty",
};

const createAttendanceRecord = ({ studentId, facultyId, date, subject, status }) => ({
	id: null,
	studentId,
	facultyId,
	date,
	subject,
	status: status || AttendanceStatus.PRESENT,
	createdAt: new Date().toISOString(),
});

module.exports = {
	AttendanceStatus,
	createAttendanceRecord,
};
