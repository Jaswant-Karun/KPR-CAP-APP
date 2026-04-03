const { pool } = require("../config/db");

const submitFeedback = async (req, res) => {
	try {
	const { rating, comment, module } = req.body || {};

	if (!rating || Number(rating) < 1 || Number(rating) > 5) {
		return res.status(400).json({ message: "rating must be between 1 and 5" });
	}

	const inserted = await pool.query(
		`INSERT INTO simple_feedback_entries (rating, comment, module, user_id, role, created_at)
		 VALUES ($1, $2, $3, $4, $5, NOW())
		 RETURNING id, rating, comment, module, user_id, role, created_at`,
		[
			Number(rating),
			String(comment || ""),
			String(module || "general"),
			req.user?.id || null,
			req.user?.role || "student",
		]
	);

	const row = inserted.rows[0];
	return res.status(201).json({
		message: "Feedback submitted",
		feedback: {
			id: row.id,
			rating: row.rating,
			comment: row.comment,
			module: row.module,
			userId: row.user_id,
			role: row.role,
			createdAt: row.created_at,
		},
	});
	} catch (error) {
		return res.status(500).json({ message: "Failed to submit feedback", error: error.message });
	}
};

const listFeedback = async (req, res) => {
	try {
	const role = req.user?.role;
	if (role !== "admin") {
		return res.status(403).json({ message: "Only admin can list all feedback" });
	}

	const result = await pool.query(
		`SELECT id, rating, comment, module, user_id, role, created_at
		 FROM simple_feedback_entries
		 ORDER BY created_at DESC`
	);

	const feedback = result.rows.map((row) => ({
		id: row.id,
		rating: Number(row.rating),
		comment: row.comment,
		module: row.module,
		userId: row.user_id,
		role: row.role,
		createdAt: row.created_at,
	}));

	const avg = feedback.length ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length : 0;

	return res.json({
		total: feedback.length,
		averageRating: Number(avg.toFixed(2)),
		feedback,
	});
	} catch (error) {
		return res.status(500).json({ message: "Failed to list feedback", error: error.message });
	}
};

module.exports = {
	submitFeedback,
	listFeedback,
};
