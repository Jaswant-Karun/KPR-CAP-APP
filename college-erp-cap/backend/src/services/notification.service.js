const notifications = [];

const createNotification = ({ userId, title, message, type = "info" }) => {
	const notification = {
		id: notifications.length + 1,
		userId: userId || null,
		title: String(title || "Notification"),
		message: String(message || ""),
		type,
		read: false,
		createdAt: new Date().toISOString(),
	};

	notifications.push(notification);
	return notification;
};

const getNotificationsByUser = (userId) => {
	return notifications.filter((item) => item.userId === userId || item.userId === null);
};

module.exports = {
	createNotification,
	getNotificationsByUser,
};
