const createEvent = ({ title, venue, date, organizer }) => ({
	id: null,
	title,
	venue,
	date,
	organizer,
	createdAt: new Date().toISOString(),
});

module.exports = {
	createEvent,
};
