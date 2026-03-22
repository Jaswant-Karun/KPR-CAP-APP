const feedbackEntries = [];

const submitFeedback = (req, res) => {
	const { rating, comment, module } = req.body || {};

	if (!rating || Number(rating) < 1 || Number(rating) > 5) {
		return res.status(400).json({ message: "rating must be between 1 and 5" });
	}

	const entry = {
		id: feedbackEntries.length + 1,
		rating: Number(rating),
		comment: String(comment || ""),
		module: String(module || "general"),
		userId: req.user?.id || null,
		role: req.user?.role || "student",
		createdAt: new Date().toISOString(),
	};

	feedbackEntries.push(entry);
	return res.status(201).json({ message: "Feedback submitted", feedback: entry });
};

const listFeedback = (req, res) => {
	const role = req.user?.role;
	if (role !== "admin") {
		return res.status(403).json({ message: "Only admin can list all feedback" });
	}

	const avg = feedbackEntries.length
		? feedbackEntries.reduce((sum, item) => sum + item.rating, 0) / feedbackEntries.length
		: 0;

	return res.json({
		total: feedbackEntries.length,
		averageRating: Number(avg.toFixed(2)),
		feedback: feedbackEntries,
	});
};

module.exports = {
	submitFeedback,
	listFeedback,
};
