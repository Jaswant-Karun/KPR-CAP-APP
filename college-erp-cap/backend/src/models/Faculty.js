const createFaculty = ({ name, email, department, employeeCode }) => ({
	id: null,
	name,
	email,
	department,
	employeeCode,
	role: "faculty",
	createdAt: new Date().toISOString(),
});

module.exports = {
	createFaculty,
};
