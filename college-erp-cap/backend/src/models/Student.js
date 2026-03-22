const createStudent = ({ name, email, rollNo, department, batch }) => ({
	id: null,
	name,
	email,
	rollNo,
	department,
	batch,
	role: "student",
	createdAt: new Date().toISOString(),
});

module.exports = {
	createStudent,
};
