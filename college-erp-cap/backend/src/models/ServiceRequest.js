const createServiceRequest = ({ userId, title, category, description }) => ({
	id: null,
	userId,
	title,
	category,
	description,
	status: "open",
	createdAt: new Date().toISOString(),
});

module.exports = {
	createServiceRequest,
};
