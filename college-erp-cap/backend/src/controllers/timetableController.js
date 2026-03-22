const {
  getDayTimetable,
  getWeekTimetable: fetchWeekRows,
  upsertTimetableEntries,
} = require("../config/db");

const DAY_NAME_TO_INDEX = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
};

const normalizeDay = (value) => {
	if (typeof value === "number") {
		return value >= 0 && value <= 6 ? value : null;
	}

	if (typeof value === "string") {
		const lowered = value.trim().toLowerCase();
		if (DAY_NAME_TO_INDEX[lowered] !== undefined) {
			return DAY_NAME_TO_INDEX[lowered];
		}

		const asNumber = Number(lowered);
		if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber <= 6) {
			return asNumber;
		}
	}

	return null;
};

const asNullableAudienceId = (value) => {
	if (value === undefined || value === null || value === "") {
		return null;
	}
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
};

const mapTimetableRow = (row) => ({
	id: row.id,
	dayOfWeek: row.day_of_week,
	periodNo: row.period_no,
	subjectName: row.subject_name,
	startTime: row.start_time,
	endTime: row.end_time,
	room: row.room,
	facultyName: row.faculty_name,
});

const fetchByDay = async ({ audienceType, audienceId, dayOfWeek }) => {
	const rows = await getDayTimetable({ audienceType, audienceId, dayOfWeek });
	return rows.map(mapTimetableRow);
};

const fetchWeek = async ({ audienceType, audienceId }) => {
	const rows = await fetchWeekRows({ audienceType, audienceId });
	return rows.map(mapTimetableRow);
};

const getTodayTimetable = async (req, res) => {
	try {
		const audienceType = req.params.audienceType || req.query.audienceType;
		const audienceId = asNullableAudienceId(req.params.audienceId || req.query.audienceId);

		if (!["student", "faculty"].includes(audienceType)) {
			return res.status(400).json({ message: "audienceType must be student or faculty" });
		}

		const now = new Date();
		const today = now.getDay();
		const periods = await fetchByDay({ audienceType, audienceId, dayOfWeek: today });

		return res.json({
			dayOfWeek: today,
			periods,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch today's timetable", error: error.message });
	}
};

const getWeekTimetable = async (req, res) => {
	try {
		const audienceType = req.params.audienceType || req.query.audienceType;
		const audienceId = asNullableAudienceId(req.params.audienceId || req.query.audienceId);

		if (!["student", "faculty"].includes(audienceType)) {
			return res.status(400).json({ message: "audienceType must be student or faculty" });
		}

		const rows = await fetchWeek({ audienceType, audienceId });
		return res.json({ timetable: rows });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch weekly timetable", error: error.message });
	}
};

const upsertWeekTimetable = async (req, res) => {
	try {
		const { audienceType, audienceId, entries } = req.body;
		if (!["student", "faculty"].includes(audienceType)) {
			return res.status(400).json({ message: "audienceType must be student or faculty" });
		}
		if (!Array.isArray(entries) || entries.length === 0) {
			return res.status(400).json({ message: "entries must be a non-empty array" });
		}

		const normalizedAudienceId = asNullableAudienceId(audienceId);

		const normalizedEntries = [];
		for (const entry of entries) {
			const dayOfWeek = normalizeDay(entry.dayOfWeek);
			const periodNo = Number(entry.periodNo);
			if (dayOfWeek === null || Number.isNaN(periodNo)) {
				return res.status(400).json({ message: "Invalid dayOfWeek or periodNo in entries" });
			}
			normalizedEntries.push({
				dayOfWeek,
				periodNo,
				subjectName: entry.subjectName,
				startTime: entry.startTime || null,
				endTime: entry.endTime || null,
				room: entry.room || null,
				facultyName: entry.facultyName || null,
			});
		}

		await upsertTimetableEntries({
			audienceType,
			audienceId: normalizedAudienceId,
			entries: normalizedEntries,
		});

		const updated = await fetchWeek({
			audienceType,
			audienceId: normalizedAudienceId,
		});

		return res.json({ message: "Timetable saved", timetable: updated });
	} catch (error) {
		return res.status(500).json({ message: "Failed to save timetable", error: error.message });
	}
};

module.exports = {
	getTodayTimetable,
	getWeekTimetable,
	upsertWeekTimetable,
};
