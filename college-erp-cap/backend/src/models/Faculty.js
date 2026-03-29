
const createFaculty = ({ name, email, department, employeeCode, idCardPhoto }) => ({
  id: null,
  name,
  email,
  department,
  employeeCode,
  role: "faculty",
  createdAt: new Date().toISOString(),
  idCardPhoto: idCardPhoto || { url: '', publicId: '' },
});

module.exports = {
	createFaculty,
};
