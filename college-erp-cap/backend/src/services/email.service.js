const sendMail = async ({ to, subject, text, html }) => {
	if (!to || !subject) {
		throw new Error("to and subject are required");
	}

	return {
		provider: "mock-mailer",
		accepted: [to],
		subject,
		text: text || "",
		html: html || "",
		sentAt: new Date().toISOString(),
	};
};

module.exports = {
	sendMail,
};
