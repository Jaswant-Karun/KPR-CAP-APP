const createFeedback = ({ userId, module, rating, comment }) => ({
	id: null,
	userId,
	module,
	rating,
	comment,
	createdAt: new Date().toISOString(),
});

module.exports = {
	createFeedback,
};
