const createCourse = ({ code, name, credits = 3, department = "CSE" }) => ({
	id: null,
	code,
	name,
	credits,
	department,
	createdAt: new Date().toISOString(),
});

module.exports = {
	createCourse,
};
