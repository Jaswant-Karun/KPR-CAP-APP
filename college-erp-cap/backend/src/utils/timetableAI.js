const getDayWiseTimetable = (rows = [], dayOfWeek = new Date().getDay()) => {
	return rows
		.filter((row) => Number(row.dayOfWeek) === Number(dayOfWeek))
		.sort((a, b) => Number(a.periodNo) - Number(b.periodNo));
};

module.exports = {
	getDayWiseTimetable,
};
