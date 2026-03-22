const createGatePass = ({ studentId, fromDate, toDate, reason }) => ({
	id: null,
	studentId,
	fromDate,
	toDate,
	reason,
	status: "pending",
	createdAt: new Date().toISOString(),
});

module.exports = {
	createGatePass,
};
