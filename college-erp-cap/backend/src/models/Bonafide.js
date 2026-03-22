const createBonafideRequest = ({ studentId, reason, requiredDate }) => ({
	id: null,
	studentId,
	reason,
	requiredDate,
	status: "pending",
	createdAt: new Date().toISOString(),
});

module.exports = {
	createBonafideRequest,
};
