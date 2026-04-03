const { pool } = require("../config/db");

const createNotification = async ({ userId, title, message, type = "info" }) => {
	const inserted = await pool.query(
		`INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
		 VALUES ($1, $2, $3, $4, FALSE, NOW())
		 RETURNING id, user_id, title, message, type, is_read, created_at`,
		[userId || null, String(title || "Notification"), String(message || ""), String(type || "info")]
	);

	const row = inserted.rows[0];
	return {
		id: row.id,
		userId: row.user_id,
		title: row.title,
		message: row.message,
		type: row.type,
		read: row.is_read,
		createdAt: row.created_at,
	};
};

const getNotificationsByUser = async (userId) => {
	const result = await pool.query(
		`SELECT id, user_id, title, message, type, is_read, created_at
		 FROM notifications
		 WHERE user_id = $1 OR user_id IS NULL
		 ORDER BY created_at DESC
		 LIMIT 200`,
		[userId || null]
	);

	return result.rows.map((row) => ({
		id: row.id,
		userId: row.user_id,
		title: row.title,
		message: row.message,
		type: row.type,
		read: row.is_read,
		createdAt: row.created_at,
	}));
};

module.exports = {
	createNotification,
	getNotificationsByUser,
};
