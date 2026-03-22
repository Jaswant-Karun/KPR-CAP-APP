const createTimetableEntry = ({
	audienceType,
	audienceId,
	dayOfWeek,
	periodNo,
	subjectName,
	startTime,
	endTime,
	room,
	facultyName,
}) => ({
	id: null,
	audienceType,
	audienceId,
	dayOfWeek,
	periodNo,
	subjectName,
	startTime,
	endTime,
	room,
	facultyName,
	createdAt: new Date().toISOString(),
});

module.exports = {
	createTimetableEntry,
};
