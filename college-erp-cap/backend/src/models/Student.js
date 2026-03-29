const createStudent = ({ name, email, rollNo, department, batch, idCardPhoto = null }) => ({
	id: null,
	name,
	email,
	rollNo,
	department,
	batch,
	idCardPhoto, // { url, publicId } or null
	role: "student",
	createdAt: new Date().toISOString(),
});

module.exports = {
	createStudent,
};
