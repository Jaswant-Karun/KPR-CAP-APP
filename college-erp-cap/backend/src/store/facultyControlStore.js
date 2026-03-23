const facultyControlMaps = new Map();

const normalizeStudentIds = (studentIds = []) => {
  if (!Array.isArray(studentIds)) return [];
  return [...new Set(studentIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id) && id > 0))];
};

const setFacultyControlMap = ({ facultyId, batch, section, studentIds }) => {
  const safeFacultyId = Number(facultyId);
  if (Number.isNaN(safeFacultyId) || safeFacultyId <= 0) {
    throw new Error("Invalid facultyId");
  }

  const map = {
    facultyId: safeFacultyId,
    batch: batch ? String(batch).trim() : null,
    section: section ? String(section).trim() : null,
    studentIds: normalizeStudentIds(studentIds),
    updatedAt: new Date().toISOString(),
  };

  facultyControlMaps.set(safeFacultyId, map);
  return map;
};

const getFacultyControlMap = (facultyId) => {
  const safeFacultyId = Number(facultyId);
  if (Number.isNaN(safeFacultyId) || safeFacultyId <= 0) {
    return null;
  }
  return facultyControlMaps.get(safeFacultyId) || null;
};

module.exports = {
  setFacultyControlMap,
  getFacultyControlMap,
};
