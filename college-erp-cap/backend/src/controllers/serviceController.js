const { validateServiceRequest } = require("../validations/student.validation");
const { pool, dbState } = require("../config/db");
const { uploadFile } = require("../services/storage.service");

const serviceRequests = [];
let nextServiceRequestId = 1;
const gatepassRequests = [];
let nextGatepassId = 1;
const aoServiceBookings = [];
let nextAoBookingId = 1;
const fusionSpaceBookings = [];
let nextFusionBookingId = 1;
const events = [];
let nextEventId = 1;
const eventRegistrations = [];
let nextEventRegistrationId = 1;
const hallTickets = [];
let nextHallTicketId = 1;
const hallTicketAudit = [];
let nextHallTicketAuditId = 1;
const latecomerRequests = [];
let nextLatecomerId = 1;
const waiverRequests = [
	{
		id: 1,
		ticket: "WVR-2401",
		status: "approved",
		studentId: 2,
		student: "Student User",
		serial: "24CB023",
		acy: "2025-2026",
		sem: "III",
		type: "Tuition",
		courses: "CS301, CS302",
		grade: "A",
		point: 8.9,
		credit: 4,
		department: "CSE",
		batch: "2024-2028",
		section: "A",
		active: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 2,
		ticket: "WVR-2402",
		status: "in-review",
		studentId: 2,
		student: "Student User",
		serial: "24CB023",
		acy: "2025-2026",
		sem: "III",
		type: "Exam",
		courses: "MA302",
		grade: "B+",
		point: 8.0,
		credit: 3,
		department: "CSE",
		batch: "2024-2028",
		section: "A",
		active: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 3,
		ticket: "WVR-2392",
		status: "pending",
		studentId: 4,
		student: "Nivetha R",
		serial: "23CB066",
		acy: "2024-2025",
		sem: "V",
		type: "Arrear",
		courses: "CS501",
		grade: "B",
		point: 7.5,
		credit: 3,
		department: "CSE",
		batch: "2023-2027",
		section: "B",
		active: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 4,
		ticket: "WVR-2358",
		status: "rejected",
		studentId: 5,
		student: "Karthik P",
		serial: "22EC041",
		acy: "2023-2024",
		sem: "VI",
		type: "Condonation",
		courses: "EC604",
		grade: "C+",
		point: 6.8,
		credit: 2,
		department: "ECE",
		batch: "2022-2026",
		section: "C",
		active: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

const mapHallTicketRow = (row) => ({
	id: row.id,
	ticketNo: row.ticket_no,
	studentId: row.student_id,
	studentName: row.student_name,
	rollNo: row.roll_no,
	residentType: row.resident_type || "day-scholar",
	fileName: row.file_name,
	fileUrl: row.file_url,
	filePublicId: row.file_public_id,
	fileProvider: row.file_provider,
	uploadedBy: row.uploaded_by,
	uploadedByName: row.uploaded_by_name,
	status: row.status,
	remarks: row.remarks,
	verifiedBy: row.verified_by,
	verifiedByName: row.verified_by_name,
	verifiedAt: row.verified_at,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const mapHallTicketAuditRow = (row) => ({
	id: row.id,
	hallTicketId: row.hall_ticket_id,
	ticketNo: row.ticket_no,
	studentId: row.student_id,
	action: row.action,
	actorId: row.actor_id,
	actorRole: row.actor_role,
	actorName: row.actor_name,
	remarks: row.remarks,
	createdAt: row.created_at,
});

const normalizeStoredFile = (stored = {}) => ({
	url: stored?.url || stored?.secure_url || null,
	publicId: stored?.publicId || stored?.public_id || null,
	provider: stored?.provider || "unknown",
});

const normalizeResidentType = (value) => {
	const raw = String(value || "").trim().toLowerCase();
	if (raw === "hosteller" || raw === "hostel" || raw === "hosteller-student") {
		return "hosteller";
	}
	return "day-scholar";
};

const normalizeGatepassCategory = (value) => {
	const raw = String(value || "").trim().toLowerCase();
	if (["hosteller", "hostel"].includes(raw)) return "hosteller";
	if (["lateral", "lat"].includes(raw)) return "lateral";
	return "day-scholar";
};

const normalizeGatepassType = (value) => {
	const raw = String(value || "").trim().toLowerCase();
	if (raw === "free outing" || raw === "free-outing") return "Free Outing";
	return "Gate Pass";
};

const mapLatecomerRow = (row) => ({
	id: row.id,
	ticketNo: row.ticket_no,
	studentId: row.student_id,
	studentName: row.student_name,
	rollNo: row.roll_no,
	department: row.department,
	arrivedAt: row.arrived_at,
	reason: row.reason,
	status: row.status,
	remarks: row.remarks,
	approvedBy: row.approved_by,
	approvedByName: row.approved_by_name,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const normalizeEventType = (value) => {
	const raw = String(value || "").trim().toLowerCase();
	if (["club", "club_community", "club-community", "community"].includes(raw)) {
		return "club_community";
	}
	return "local_department";
};

const mapEventRow = (row, registrationCount = 0, isRegistered = false) => ({
	id: row.id,
	ticket: row.ticket_no,
	eventName: row.event_name,
	venue: row.venue,
	eventDateTime: row.event_datetime,
	department: row.department || "General",
	eventType: row.event_type,
	maxParticipants: Number(row.max_participants || 0),
	registeredCount: Number(registrationCount || 0),
	vacancy: Math.max(Number(row.max_participants || 0) - Number(registrationCount || 0), 0),
	posterUrl: row.poster_url || "",
	createdBy: row.created_by,
	createdByName: row.created_by_name || "",
	createdByRole: row.created_by_role || "",
	isRegistered: Boolean(isRegistered),
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const uploadEventPoster = async (req, eventId) => {
	if (!req.upload?.buffer) return null;
	const stored = await uploadFile({
		buffer: req.upload.buffer,
		filename: req.upload.originalname || `event-poster-${Date.now()}`,
		folder: `kpr-erp/events/${eventId || "general"}`,
	});
	return stored?.url || stored?.secure_url || null;
};

const canManageEvent = (user, row) => {
	const role = String(user?.role || "").toLowerCase();
	if (role === "admin") return true;
	if (role === "faculty") {
		return row?.event_type === "local_department" && Number(row?.created_by || 0) === Number(user?.id || 0);
	}
	return false;
};

const insertHallTicketAudit = async ({ hallTicketId, ticketNo, studentId, action, actor, remarks }) => {
	if (dbState.mode === "postgres") {
		const result = await pool.query(
			`INSERT INTO hall_ticket_audit
				(hall_ticket_id, ticket_no, student_id, action, actor_id, actor_role, actor_name, remarks, created_at)
			 VALUES
				($1, $2, $3, $4, $5, $6, $7, $8, NOW())
			 RETURNING *`,
			[
				hallTicketId || null,
				ticketNo || null,
				studentId || null,
				action,
				actor?.id || null,
				actor?.role || null,
				actor?.name || actor?.email || null,
				remarks || null,
			]
		);

		return mapHallTicketAuditRow(result.rows[0]);
	}

	const row = {
		id: nextHallTicketAuditId++,
		hallTicketId: hallTicketId || null,
		ticketNo: ticketNo || null,
		studentId: studentId || null,
		action,
		actorId: actor?.id || null,
		actorRole: actor?.role || null,
		actorName: actor?.name || actor?.email || null,
		remarks: remarks || null,
		createdAt: new Date().toISOString(),
	};

	hallTicketAudit.unshift(row);
	if (hallTicketAudit.length > 500) {
		hallTicketAudit.length = 500;
	}

	return row;
};

const createHallTicket = async (req, res) => {
	try {
		const studentId = Number(req.body?.studentId || 0);
		const residentType = normalizeResidentType(req.body?.residentType);
		if (!Number.isFinite(studentId) || studentId <= 0) {
			return res.status(400).json({ message: "Valid studentId is required" });
		}

		if (!req.upload?.buffer) {
			return res.status(400).json({ message: "Hall ticket file is required" });
		}

		if (dbState.mode === "postgres") {
			const studentResult = await pool.query(
				`SELECT id, name, roll_no FROM users WHERE id = $1 AND role = 'student' LIMIT 1`,
				[studentId]
			);

			if (studentResult.rows.length === 0) {
				return res.status(404).json({ message: "Student not found" });
			}

			const student = studentResult.rows[0];
			const stored = await uploadFile({
				buffer: req.upload.buffer,
				filename: req.upload.originalname || `hall-ticket-${Date.now()}.pdf`,
				folder: `kpr-erp/hall-tickets/${studentId}`,
			});
			const uploaded = normalizeStoredFile(stored);

			if (!uploaded.url) {
				return res.status(500).json({ message: "Storage provider did not return a valid file URL" });
			}

			const existingTicketResult = await pool.query(
				`SELECT id, ticket_no, student_id FROM hall_tickets WHERE student_id = $1 ORDER BY updated_at DESC, id DESC LIMIT 1`,
				[student.id]
			);

			if (existingTicketResult.rows.length > 0) {
				const existing = existingTicketResult.rows[0];
				const updated = await pool.query(
					`UPDATE hall_tickets
					 SET student_name = $1,
							 roll_no = $2,
							 resident_type = $3,
							 file_name = $4,
							 file_url = $5,
							 file_public_id = $6,
							 file_provider = $7,
							 uploaded_by = $8,
							 uploaded_by_name = $9,
							 status = 'pending',
							 remarks = NULL,
							 verified_by = NULL,
							 verified_by_name = NULL,
							 verified_at = NULL,
							 updated_at = NOW()
					 WHERE id = $10
					 RETURNING *`,
					[
						student.name || "Student",
						student.roll_no || null,
						residentType,
						req.upload.originalname || `hall-ticket-${Date.now()}.pdf`,
						uploaded.url,
						uploaded.publicId,
						uploaded.provider,
						req.user?.id || null,
						req.user?.name || req.user?.email || "Admin",
						existing.id,
					]
				);

				await insertHallTicketAudit({
					hallTicketId: existing.id,
					ticketNo: existing.ticket_no,
					studentId: existing.student_id,
					action: "replaced",
					actor: req.user,
					remarks: "Hall ticket auto-replaced by admin upload",
				});

				return res.status(200).json({
					message: "Existing hall ticket replaced",
					hallTicket: mapHallTicketRow(updated.rows[0]),
				});
			}

			const nextIdResult = await pool.query(
				"SELECT nextval(pg_get_serial_sequence('hall_tickets', 'id')) AS id"
			);
			const nextId = Number(nextIdResult.rows[0].id);
			const ticketNo = `HT-${String(nextId).padStart(5, "0")}`;

			const inserted = await pool.query(
				`INSERT INTO hall_tickets
					(id, ticket_no, student_id, student_name, roll_no, resident_type, file_name, file_url, file_public_id, file_provider, uploaded_by, uploaded_by_name, status, created_at, updated_at)
				 VALUES
					($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', NOW(), NOW())
				 RETURNING *`,
				[
					nextId,
					ticketNo,
					student.id,
					student.name || "Student",
					student.roll_no || null,
					residentType,
					req.upload.originalname || `hall-ticket-${Date.now()}.pdf`,
					uploaded.url,
					uploaded.publicId,
					uploaded.provider,
					req.user?.id || null,
					req.user?.name || req.user?.email || "Admin",
				]
			);

			await insertHallTicketAudit({
				hallTicketId: inserted.rows[0].id,
				ticketNo,
				studentId: student.id,
				action: "uploaded",
				actor: req.user,
				remarks: "Hall ticket created by admin",
			});

			return res.status(201).json({
				message: "Hall ticket uploaded",
				hallTicket: mapHallTicketRow(inserted.rows[0]),
			});
		}

		const existingIndex = hallTickets.findIndex((item) => Number(item.studentId) === studentId);
		if (existingIndex >= 0) {
			const target = hallTickets[existingIndex];
			target.studentName = req.body?.studentName || target.studentName || "Student";
			target.rollNo = req.body?.rollNo || target.rollNo || null;
			target.residentType = residentType;
			target.fileName = req.upload.originalname || `hall-ticket-${Date.now()}.pdf`;
			target.uploadedBy = req.user?.id || null;
			target.uploadedByName = req.user?.name || req.user?.email || "Admin";
			target.status = "pending";
			target.remarks = "";
			target.verifiedBy = null;
			target.verifiedByName = null;
			target.verifiedAt = null;
			target.updatedAt = new Date().toISOString();

			await insertHallTicketAudit({
				hallTicketId: target.id,
				ticketNo: target.ticketNo,
				studentId: target.studentId,
				action: "replaced",
				actor: req.user,
				remarks: "Hall ticket auto-replaced by admin upload",
			});

			return res.status(200).json({ message: "Existing hall ticket replaced", hallTicket: target });
		}

		const id = nextHallTicketId++;
		const ticket = {
			id,
			ticketNo: `HT-${String(id).padStart(5, "0")}`,
			studentId,
			studentName: req.body?.studentName || "Student",
			rollNo: req.body?.rollNo || null,
			residentType,
			fileName: req.upload.originalname || `hall-ticket-${Date.now()}.pdf`,
			fileUrl: `about:blank#hall-ticket-${id}`,
			filePublicId: null,
			fileProvider: "memory",
			uploadedBy: req.user?.id || null,
			uploadedByName: req.user?.name || req.user?.email || "Admin",
			status: "pending",
			remarks: "",
			verifiedBy: null,
			verifiedByName: null,
			verifiedAt: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		hallTickets.unshift(ticket);
		await insertHallTicketAudit({
			hallTicketId: ticket.id,
			ticketNo: ticket.ticketNo,
			studentId: ticket.studentId,
			action: "uploaded",
			actor: req.user,
			remarks: "Hall ticket created by admin",
		});
		return res.status(201).json({ message: "Hall ticket uploaded", hallTicket: ticket });
	} catch (error) {
		console.error("Error creating hall ticket:", error.message);
		return res.status(500).json({ message: "Failed to upload hall ticket", error: error.message });
	}
};

const listHallTickets = async (req, res) => {
	try {
		const role = req.user?.role;
		const userId = Number(req.user?.id || 0);
		const query = req.query || {};
		const studentId = Number(query.studentId || 0);
		const status = String(query.status || "").trim().toLowerCase();
		const search = String(query.search || "").trim().toLowerCase();
		const residentType = normalizeResidentType(query.residentType || "");
		const hasResidentTypeFilter = ["day-scholar", "hosteller"].includes(String(query.residentType || "").trim().toLowerCase());

		if (dbState.mode === "postgres") {
			const where = [];
			const values = [];

			if (role === "student") {
				values.push(userId);
				where.push(`student_id = $${values.length}`);
			} else if (studentId > 0) {
				values.push(studentId);
				where.push(`student_id = $${values.length}`);
			}

			if (status && ["pending", "verified", "rejected"].includes(status)) {
				values.push(status);
				where.push(`status = $${values.length}`);
			}

			if (hasResidentTypeFilter) {
				values.push(residentType);
				where.push(`COALESCE(resident_type, 'day-scholar') = $${values.length}`);
			}

			if (search) {
				values.push(`%${search}%`);
				where.push(`(
					COALESCE(ticket_no, '') ILIKE $${values.length}
					OR COALESCE(student_name, '') ILIKE $${values.length}
					OR COALESCE(roll_no, '') ILIKE $${values.length}
					OR COALESCE(file_name, '') ILIKE $${values.length}
				)`);
			}

			const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
			const result = await pool.query(
				`SELECT * FROM hall_tickets ${whereSql} ORDER BY created_at DESC LIMIT 500`,
				values
			);

			const tickets = result.rows.map(mapHallTicketRow);
			return res.json({ total: tickets.length, hallTickets: tickets });
		}

		let rows = [...hallTickets];
		if (role === "student") {
			rows = rows.filter((item) => Number(item.studentId) === userId);
		} else if (studentId > 0) {
			rows = rows.filter((item) => Number(item.studentId) === studentId);
		}

		if (["pending", "verified", "rejected"].includes(status)) {
			rows = rows.filter((item) => String(item.status) === status);
		}

		if (hasResidentTypeFilter) {
			rows = rows.filter((item) => normalizeResidentType(item.residentType) === residentType);
		}

		if (search) {
			rows = rows.filter((item) => {
				return (
					String(item.ticketNo || "").toLowerCase().includes(search) ||
					String(item.studentName || "").toLowerCase().includes(search) ||
					String(item.rollNo || "").toLowerCase().includes(search) ||
					String(item.fileName || "").toLowerCase().includes(search)
				);
			});
		}

		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return res.json({ total: rows.length, hallTickets: rows });
	} catch (error) {
		console.error("Error listing hall tickets:", error.message);
		return res.status(500).json({ message: "Failed to list hall tickets", error: error.message });
	}
};

const downloadHallTicket = async (req, res) => {
	try {
		const hallTicketId = Number(req.params.hallTicketId);
		if (!Number.isFinite(hallTicketId) || hallTicketId <= 0) {
			return res.status(400).json({ message: "Invalid hall ticket id" });
		}

		if (dbState.mode === "postgres") {
			const result = await pool.query(`SELECT * FROM hall_tickets WHERE id = $1 LIMIT 1`, [hallTicketId]);
			if (result.rows.length === 0) {
				return res.status(404).json({ message: "Hall ticket not found" });
			}

			const ticket = mapHallTicketRow(result.rows[0]);
			if (req.user?.role === "student" && Number(ticket.studentId) !== Number(req.user?.id)) {
				return res.status(403).json({ message: "Not allowed to access this hall ticket" });
			}

			await insertHallTicketAudit({
				hallTicketId: ticket.id,
				ticketNo: ticket.ticketNo,
				studentId: ticket.studentId,
				action: "downloaded",
				actor: req.user,
				remarks: "Hall ticket download/view request",
			});

			return res.json({
				message: "Hall ticket ready",
				hallTicket: ticket,
			});
		}

		const ticket = hallTickets.find((item) => Number(item.id) === hallTicketId);
		if (!ticket) {
			return res.status(404).json({ message: "Hall ticket not found" });
		}

		if (req.user?.role === "student" && Number(ticket.studentId) !== Number(req.user?.id)) {
			return res.status(403).json({ message: "Not allowed to access this hall ticket" });
		}

		await insertHallTicketAudit({
			hallTicketId: ticket.id,
			ticketNo: ticket.ticketNo,
			studentId: ticket.studentId,
			action: "downloaded",
			actor: req.user,
			remarks: "Hall ticket download/view request",
		});

		return res.json({ message: "Hall ticket ready", hallTicket: ticket });
	} catch (error) {
		console.error("Error downloading hall ticket:", error.message);
		return res.status(500).json({ message: "Failed to load hall ticket", error: error.message });
	}
};

const verifyHallTicket = async (req, res) => {
	try {
		const hallTicketId = Number(req.params.hallTicketId);
		if (!Number.isFinite(hallTicketId) || hallTicketId <= 0) {
			return res.status(400).json({ message: "Invalid hall ticket id" });
		}

		const status = String(req.body?.status || "").trim().toLowerCase();
		if (!["verified", "rejected"].includes(status)) {
			return res.status(400).json({ message: "status must be verified or rejected" });
		}

		const remarks = String(req.body?.remarks || "").trim();

		if (dbState.mode === "postgres") {
			const check = await pool.query(`SELECT * FROM hall_tickets WHERE id = $1 LIMIT 1`, [hallTicketId]);
			if (check.rows.length === 0) {
				return res.status(404).json({ message: "Hall ticket not found" });
			}

			const updated = await pool.query(
				`UPDATE hall_tickets
				 SET status = $1,
						 remarks = $2,
						 verified_by = $3,
						 verified_by_name = $4,
						 verified_at = NOW(),
						 updated_at = NOW()
				 WHERE id = $5
				 RETURNING *`,
				[
					status,
					remarks || null,
					req.user?.id || null,
					req.user?.name || req.user?.email || "Faculty",
					hallTicketId,
				]
			);

			await insertHallTicketAudit({
				hallTicketId: updated.rows[0].id,
				ticketNo: updated.rows[0].ticket_no,
				studentId: updated.rows[0].student_id,
				action: status,
				actor: req.user,
				remarks: remarks || `Hall ticket ${status}`,
			});

			return res.json({
				message: "Hall ticket verification updated",
				hallTicket: mapHallTicketRow(updated.rows[0]),
			});
		}

		const target = hallTickets.find((item) => Number(item.id) === hallTicketId);
		if (!target) {
			return res.status(404).json({ message: "Hall ticket not found" });
		}

		target.status = status;
		target.remarks = remarks;
		target.verifiedBy = req.user?.id || null;
		target.verifiedByName = req.user?.name || req.user?.email || "Faculty";
		target.verifiedAt = new Date().toISOString();
		target.updatedAt = new Date().toISOString();
		await insertHallTicketAudit({
			hallTicketId: target.id,
			ticketNo: target.ticketNo,
			studentId: target.studentId,
			action: status,
			actor: req.user,
			remarks: remarks || `Hall ticket ${status}`,
		});

		return res.json({ message: "Hall ticket verification updated", hallTicket: target });
	} catch (error) {
		console.error("Error verifying hall ticket:", error.message);
		return res.status(500).json({ message: "Failed to verify hall ticket", error: error.message });
	}
};

const replaceHallTicket = async (req, res) => {
	try {
		const hallTicketId = Number(req.params.hallTicketId);
		if (!Number.isFinite(hallTicketId) || hallTicketId <= 0) {
			return res.status(400).json({ message: "Invalid hall ticket id" });
		}

		if (!req.upload?.buffer) {
			return res.status(400).json({ message: "Replacement file is required" });
		}

		if (dbState.mode === "postgres") {
			const current = await pool.query(`SELECT * FROM hall_tickets WHERE id = $1 LIMIT 1`, [hallTicketId]);
			if (current.rows.length === 0) {
				return res.status(404).json({ message: "Hall ticket not found" });
			}

			const ticket = current.rows[0];
			const stored = await uploadFile({
				buffer: req.upload.buffer,
				filename: req.upload.originalname || `hall-ticket-${Date.now()}.pdf`,
				folder: `kpr-erp/hall-tickets/${ticket.student_id}`,
			});
			const uploaded = normalizeStoredFile(stored);

			if (!uploaded.url) {
				return res.status(500).json({ message: "Storage provider did not return a valid file URL" });
			}

			const updated = await pool.query(
				`UPDATE hall_tickets
				 SET file_name = $1,
						 file_url = $2,
						 file_public_id = $3,
						 file_provider = $4,
						 uploaded_by = $5,
						 uploaded_by_name = $6,
						 status = 'pending',
						 remarks = NULL,
						 verified_by = NULL,
						 verified_by_name = NULL,
						 verified_at = NULL,
						 updated_at = NOW()
				 WHERE id = $7
				 RETURNING *`,
				[
					req.upload.originalname || `hall-ticket-${Date.now()}.pdf`,
					uploaded.url,
					uploaded.publicId,
					uploaded.provider,
					req.user?.id || null,
					req.user?.name || req.user?.email || "Admin",
					hallTicketId,
				]
			);

			await insertHallTicketAudit({
				hallTicketId: updated.rows[0].id,
				ticketNo: updated.rows[0].ticket_no,
				studentId: updated.rows[0].student_id,
				action: "replaced",
				actor: req.user,
				remarks: "Hall ticket file replaced by admin",
			});

			return res.json({ message: "Hall ticket replaced", hallTicket: mapHallTicketRow(updated.rows[0]) });
		}

		const target = hallTickets.find((item) => Number(item.id) === hallTicketId);
		if (!target) {
			return res.status(404).json({ message: "Hall ticket not found" });
		}

		target.fileName = req.upload.originalname || `hall-ticket-${Date.now()}.pdf`;
		target.status = "pending";
		target.remarks = "";
		target.verifiedBy = null;
		target.verifiedByName = null;
		target.verifiedAt = null;
		target.updatedAt = new Date().toISOString();

		await insertHallTicketAudit({
			hallTicketId: target.id,
			ticketNo: target.ticketNo,
			studentId: target.studentId,
			action: "replaced",
			actor: req.user,
			remarks: "Hall ticket file replaced by admin",
		});

		return res.json({ message: "Hall ticket replaced", hallTicket: target });
	} catch (error) {
		console.error("Error replacing hall ticket:", error.message);
		return res.status(500).json({ message: "Failed to replace hall ticket", error: error.message });
	}
};

const deleteHallTicket = async (req, res) => {
	try {
		const hallTicketId = Number(req.params.hallTicketId);
		if (!Number.isFinite(hallTicketId) || hallTicketId <= 0) {
			return res.status(400).json({ message: "Invalid hall ticket id" });
		}

		if (dbState.mode === "postgres") {
			const current = await pool.query(`SELECT * FROM hall_tickets WHERE id = $1 LIMIT 1`, [hallTicketId]);
			if (current.rows.length === 0) {
				return res.status(404).json({ message: "Hall ticket not found" });
			}

			const row = current.rows[0];
			await pool.query(`DELETE FROM hall_tickets WHERE id = $1`, [hallTicketId]);

			await insertHallTicketAudit({
				hallTicketId,
				ticketNo: row.ticket_no,
				studentId: row.student_id,
				action: "deleted",
				actor: req.user,
				remarks: "Hall ticket deleted by admin",
			});

			return res.json({ message: "Hall ticket deleted" });
		}

		const index = hallTickets.findIndex((item) => Number(item.id) === hallTicketId);
		if (index < 0) {
			return res.status(404).json({ message: "Hall ticket not found" });
		}

		const row = hallTickets[index];
		hallTickets.splice(index, 1);

		await insertHallTicketAudit({
			hallTicketId,
			ticketNo: row.ticketNo,
			studentId: row.studentId,
			action: "deleted",
			actor: req.user,
			remarks: "Hall ticket deleted by admin",
		});

		return res.json({ message: "Hall ticket deleted" });
	} catch (error) {
		console.error("Error deleting hall ticket:", error.message);
		return res.status(500).json({ message: "Failed to delete hall ticket", error: error.message });
	}
};

const listHallTicketAudit = async (req, res) => {
	try {
		const query = req.query || {};
		const hallTicketId = Number(query.hallTicketId || 0);
		const studentId = Number(query.studentId || 0);

		if (dbState.mode === "postgres") {
			const where = [];
			const values = [];

			if (hallTicketId > 0) {
				values.push(hallTicketId);
				where.push(`hall_ticket_id = $${values.length}`);
			}

			if (studentId > 0) {
				values.push(studentId);
				where.push(`student_id = $${values.length}`);
			}

			const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
			const result = await pool.query(
				`SELECT * FROM hall_ticket_audit ${whereSql} ORDER BY created_at DESC LIMIT 300`,
				values
			);

			return res.json({
				total: result.rows.length,
				audit: result.rows.map(mapHallTicketAuditRow),
			});
		}

		let rows = [...hallTicketAudit];
		if (hallTicketId > 0) {
			rows = rows.filter((item) => Number(item.hallTicketId) === hallTicketId);
		}
		if (studentId > 0) {
			rows = rows.filter((item) => Number(item.studentId) === studentId);
		}

		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return res.json({ total: rows.length, audit: rows.slice(0, 300) });
	} catch (error) {
		console.error("Error listing hall ticket audit:", error.message);
		return res.status(500).json({ message: "Failed to load hall ticket audit", error: error.message });
	}
};

const listWaiverRequests = async (req, res) => {
	try {
		const role = req.user?.role;
		const userId = Number(req.user?.id || 0);
		const query = req.query || {};

		const search = String(query.search || "").trim().toLowerCase();
		const acy = String(query.acy || "all").trim();
		const sem = String(query.sem || "all").trim();
		const type = String(query.type || "all").trim();
		const department = String(query.department || "all").trim();
		const batch = String(query.batch || "all").trim();
		const section = String(query.section || "all").trim();
		const active = String(query.active || "all").trim().toLowerCase();

		if (dbState.mode === "postgres") {
			const scopeWhere = [];
			const scopeParams = [];

			if (role === "student") {
				scopeParams.push(userId);
				scopeWhere.push(`student_id = $${scopeParams.length}`);
			}

			let dataQuery = "SELECT * FROM waiver_requests";
			const dataWhere = [...scopeWhere];
			const dataParams = [...scopeParams];

			if (acy !== "all") {
				dataParams.push(acy);
				dataWhere.push(`acy = $${dataParams.length}`);
			}
			if (sem !== "all") {
				dataParams.push(sem);
				dataWhere.push(`sem = $${dataParams.length}`);
			}
			if (type !== "all") {
				dataParams.push(type);
				dataWhere.push(`waiver_type = $${dataParams.length}`);
			}
			if (department !== "all") {
				dataParams.push(department);
				dataWhere.push(`department = $${dataParams.length}`);
			}
			if (batch !== "all") {
				dataParams.push(batch);
				dataWhere.push(`batch = $${dataParams.length}`);
			}
			if (section !== "all") {
				dataParams.push(section);
				dataWhere.push(`section = $${dataParams.length}`);
			}
			if (active === "true") {
				dataWhere.push("is_active = TRUE");
			}
			if (active === "false") {
				dataWhere.push("is_active = FALSE");
			}
			if (search) {
				dataParams.push(`%${search}%`);
				dataWhere.push(`(
					ticket_no ILIKE $${dataParams.length}
					OR COALESCE(student_name, '') ILIKE $${dataParams.length}
					OR COALESCE(serial_no, '') ILIKE $${dataParams.length}
					OR COALESCE(courses, '') ILIKE $${dataParams.length}
				)`);
			}

			if (dataWhere.length > 0) {
				dataQuery += ` WHERE ${dataWhere.join(" AND ")}`;
			}
			dataQuery += " ORDER BY created_at DESC";

			const dataResult = await pool.query(dataQuery, dataParams);
			const waivers = dataResult.rows.map((row) => ({
				id: row.id,
				ticket: row.ticket_no,
				status: row.status,
				studentId: row.student_id,
				student: row.student_name,
				serial: row.serial_no,
				acy: row.acy,
				sem: row.sem,
				type: row.waiver_type,
				courses: row.courses,
				grade: row.grade,
				point: row.point === null ? null : Number(row.point),
				credit: row.credit,
				department: row.department,
				batch: row.batch,
				section: row.section,
				active: Boolean(row.is_active),
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));

			let optionQuery = "SELECT acy, sem, waiver_type, department, batch, section FROM waiver_requests";
			if (scopeWhere.length > 0) {
				optionQuery += ` WHERE ${scopeWhere.join(" AND ")}`;
			}
			const optionResult = await pool.query(optionQuery, scopeParams);

			const options = {
				acy: [...new Set(optionResult.rows.map((row) => row.acy).filter(Boolean))],
				sem: [...new Set(optionResult.rows.map((row) => row.sem).filter(Boolean))],
				type: [...new Set(optionResult.rows.map((row) => row.waiver_type).filter(Boolean))],
				department: [...new Set(optionResult.rows.map((row) => row.department).filter(Boolean))],
				batch: [...new Set(optionResult.rows.map((row) => row.batch).filter(Boolean))],
				section: [...new Set(optionResult.rows.map((row) => row.section).filter(Boolean))],
			};

			return res.json({ total: waivers.length, waivers, options });
		}

		let rows = [...waiverRequests];

		if (role === "student") {
			rows = rows.filter((item) => Number(item.studentId) === userId);
		}

		if (acy !== "all") rows = rows.filter((item) => item.acy === acy);
		if (sem !== "all") rows = rows.filter((item) => item.sem === sem);
		if (type !== "all") rows = rows.filter((item) => item.type === type);
		if (department !== "all") rows = rows.filter((item) => item.department === department);
		if (batch !== "all") rows = rows.filter((item) => item.batch === batch);
		if (section !== "all") rows = rows.filter((item) => item.section === section);
		if (active === "true") rows = rows.filter((item) => item.active === true);
		if (active === "false") rows = rows.filter((item) => item.active === false);

		if (search) {
			rows = rows.filter((item) => {
				return (
					String(item.ticket || "").toLowerCase().includes(search) ||
					String(item.student || "").toLowerCase().includes(search) ||
					String(item.serial || "").toLowerCase().includes(search) ||
					String(item.courses || "").toLowerCase().includes(search)
				);
			});
		}

		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		const options = {
			acy: [...new Set(waiverRequests.map((item) => item.acy))],
			sem: [...new Set(waiverRequests.map((item) => item.sem))],
			type: [...new Set(waiverRequests.map((item) => item.type))],
			department: [...new Set(waiverRequests.map((item) => item.department))],
			batch: [...new Set(waiverRequests.map((item) => item.batch))],
			section: [...new Set(waiverRequests.map((item) => item.section))],
		};

		return res.json({ total: rows.length, waivers: rows, options });
	} catch (error) {
		console.error("Error listing waiver requests:", error.message);
		return res.status(500).json({ message: "Failed to list waiver requests", error: error.message });
	}
};

const updateWaiverRequestStatus = async (req, res) => {
	try {
		const waiverId = Number(req.params.waiverId);
		if (!Number.isFinite(waiverId) || waiverId <= 0) {
			return res.status(400).json({ message: "Invalid waiver id" });
		}

		const status = String(req.body?.status || "").trim().toLowerCase();
		if (!["approved", "rejected", "in-review"].includes(status)) {
			return res.status(400).json({ message: "status must be approved, rejected, or in-review" });
		}

		if (dbState.mode === "postgres") {
			const check = await pool.query("SELECT * FROM waiver_requests WHERE id = $1", [waiverId]);
			if (check.rows.length === 0) {
				return res.status(404).json({ message: "Waiver request not found" });
			}

			const current = String(check.rows[0].status || "").toLowerCase();
			if (["approved", "rejected"].includes(current)) {
				return res.status(400).json({ message: "Finalized waiver requests cannot be updated" });
			}

			const updated = await pool.query(
				`UPDATE waiver_requests
				 SET status = $1, updated_at = NOW()
				 WHERE id = $2
				 RETURNING id, ticket_no, status, student_id, student_name, serial_no, acy, sem, waiver_type, courses, grade, point, credit, department, batch, section, is_active, created_at, updated_at;`,
				[status, waiverId]
			);

			const row = updated.rows[0];
			return res.json({
				message: "Waiver request updated",
				waiver: {
					id: row.id,
					ticket: row.ticket_no,
					status: row.status,
					studentId: row.student_id,
					student: row.student_name,
					serial: row.serial_no,
					acy: row.acy,
					sem: row.sem,
					type: row.waiver_type,
					courses: row.courses,
					grade: row.grade,
					point: row.point === null ? null : Number(row.point),
					credit: row.credit,
					department: row.department,
					batch: row.batch,
					section: row.section,
					active: Boolean(row.is_active),
					createdAt: row.created_at,
					updatedAt: row.updated_at,
				},
			});
		}

		const target = waiverRequests.find((item) => Number(item.id) === waiverId);
		if (!target) {
			return res.status(404).json({ message: "Waiver request not found" });
		}

		const current = String(target.status || "").toLowerCase();
		if (["approved", "rejected"].includes(current)) {
			return res.status(400).json({ message: "Finalized waiver requests cannot be updated" });
		}

		target.status = status;
		target.updatedAt = new Date().toISOString();

		return res.json({ message: "Waiver request updated", waiver: target });
	} catch (error) {
		console.error("Error updating waiver request:", error.message);
		return res.status(500).json({ message: "Failed to update waiver request", error: error.message });
	}
};

const mapServiceRequestRow = (row) => ({
	id: row.id,
	title: row.title,
	category: row.category,
	description: row.description,
	status: row.status,
	createdBy: row.created_by,
	role: row.role,
	createdByName: row.created_by_name,
	createdByEmail: row.created_by_email,
	createdByRollNo: row.created_by_roll_no,
	createdByDepartment: row.created_by_department,
	metadata: row.metadata,
	remarks: row.remarks,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const createServiceRequest = async (req, res) => {
	const payload = {
		title: req.body?.title,
		category: req.body?.category,
		description: req.body?.description,
	};

	const validation = validateServiceRequest(payload);
	if (!validation.valid) {
		return res.status(400).json({ message: validation.message });
	}

	const normalizedCategory = String(payload.category || "").trim().toLowerCase();
	const actorRole = String(req.user?.role || "").toLowerCase();
	const entryType = String(req.body?.metadata?.entryType || "").toLowerCase();

	if (normalizedCategory === "ibox") {
		if (actorRole === "admin") {
			return res.status(403).json({ message: "Admin can only view I-BOX records" });
		}

		if (actorRole === "faculty" && entryType && entryType !== "complaint") {
			return res.status(400).json({ message: "Faculty I-BOX entries must be complaint type" });
		}

		if (actorRole === "student" && entryType && entryType !== "requisition") {
			return res.status(400).json({ message: "Student I-BOX entries must be requisition type" });
		}
	}

	if (normalizedCategory === "idcard-reissue") {
		if (actorRole !== "student") {
			return res.status(403).json({ message: "Only students can create ID card reissue requisitions" });
		}

		if (entryType && entryType !== "requisition") {
			return res.status(400).json({ message: "ID card requests must be requisition type" });
		}
	}

	if (normalizedCategory === "wifi-request") {
		if (!["student", "faculty"].includes(actorRole)) {
			return res.status(403).json({ message: "Only students and faculty can create Wi-Fi requests" });
		}

		if (req.body?.metadata?.macAddress && String(req.body.metadata.macAddress).trim().length < 8) {
			return res.status(400).json({ message: "Valid MAC address is required" });
		}
	}

	if (normalizedCategory === "bonafide") {
		if (actorRole !== "student") {
			return res.status(403).json({ message: "Only students can create bonafide requests" });
		}
	}

	if (normalizedCategory === "hostel-app") {
		if (actorRole !== "student") {
			return res.status(403).json({ message: "Only students can create hostel application requests" });
		}
	}

	if (normalizedCategory === "hostel-permission") {
		if (actorRole !== "student") {
			return res.status(403).json({ message: "Only students can create hostel stay permission requests" });
		}
	}

	try {
		const insert = await pool.query(
			`INSERT INTO service_requests
				(title, category, description, status, created_by, role, created_by_name, created_by_email, created_by_roll_no, created_by_department, metadata, remarks, created_at, updated_at)
			 VALUES
				($1, $2, $3, 'open', $4, $5, $6, $7, $8, $9, $10::jsonb, $11, NOW(), NOW())
			 RETURNING *`,
			[
				payload.title,
				normalizedCategory,
				payload.description,
				req.user?.id || null,
				req.user?.role || "student",
				req.user?.name || null,
				req.user?.email || null,
				req.user?.rollNo || null,
				req.user?.department || null,
				JSON.stringify(req.body?.metadata || null),
				req.body?.remarks || "",
			]
		);

		return res.status(201).json({
			message: "Service request created",
			request: mapServiceRequestRow(insert.rows[0]),
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to create service request", error: error.message });
	}
};

const listServiceRequests = async (req, res) => {
	const role = req.user?.role;
	const userId = req.user?.id;
	const userDepartment = String(req.user?.department || "").trim().toLowerCase();
	const status = String(req.query?.status || "").trim().toLowerCase();
	const category = String(req.query?.category || "").trim().toLowerCase();

	try {
		let query = "SELECT * FROM service_requests WHERE 1=1";
		const params = [];

		if (role === "student") {
			params.push(userId);
			query += ` AND created_by = $${params.length}`;
		}

		if (status) {
			params.push(status);
			query += ` AND status = $${params.length}`;
		}

		if (category) {
			params.push(category);
			query += ` AND LOWER(category) = $${params.length}`;
		}

		if (role === "faculty" && ["bonafide", "hostel-app", "hostel-permission"].includes(category)) {
			if (userDepartment) {
				params.push(userDepartment);
				query += ` AND LOWER(COALESCE(created_by_department, '')) = $${params.length}`;
			}
		}

		query += " ORDER BY created_at DESC";
		const result = await pool.query(query, params);
		const rows = result.rows.map(mapServiceRequestRow);

		return res.json({ total: rows.length, requests: rows });
	} catch (error) {
		return res.status(500).json({ message: "Failed to list service requests", error: error.message });
	}
};

const updateServiceRequestStatus = async (req, res) => {
	const requestId = Number(req.params.requestId);
	const status = String(req.body?.status || "").toLowerCase();
	const actorRole = String(req.user?.role || "").toLowerCase();
	const allowed = ["open", "pending", "in-progress", "resolved", "approved", "rejected"];

	if (!allowed.includes(status)) {
		return res.status(400).json({ message: "Invalid status value" });
	}

	try {
		const check = await pool.query("SELECT * FROM service_requests WHERE id = $1", [requestId]);
		if (check.rows.length === 0) {
			return res.status(404).json({ message: "Service request not found" });
		}

		const target = mapServiceRequestRow(check.rows[0]);
		const normalizedCategory = String(target.category || "").toLowerCase();

		if (normalizedCategory === "bonafide" && actorRole !== "faculty") {
			return res.status(403).json({ message: "Only faculty can approve bonafide requests" });
		}

		if (normalizedCategory === "hostel-app" && actorRole !== "faculty") {
			return res.status(403).json({ message: "Only faculty can approve hostel application requests" });
		}

		if (normalizedCategory === "hostel-permission" && actorRole !== "faculty") {
			return res.status(403).json({ message: "Only faculty can approve hostel stay permission requests" });
		}

		if (normalizedCategory === "wifi-request" && actorRole !== "admin") {
			return res.status(403).json({ message: "Only admin can control Wi-Fi requests" });
		}

		const updated = await pool.query(
			`UPDATE service_requests
			 SET status = $1, remarks = $2, updated_at = NOW()
			 WHERE id = $3
			 RETURNING *`,
			[status, req.body?.remarks ?? target.remarks ?? "", requestId]
		);

		return res.json({ message: "Service request updated", request: mapServiceRequestRow(updated.rows[0]) });
	} catch (error) {
		return res.status(500).json({ message: "Failed to update service request", error: error.message });
	}
};

const acceptIdCardReissueRequest = async (req, res) => {
	const requestId = Number(req.params.requestId);
	const actorRole = String(req.user?.role || "").toLowerCase();

	if (!requestId) {
		return res.status(400).json({ message: "Invalid request id" });
	}

	if (!["faculty", "admin"].includes(actorRole)) {
		return res.status(403).json({ message: "Only faculty or admin can accept ID card requests" });
	}

	try {
		const check = await pool.query("SELECT * FROM service_requests WHERE id = $1", [requestId]);
		if (check.rows.length === 0) {
			return res.status(404).json({ message: "Service request not found" });
		}

		const target = mapServiceRequestRow(check.rows[0]);
		const category = String(target.category || "").toLowerCase();
		const metadata = target?.metadata && typeof target.metadata === "object" ? target.metadata : {};
	const entryType = String(metadata.entryType || "").toLowerCase();
	const severity = String(metadata.issueSeverity || "minor").toLowerCase();

	if (category !== "idcard-reissue" || entryType !== "requisition") {
		return res.status(400).json({ message: "Only ID card requisitions can be accepted here" });
	}

	if (["approved", "resolved", "rejected"].includes(String(target.status || "").toLowerCase())) {
		return res.status(400).json({ message: "This request is already finalized" });
	}

	if (actorRole === "faculty" && severity !== "minor") {
		return res.status(403).json({
			message: "Faculty can accept only minor mistakes. Major, photo, or full reissue must be handled by admin.",
		});
	}

		const nextMetadata = {
		...metadata,
		handledByRole: actorRole,
		handledById: req.user?.id || null,
		handledByName: req.user?.name || null,
		handledAt: new Date().toISOString(),
		resolution: req.body?.resolution && typeof req.body.resolution === "object" ? req.body.resolution : metadata.resolution || null,
		};

		const updated = await pool.query(
			`UPDATE service_requests
			 SET status = 'approved', remarks = $1, metadata = $2::jsonb, updated_at = NOW()
			 WHERE id = $3
			 RETURNING *`,
			[String(req.body?.remarks || target.remarks || ""), JSON.stringify(nextMetadata), requestId]
		);

		return res.json({ message: "ID card requisition accepted", request: mapServiceRequestRow(updated.rows[0]) });
	} catch (error) {
		return res.status(500).json({ message: "Failed to accept ID card request", error: error.message });
	}
};

const escalateIdCardReissueRequest = async (req, res) => {
	const requestId = Number(req.params.requestId);
	const actorRole = String(req.user?.role || "").toLowerCase();

	if (!requestId) {
		return res.status(400).json({ message: "Invalid request id" });
	}

	if (actorRole !== "faculty") {
		return res.status(403).json({ message: "Only faculty can escalate ID card requests" });
	}

	try {
		const check = await pool.query("SELECT * FROM service_requests WHERE id = $1", [requestId]);
		if (check.rows.length === 0) {
			return res.status(404).json({ message: "Service request not found" });
		}

		const target = mapServiceRequestRow(check.rows[0]);
		const category = String(target.category || "").toLowerCase();
		const metadata = target?.metadata && typeof target.metadata === "object" ? target.metadata : {};
	const entryType = String(metadata.entryType || "").toLowerCase();
	const severity = String(metadata.issueSeverity || "minor").toLowerCase();

	if (category !== "idcard-reissue" || entryType !== "requisition") {
		return res.status(400).json({ message: "Only ID card requisitions can be escalated here" });
	}

	if (["approved", "resolved", "rejected"].includes(String(target.status || "").toLowerCase())) {
		return res.status(400).json({ message: "This request is already finalized" });
	}

	if (severity === "minor") {
		return res.status(400).json({ message: "Minor issues should be handled by faculty directly" });
	}

	if (metadata.escalatedToAdmin) {
		return res.status(400).json({ message: "Request already escalated to admin" });
	}

		const nextMetadata = {
		...metadata,
		escalatedToAdmin: true,
		escalatedByRole: "faculty",
		escalatedById: req.user?.id || null,
		escalatedByName: req.user?.name || null,
		escalatedAt: new Date().toISOString(),
		};

		const updated = await pool.query(
			`UPDATE service_requests
			 SET status = 'pending', remarks = $1, metadata = $2::jsonb, updated_at = NOW()
			 WHERE id = $3
			 RETURNING *`,
			[String(req.body?.remarks || "Escalated to admin by faculty"), JSON.stringify(nextMetadata), requestId]
		);

		return res.json({ message: "ID card requisition escalated to admin", request: mapServiceRequestRow(updated.rows[0]) });
	} catch (error) {
		return res.status(500).json({ message: "Failed to escalate ID card request", error: error.message });
	}
};

const grantIboxRequisitionPermission = async (req, res) => {
	const requestId = Number(req.params.requestId);
	const actorId = Number(req.user?.id || 0);

	if (!requestId) {
		return res.status(400).json({ message: "Invalid request id" });
	}

	try {
		const check = await pool.query("SELECT * FROM service_requests WHERE id = $1", [requestId]);
		if (check.rows.length === 0) {
			return res.status(404).json({ message: "Service request not found" });
		}

		const target = mapServiceRequestRow(check.rows[0]);
		const category = String(target.category || "").toLowerCase();
		const metadata = target?.metadata && typeof target.metadata === "object" ? target.metadata : {};
	const entryType = String(metadata.entryType || "").toLowerCase();

	if (category !== "ibox" || entryType !== "requisition") {
		return res.status(400).json({ message: "Permission can be given only for I-BOX requisitions" });
	}

	if (Number(target.createdBy || 0) !== actorId) {
		return res.status(403).json({ message: "Only the requisition owner can give permission" });
	}

	if (metadata.permissionGranted) {
		return res.status(400).json({ message: "Permission already granted for this requisition" });
	}

		const nextMetadata = {
		...metadata,
		permissionGranted: true,
		permissionGrantedAt: new Date().toISOString(),
		permissionGrantedBy: actorId,
		};

		const updated = await pool.query(
			`UPDATE service_requests
			 SET metadata = $1::jsonb, updated_at = NOW()
			 WHERE id = $2
			 RETURNING *`,
			[JSON.stringify(nextMetadata), requestId]
		);

		return res.json({
			message: "Permission granted. Faculty can now convert this requisition.",
			request: mapServiceRequestRow(updated.rows[0]),
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to grant I-BOX permission", error: error.message });
	}
};

const convertIboxRequisitionToComplaint = async (req, res) => {
	const requestId = Number(req.params.requestId);
	const actorRole = String(req.user?.role || "").toLowerCase();

	if (!requestId) {
		return res.status(400).json({ message: "Invalid request id" });
	}

	if (actorRole !== "faculty") {
		return res.status(403).json({ message: "Only faculty can convert requisitions" });
	}

	try {
		const check = await pool.query("SELECT * FROM service_requests WHERE id = $1", [requestId]);
		if (check.rows.length === 0) {
			return res.status(404).json({ message: "Service request not found" });
		}

		const target = mapServiceRequestRow(check.rows[0]);
		const category = String(target.category || "").toLowerCase();
		const metadata = target?.metadata && typeof target.metadata === "object" ? target.metadata : {};
	const entryType = String(metadata.entryType || "").toLowerCase();

	if (category !== "ibox" || entryType !== "requisition") {
		return res.status(400).json({ message: "Only I-BOX requisitions can be converted" });
	}

	if (!metadata.permissionGranted) {
		return res.status(400).json({ message: "Student permission is required before conversion" });
	}

	if (metadata.convertedToComplaintId) {
		return res.status(400).json({ message: "Requisition already converted to complaint" });
	}

		const complaintMetadata = {
			entryType: "complaint",
			complaintType: metadata.complaintType || "Other",
			againstName: metadata.studentName || target.createdByName || "-",
			againstRollNo: metadata.studentRollNo || target.createdByRollNo || "-",
			studentName: metadata.studentName || target.createdByName || "-",
			studentRollNo: metadata.studentRollNo || target.createdByRollNo || "-",
			convertedFromRequisitionId: target.id,
			convertedByFacultyId: req.user?.id || null,
			convertedByFacultyName: req.user?.name || "Faculty",
			convertedAt: new Date().toISOString(),
		};

		const insertComplaint = await pool.query(
			`INSERT INTO service_requests
				(title, category, description, status, created_by, role, created_by_name, created_by_email, created_by_roll_no, created_by_department, metadata, remarks, created_at, updated_at)
			 VALUES
				($1, 'ibox', $2, 'pending', $3, $4, $5, $6, $7, $8, $9::jsonb, $10, NOW(), NOW())
			 RETURNING *`,
			[
				`I-BOX Complaint - ${metadata.complaintType || "Other"}`,
				target.description,
				req.user?.id || null,
				req.user?.role || "faculty",
				req.user?.name || null,
				req.user?.email || null,
				req.user?.rollNo || null,
				req.user?.department || null,
				JSON.stringify(complaintMetadata),
				`Converted from requisition IBX-${String(target.id).padStart(4, "0")}`,
			]
		);

		const complaintItem = mapServiceRequestRow(insertComplaint.rows[0]);
		const requisitionMetadata = {
		...metadata,
		convertedToComplaintId: complaintItem.id,
		convertedAt: new Date().toISOString(),
		convertedByFacultyId: req.user?.id || null,
		};

		const updateRequisition = await pool.query(
			`UPDATE service_requests
			 SET status = 'approved', remarks = $1, metadata = $2::jsonb, updated_at = NOW()
			 WHERE id = $3
			 RETURNING *`,
			[
				`Converted to complaint IBX-${String(complaintItem.id).padStart(4, "0")}`,
				JSON.stringify(requisitionMetadata),
				requestId,
			]
		);

		return res.json({
			message: "Requisition converted to official complaint",
			requisition: mapServiceRequestRow(updateRequisition.rows[0]),
			complaint: complaintItem,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to convert requisition", error: error.message });
	}
};

const deleteServiceRequest = async (req, res) => {
	const requestId = Number(req.params.requestId);
	const actorRole = String(req.user?.role || "").toLowerCase();
	const actorId = Number(req.user?.id || 0);

	try {
		const check = await pool.query("SELECT * FROM service_requests WHERE id = $1", [requestId]);
		if (check.rows.length === 0) {
			return res.status(404).json({ message: "Service request not found" });
		}

		const target = mapServiceRequestRow(check.rows[0]);
		const category = String(target.category || "").toLowerCase();

		if (category === "ibox") {
			if (actorRole !== "faculty") {
				return res.status(403).json({ message: "Only faculty can delete I-BOX records" });
			}
		} else {
			const isAdminOrFaculty = actorRole === "admin" || actorRole === "faculty";
			const isOwnerStudent = actorRole === "student" && Number(target.createdBy || 0) === actorId;

			if (!isAdminOrFaculty && !isOwnerStudent) {
				return res.status(403).json({ message: "Not allowed to delete this request" });
			}
		}

		await pool.query("DELETE FROM service_requests WHERE id = $1", [requestId]);
		return res.json({ message: "Service request deleted", requestId });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete service request", error: error.message });
	}
};

const createGatepassRequest = async (req, res) => {
	try {
		const payload = req.body || {};
		if (!payload.reason || !payload.fromDate || !payload.toDate) {
			return res.status(400).json({ message: "reason, fromDate and toDate are required" });
		}

		let passCategory = normalizeGatepassCategory(payload.passCategory || payload.studentCategory);
		const passType = normalizeGatepassType(payload.type);

		if (req.user?.role === "student") {
			if (dbState.mode === "postgres") {
				const studentResult = await pool.query(
					"SELECT resident_type FROM users WHERE id = $1 AND role = 'student' LIMIT 1",
					[req.user?.id]
				);
				if (studentResult.rows.length === 0) {
					return res.status(404).json({ message: "Student not found" });
				}
				passCategory = normalizeResidentType(studentResult.rows[0].resident_type);
			} else {
				passCategory = normalizeResidentType(req.user?.residentType);
			}
		}

		if (passCategory === "hosteller" && passType !== "Free Outing") {
			return res.status(400).json({ message: "Hosteller students must use Free Outing request" });
		}

		if ((passCategory === "day-scholar" || passCategory === "lateral") && passType !== "Gate Pass") {
			return res.status(400).json({ message: "Day Scholar and Lateral students must use Gate Pass" });
		}

		const fromDate = new Date(payload.fromDate);
		const toDate = new Date(payload.toDate);
		if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
			return res.status(400).json({ message: "Invalid fromDate or toDate" });
		}

		if (toDate < fromDate) {
			return res.status(400).json({ message: "toDate must be on or after fromDate" });
		}

		const email = String(req.user?.email || "");
		const derivedRollNo = email.includes("@") ? email.split("@")[0].toUpperCase() : null;

		if (dbState.mode === "postgres") {
			// ticket_no is NOT NULL in schema, so generate id first and derive ticket_no.
			const nextIdResult = await pool.query(
				"SELECT nextval(pg_get_serial_sequence('gatepass_requests', 'id')) AS id"
			);
			const nextId = Number(nextIdResult.rows[0].id);
			const ticketNo = 10000 + nextId;

			const insertResult = await pool.query(
				`INSERT INTO gatepass_requests (id, ticket_no, student_id, student_name, roll_no, type, pass_category, reason, from_date, to_date, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())
				RETURNING id, ticket_no, student_id, student_name, roll_no, type, pass_category, reason, from_date, to_date, status, approved_by, approved_by_name, remarks, created_at, updated_at;`,
				[
					nextId,
					ticketNo,
					req.user?.id || null,
					payload.studentName || req.user?.name || req.user?.email || "Student",
					payload.rollNo || derivedRollNo,
					passType,
					passCategory,
					String(payload.reason),
					fromDate.toISOString(),
					toDate.toISOString(),
				]
			);

			const row = insertResult.rows[0];
			const requestItem = {
				id: row.id,
				ticketNo: row.ticket_no,
				studentId: row.student_id,
				studentName: row.student_name,
				rollNo: row.roll_no,
				type: row.type,
				passCategory: row.pass_category || "day-scholar",
				reason: row.reason,
				fromDate: row.from_date,
				toDate: row.to_date,
				status: row.status,
				approvedBy: row.approved_by,
				approvedByName: row.approved_by_name,
				remarks: row.remarks,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			};

			return res.status(201).json({ message: "Gatepass request created", gatepass: requestItem });
		}

		// Fallback to in-memory storage
		const gatepassId = nextGatepassId++;
		const requestItem = {
			id: gatepassId,
			ticketNo: 10000 + gatepassId,
			studentId: req.user?.id || null,
			studentName: payload.studentName || req.user?.name || req.user?.email || "Student",
			rollNo: payload.rollNo || derivedRollNo,
			type: passType,
			passCategory,
			reason: String(payload.reason),
			fromDate: fromDate.toISOString(),
			toDate: toDate.toISOString(),
			status: "pending",
			approvedBy: null,
			approvedByName: null,
			remarks: payload.remarks || "",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		gatepassRequests.push(requestItem);
		return res.status(201).json({ message: "Gatepass request created", gatepass: requestItem });
	} catch (error) {
		console.error("Error creating gatepass request:", error.message);
		return res.status(500).json({ message: "Failed to create gatepass request", error: error.message });
	}
};

const listGatepassRequests = async (req, res) => {
	try {
		const role = req.user?.role;
		const userId = req.user?.id;
		const status = String(req.query?.status || "").trim().toLowerCase();
		const studentIdFilter = Number(req.query?.studentId || 0);
		const passCategory = String(req.query?.passCategory || "").trim().toLowerCase();
		const passType = String(req.query?.type || "").trim().toLowerCase();

		if (dbState.mode === "postgres") {
			let query = "SELECT * FROM gatepass_requests WHERE 1=1";
			const params = [];

			if (role === "student") {
				query += ` AND student_id = $${params.length + 1}`;
				params.push(userId);
			}

			if (studentIdFilter > 0 && role !== "student") {
				query += ` AND student_id = $${params.length + 1}`;
				params.push(studentIdFilter);
			}

			if (status) {
				query += ` AND status = $${params.length + 1}`;
				params.push(status);
			}

			if (["day-scholar", "hosteller", "lateral"].includes(passCategory)) {
				query += ` AND COALESCE(pass_category, 'day-scholar') = $${params.length + 1}`;
				params.push(passCategory);
			}

			if (passType) {
				if (passType === "gate pass" || passType === "gatepass") {
					query += ` AND LOWER(type) = $${params.length + 1}`;
					params.push("gate pass");
				} else if (passType === "free outing" || passType === "free-outing") {
					query += ` AND LOWER(type) = $${params.length + 1}`;
					params.push("free outing");
				}
			}

			query += " ORDER BY created_at DESC";

			const result = await pool.query(query, params);
			const requests = result.rows.map((row) => ({
				id: row.id,
				ticketNo: row.ticket_no,
				studentId: row.student_id,
				studentName: row.student_name,
				rollNo: row.roll_no,
				type: row.type,
				passCategory: row.pass_category || "day-scholar",
				reason: row.reason,
				fromDate: row.from_date,
				toDate: row.to_date,
				status: row.status,
				approvedBy: row.approved_by,
				approvedByName: row.approved_by_name,
				remarks: row.remarks,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));

			return res.json({ total: requests.length, requests });
		}

		// Fallback to in-memory storage
		let rows = [...gatepassRequests];
		if (role === "student") {
			rows = rows.filter((item) => item.studentId === userId);
		}

		if (studentIdFilter > 0 && role !== "student") {
			rows = rows.filter((item) => item.studentId === studentIdFilter);
		}

		if (status) {
			rows = rows.filter((item) => item.status === status);
		}

		if (["day-scholar", "hosteller", "lateral"].includes(passCategory)) {
			rows = rows.filter(
				(item) => normalizeGatepassCategory(item.passCategory || "day-scholar") === passCategory
			);
		}

		if (passType === "gate pass" || passType === "gatepass") {
			rows = rows.filter((item) => String(item.type || "").toLowerCase() === "gate pass");
		}

		if (passType === "free outing" || passType === "free-outing") {
			rows = rows.filter((item) => String(item.type || "").toLowerCase() === "free outing");
		}

		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return res.json({ total: rows.length, requests: rows });
	} catch (error) {
		console.error("Error listing gatepass requests:", error.message);
		return res.status(500).json({ message: "Failed to list gatepass requests", error: error.message });
	}
};

const updateGatepassStatus = async (req, res) => {
	try {
		const gatepassId = Number(req.params.gatepassId);
		const status = String(req.body?.status || "").toLowerCase();
		if (!["approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "status must be approved or rejected" });
		}

		if (dbState.mode === "postgres") {
			// First, check if the gatepass exists and is pending
			const checkResult = await pool.query(
				"SELECT * FROM gatepass_requests WHERE id = $1",
				[gatepassId]
			);

			if (checkResult.rows.length === 0) {
				return res.status(404).json({ message: "Gatepass request not found" });
			}

			const target = checkResult.rows[0];
			if (target.status !== "pending") {
				return res.status(400).json({ message: "Only pending gatepass requests can be updated" });
			}

			// Update the gatepass
			const updateResult = await pool.query(
				`UPDATE gatepass_requests 
				SET status = $1, remarks = $2, approved_by = $3, approved_by_name = $4, updated_at = NOW()
				WHERE id = $5
				RETURNING id, ticket_no, student_id, student_name, roll_no, type, pass_category, reason, from_date, to_date, status, approved_by, approved_by_name, remarks, created_at, updated_at;`,
				[
					status,
					req.body?.remarks || null,
					req.user?.id || null,
					req.user?.name || req.user?.email || "Faculty",
					gatepassId,
				]
			);

			const row = updateResult.rows[0];
			const updatedGatepass = {
				id: row.id,
				ticketNo: row.ticket_no,
				studentId: row.student_id,
				studentName: row.student_name,
				rollNo: row.roll_no,
				type: row.type,
				passCategory: row.pass_category || "day-scholar",
				reason: row.reason,
				fromDate: row.from_date,
				toDate: row.to_date,
				status: row.status,
				approvedBy: row.approved_by,
				approvedByName: row.approved_by_name,
				remarks: row.remarks,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			};

			return res.json({ message: "Gatepass request updated", gatepass: updatedGatepass });
		}

		// Fallback to in-memory storage
		const target = gatepassRequests.find((item) => item.id === gatepassId);
		if (!target) {
			return res.status(404).json({ message: "Gatepass request not found" });
		}

		if (target.status !== "pending") {
			return res.status(400).json({ message: "Only pending gatepass requests can be updated" });
		}

		target.status = status;
		target.remarks = req.body?.remarks || target.remarks;
		target.approvedBy = req.user?.id || null;
		target.approvedByName = req.user?.name || req.user?.email || "Faculty";
		target.updatedAt = new Date().toISOString();
		return res.json({ message: "Gatepass request updated", gatepass: target });
	} catch (error) {
		console.error("Error updating gatepass status:", error.message);
		return res.status(500).json({ message: "Failed to update gatepass request", error: error.message });
	}
};

const createLatecomerRequest = async (req, res) => {
	try {
		const payload = req.body || {};
		const arrivedAt = new Date(payload.arrivedAt || payload.dateTime || new Date().toISOString());
		const reason = String(payload.reason || payload.occ || "").trim();

		if (!reason) {
			return res.status(400).json({ message: "reason is required" });
		}

		if (Number.isNaN(arrivedAt.getTime())) {
			return res.status(400).json({ message: "Invalid arrivedAt value" });
		}

		if (dbState.mode === "postgres") {
			const studentResult = await pool.query(
				`SELECT id, name, roll_no, department FROM users WHERE id = $1 AND role = 'student' LIMIT 1`,
				[req.user?.id]
			);

			if (studentResult.rows.length === 0) {
				return res.status(404).json({ message: "Student not found" });
			}

			const student = studentResult.rows[0];
			const nextIdResult = await pool.query(
				"SELECT nextval(pg_get_serial_sequence('latecomer_requests', 'id')) AS id"
			);
			const nextId = Number(nextIdResult.rows[0].id);
			const ticketNo = `LT-${String(nextId).padStart(5, "0")}`;

			const insertResult = await pool.query(
				`INSERT INTO latecomer_requests
					(id, ticket_no, student_id, student_name, roll_no, department, arrived_at, reason, status, remarks, created_at, updated_at)
				 VALUES
					($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW(), NOW())
				 RETURNING *`,
				[
					nextId,
					ticketNo,
					student.id,
					student.name || req.user?.name || req.user?.email || "Student",
					student.roll_no || null,
					student.department || null,
					arrivedAt.toISOString(),
					reason,
					String(payload.remarks || "").trim() || null,
				]
			);

			return res.status(201).json({
				message: "Latecomer request sent for faculty approval",
				request: mapLatecomerRow(insertResult.rows[0]),
			});
		}

		const latecomerId = nextLatecomerId++;
		const request = {
			id: latecomerId,
			ticketNo: `LT-${String(latecomerId).padStart(5, "0")}`,
			studentId: req.user?.id || null,
			studentName: req.user?.name || req.user?.email || "Student",
			rollNo: req.user?.rollNo || null,
			department: req.user?.department || null,
			arrivedAt: arrivedAt.toISOString(),
			reason,
			status: "pending",
			remarks: String(payload.remarks || "").trim(),
			approvedBy: null,
			approvedByName: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		latecomerRequests.push(request);
		return res.status(201).json({ message: "Latecomer request sent for faculty approval", request });
	} catch (error) {
		console.error("Error creating latecomer request:", error.message);
		return res.status(500).json({ message: "Failed to create latecomer request", error: error.message });
	}
};

const listLatecomerRequests = async (req, res) => {
	try {
		const role = req.user?.role;
		const userId = req.user?.id;
		const status = String(req.query?.status || "").trim().toLowerCase();

		if (dbState.mode === "postgres") {
			let query = "SELECT * FROM latecomer_requests WHERE 1=1";
			const params = [];

			if (role === "student") {
				query += ` AND student_id = $${params.length + 1}`;
				params.push(userId);
			}

			if (["pending", "approved", "rejected"].includes(status)) {
				query += ` AND status = $${params.length + 1}`;
				params.push(status);
			}

			query += " ORDER BY created_at DESC";
			const result = await pool.query(query, params);
			const requests = result.rows.map(mapLatecomerRow);
			return res.json({ total: requests.length, requests });
		}

		let rows = [...latecomerRequests];
		if (role === "student") {
			rows = rows.filter((item) => Number(item.studentId) === Number(userId));
		}

		if (["pending", "approved", "rejected"].includes(status)) {
			rows = rows.filter((item) => String(item.status) === status);
		}

		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return res.json({ total: rows.length, requests: rows });
	} catch (error) {
		console.error("Error listing latecomer requests:", error.message);
		return res.status(500).json({ message: "Failed to list latecomer requests", error: error.message });
	}
};

const updateLatecomerStatus = async (req, res) => {
	try {
		const requestId = Number(req.params.requestId);
		const status = String(req.body?.status || "").trim().toLowerCase();

		if (!["approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "status must be approved or rejected" });
		}

		if (dbState.mode === "postgres") {
			const checkResult = await pool.query("SELECT * FROM latecomer_requests WHERE id = $1", [requestId]);
			if (checkResult.rows.length === 0) {
				return res.status(404).json({ message: "Latecomer request not found" });
			}

			const target = checkResult.rows[0];
			if (target.status !== "pending") {
				return res.status(400).json({ message: "Only pending latecomer requests can be updated" });
			}

			const updateResult = await pool.query(
				`UPDATE latecomer_requests
				 SET status = $1, remarks = $2, approved_by = $3, approved_by_name = $4, updated_at = NOW()
				 WHERE id = $5
				 RETURNING *`,
				[
					status,
					req.body?.remarks || null,
					req.user?.id || null,
					req.user?.name || req.user?.email || "Faculty",
					requestId,
				]
			);

			return res.json({
				message: "Latecomer request updated",
				request: mapLatecomerRow(updateResult.rows[0]),
			});
		}

		const target = latecomerRequests.find((item) => item.id === requestId);
		if (!target) {
			return res.status(404).json({ message: "Latecomer request not found" });
		}

		if (target.status !== "pending") {
			return res.status(400).json({ message: "Only pending latecomer requests can be updated" });
		}

		target.status = status;
		target.remarks = req.body?.remarks || target.remarks;
		target.approvedBy = req.user?.id || null;
		target.approvedByName = req.user?.name || req.user?.email || "Faculty";
		target.updatedAt = new Date().toISOString();
		return res.json({ message: "Latecomer request updated", request: target });
	} catch (error) {
		console.error("Error updating latecomer request:", error.message);
		return res.status(500).json({ message: "Failed to update latecomer request", error: error.message });
	}
};

const createAoBooking = async (req, res) => {
	try {
		const payload = req.body || {};
		const serviceName = String(payload.service || "AO Service Support").trim();
		const subject = String(payload.subject || "").trim();
		const status = String(payload.status || "pending").trim().toLowerCase();

		if (!subject) {
			return res.status(400).json({ message: "subject is required" });
		}

		if (!["pending", "approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "Invalid status value" });
		}

		const studentName = req.user?.name || req.user?.email || "Student";

		if (dbState.mode === "postgres") {
			const nextIdResult = await pool.query(
				"SELECT nextval(pg_get_serial_sequence('ao_service_bookings', 'id')) AS id"
			);
			const nextId = Number(nextIdResult.rows[0].id);
			const ticketNo = `AOS-${String(nextId).padStart(4, "0")}`;

			const insertResult = await pool.query(
				`INSERT INTO ao_service_bookings
				(id, ticket_no, student_id, student_name, service_name, subject, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
				RETURNING id, ticket_no, student_id, student_name, service_name, subject, status, created_at, updated_at;`,
				[
					nextId,
					ticketNo,
					req.user?.id || null,
					studentName,
					serviceName,
					subject,
					status,
				]
			);

			const row = insertResult.rows[0];
			return res.status(201).json({
				message: "AO service booking created",
				booking: {
					id: row.id,
					ticket: row.ticket_no,
					studentId: row.student_id,
					user: row.student_name,
					service: row.service_name,
					subject: row.subject,
					status: row.status,
					createdAt: row.created_at,
					updatedAt: row.updated_at,
				},
			});
		}

		const id = nextAoBookingId++;
		const booking = {
			id,
			ticket: `AOS-${String(id).padStart(4, "0")}`,
			studentId: req.user?.id || null,
			user: studentName,
			service: serviceName,
			subject,
			status,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		aoServiceBookings.push(booking);
		return res.status(201).json({ message: "AO service booking created", booking });
	} catch (error) {
		console.error("Error creating AO service booking:", error.message);
		return res.status(500).json({ message: "Failed to create AO service booking", error: error.message });
	}
};

const listAoBookings = async (req, res) => {
	try {
		const role = req.user?.role;
		const userId = req.user?.id;
		const status = String(req.query?.status || "").trim().toLowerCase();

		if (dbState.mode === "postgres") {
			let query = "SELECT * FROM ao_service_bookings WHERE 1=1";
			const params = [];

			if (role === "student") {
				query += ` AND student_id = $${params.length + 1}`;
				params.push(userId);
			}

			if (status) {
				query += ` AND status = $${params.length + 1}`;
				params.push(status);
			}

			query += " ORDER BY created_at DESC";
			const result = await pool.query(query, params);

			const bookings = result.rows.map((row) => ({
				id: row.id,
				ticket: row.ticket_no,
				studentId: row.student_id,
				user: row.student_name,
				service: row.service_name,
				subject: row.subject,
				status: row.status,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));

			return res.json({ total: bookings.length, bookings });
		}

		let rows = [...aoServiceBookings];
		if (role === "student") {
			rows = rows.filter((item) => item.studentId === userId);
		}
		if (status) {
			rows = rows.filter((item) => item.status === status);
		}
		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return res.json({ total: rows.length, bookings: rows });
	} catch (error) {
		console.error("Error listing AO bookings:", error.message);
		return res.status(500).json({ message: "Failed to list AO bookings", error: error.message });
	}
};

const deleteAoBooking = async (req, res) => {
	try {
		const bookingId = Number(req.params.bookingId);
		if (dbState.mode === "postgres") {
			const role = req.user?.role;
			const userId = req.user?.id;
			const result = await pool.query("SELECT student_id FROM ao_service_bookings WHERE id = $1", [bookingId]);
			if (result.rows.length === 0) {
				return res.status(404).json({ message: "AO booking not found" });
			}
			if (role === "student" && Number(result.rows[0].student_id) !== Number(userId)) {
				return res.status(403).json({ message: "Not allowed to delete this booking" });
			}
			await pool.query("DELETE FROM ao_service_bookings WHERE id = $1", [bookingId]);
			return res.json({ message: "AO booking deleted" });
		}

		const index = aoServiceBookings.findIndex((item) => item.id === bookingId);
		if (index < 0) {
			return res.status(404).json({ message: "AO booking not found" });
		}
		if (req.user?.role === "student" && Number(aoServiceBookings[index].studentId) !== Number(req.user?.id)) {
			return res.status(403).json({ message: "Not allowed to delete this booking" });
		}
		aoServiceBookings.splice(index, 1);
		return res.json({ message: "AO booking deleted" });
	} catch (error) {
		console.error("Error deleting AO booking:", error.message);
		return res.status(500).json({ message: "Failed to delete AO booking", error: error.message });
	}
};

const updateAoBookingStatus = async (req, res) => {
	try {
		const bookingId = Number(req.params.bookingId);
		const status = String(req.body?.status || "").trim().toLowerCase();
		if (!["approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "status must be approved or rejected" });
		}

		if (dbState.mode === "postgres") {
			const check = await pool.query("SELECT * FROM ao_service_bookings WHERE id = $1", [bookingId]);
			if (check.rows.length === 0) {
				return res.status(404).json({ message: "AO booking not found" });
			}
			if (check.rows[0].status !== "pending") {
				return res.status(400).json({ message: "Only pending bookings can be updated" });
			}

			const updated = await pool.query(
				`UPDATE ao_service_bookings
				SET status = $1, updated_at = NOW()
				WHERE id = $2
				RETURNING id, ticket_no, student_id, student_name, service_name, subject, status, created_at, updated_at;`,
				[status, bookingId]
			);

			const row = updated.rows[0];
			return res.json({
				message: "AO booking updated",
				booking: {
					id: row.id,
					ticket: row.ticket_no,
					studentId: row.student_id,
					user: row.student_name,
					service: row.service_name,
					subject: row.subject,
					status: row.status,
					createdAt: row.created_at,
					updatedAt: row.updated_at,
				},
			});
		}

		const target = aoServiceBookings.find((item) => item.id === bookingId);
		if (!target) {
			return res.status(404).json({ message: "AO booking not found" });
		}
		if (target.status !== "pending") {
			return res.status(400).json({ message: "Only pending bookings can be updated" });
		}
		target.status = status;
		target.updatedAt = new Date().toISOString();
		return res.json({ message: "AO booking updated", booking: target });
	} catch (error) {
		console.error("Error updating AO booking status:", error.message);
		return res.status(500).json({ message: "Failed to update AO booking", error: error.message });
	}
};

const createFusionBooking = async (req, res) => {
	try {
		const payload = req.body || {};
		const event = String(payload.event || "").trim();
		const status = String(payload.status || "pending").trim().toLowerCase();
		const count = Number(payload.count || 1);
		const cooking = String(payload.cooking || "No").trim();
		const date = String(payload.date || "").trim();
		const duration = String(payload.duration || "").trim();
		const details = String(payload.details || "").trim();

		if (!event) {
			return res.status(400).json({ message: "event is required" });
		}
		if (!["pending", "approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "Invalid status value" });
		}
		if (!Number.isFinite(count) || count < 1) {
			return res.status(400).json({ message: "count must be at least 1" });
		}

		const studentName = req.user?.name || req.user?.email || "Student";

		if (dbState.mode === "postgres") {
			const nextIdResult = await pool.query(
				"SELECT nextval(pg_get_serial_sequence('fusion_space_bookings', 'id')) AS id"
			);
			const nextId = Number(nextIdResult.rows[0].id);
			const ticketNo = `FSB-${String(nextId).padStart(4, "0")}`;

			const insertResult = await pool.query(
				`INSERT INTO fusion_space_bookings
				(id, ticket_no, student_id, student_name, event_name, attendee_count, cooking_required, event_date, duration, details, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
				RETURNING id, ticket_no, student_id, student_name, event_name, attendee_count, cooking_required, event_date, duration, details, status, created_at, updated_at;`,
				[
					nextId,
					ticketNo,
					req.user?.id || null,
					studentName,
					event,
					count,
					cooking,
					date || null,
					duration || null,
					details || null,
					status,
				]
			);

			const row = insertResult.rows[0];
			return res.status(201).json({
				message: "Fusion booking created",
				booking: {
					id: row.id,
					ticket: row.ticket_no,
					studentId: row.student_id,
					user: row.student_name,
					event: row.event_name,
					count: row.attendee_count,
					cooking: row.cooking_required,
					date: row.event_date || "-",
					duration: row.duration || "-",
					details: row.details || "-",
					status: row.status,
					createdAt: row.created_at,
					updatedAt: row.updated_at,
				},
			});
		}

		const id = nextFusionBookingId++;
		const booking = {
			id,
			ticket: `FSB-${String(id).padStart(4, "0")}`,
			studentId: req.user?.id || null,
			user: studentName,
			event,
			count,
			cooking,
			date: date || "-",
			duration: duration || "-",
			details: details || "-",
			status,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		fusionSpaceBookings.push(booking);
		return res.status(201).json({ message: "Fusion booking created", booking });
	} catch (error) {
		console.error("Error creating Fusion booking:", error.message);
		return res.status(500).json({ message: "Failed to create Fusion booking", error: error.message });
	}
};

const listFusionBookings = async (req, res) => {
	try {
		const role = req.user?.role;
		const userId = req.user?.id;

		if (dbState.mode === "postgres") {
			let query = "SELECT * FROM fusion_space_bookings WHERE 1=1";
			const params = [];
			if (role === "student") {
				query += ` AND student_id = $${params.length + 1}`;
				params.push(userId);
			}
			query += " ORDER BY created_at DESC";
			const result = await pool.query(query, params);

			const bookings = result.rows.map((row) => ({
				id: row.id,
				ticket: row.ticket_no,
				studentId: row.student_id,
				user: row.student_name,
				event: row.event_name,
				count: row.attendee_count,
				cooking: row.cooking_required,
				date: row.event_date || "-",
				duration: row.duration || "-",
				details: row.details || "-",
				status: row.status,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));

			return res.json({ total: bookings.length, bookings });
		}

		let rows = [...fusionSpaceBookings];
		if (role === "student") {
			rows = rows.filter((item) => item.studentId === userId);
		}
		rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return res.json({ total: rows.length, bookings: rows });
	} catch (error) {
		console.error("Error listing Fusion bookings:", error.message);
		return res.status(500).json({ message: "Failed to list Fusion bookings", error: error.message });
	}
};

const deleteFusionBooking = async (req, res) => {
	try {
		const bookingId = Number(req.params.bookingId);
		if (dbState.mode === "postgres") {
			const role = req.user?.role;
			const userId = req.user?.id;
			const result = await pool.query("SELECT student_id FROM fusion_space_bookings WHERE id = $1", [bookingId]);
			if (result.rows.length === 0) {
				return res.status(404).json({ message: "Fusion booking not found" });
			}
			if (role === "student" && Number(result.rows[0].student_id) !== Number(userId)) {
				return res.status(403).json({ message: "Not allowed to delete this booking" });
			}
			await pool.query("DELETE FROM fusion_space_bookings WHERE id = $1", [bookingId]);
			return res.json({ message: "Fusion booking deleted" });
		}

		const index = fusionSpaceBookings.findIndex((item) => item.id === bookingId);
		if (index < 0) {
			return res.status(404).json({ message: "Fusion booking not found" });
		}
		if (req.user?.role === "student" && Number(fusionSpaceBookings[index].studentId) !== Number(req.user?.id)) {
			return res.status(403).json({ message: "Not allowed to delete this booking" });
		}
		fusionSpaceBookings.splice(index, 1);
		return res.json({ message: "Fusion booking deleted" });
	} catch (error) {
		console.error("Error deleting Fusion booking:", error.message);
		return res.status(500).json({ message: "Failed to delete Fusion booking", error: error.message });
	}
};

const updateFusionBookingStatus = async (req, res) => {
	try {
		const bookingId = Number(req.params.bookingId);
		const status = String(req.body?.status || "").trim().toLowerCase();
		if (!["approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "status must be approved or rejected" });
		}

		if (dbState.mode === "postgres") {
			const check = await pool.query("SELECT * FROM fusion_space_bookings WHERE id = $1", [bookingId]);
			if (check.rows.length === 0) {
				return res.status(404).json({ message: "Fusion booking not found" });
			}
			if (check.rows[0].status !== "pending") {
				return res.status(400).json({ message: "Only pending bookings can be updated" });
			}

			const updated = await pool.query(
				`UPDATE fusion_space_bookings
				SET status = $1, updated_at = NOW()
				WHERE id = $2
				RETURNING id, ticket_no, student_id, student_name, event_name, attendee_count, cooking_required, event_date, duration, details, status, created_at, updated_at;`,
				[status, bookingId]
			);

			const row = updated.rows[0];
			return res.json({
				message: "Fusion booking updated",
				booking: {
					id: row.id,
					ticket: row.ticket_no,
					studentId: row.student_id,
					user: row.student_name,
					event: row.event_name,
					count: row.attendee_count,
					cooking: row.cooking_required,
					date: row.event_date || "-",
					duration: row.duration || "-",
					details: row.details || "-",
					status: row.status,
					createdAt: row.created_at,
					updatedAt: row.updated_at,
				},
			});
		}

		const target = fusionSpaceBookings.find((item) => item.id === bookingId);
		if (!target) {
			return res.status(404).json({ message: "Fusion booking not found" });
		}
		if (target.status !== "pending") {
			return res.status(400).json({ message: "Only pending bookings can be updated" });
		}
		target.status = status;
		target.updatedAt = new Date().toISOString();
		return res.json({ message: "Fusion booking updated", booking: target });
	} catch (error) {
		console.error("Error updating Fusion booking status:", error.message);
		return res.status(500).json({ message: "Failed to update Fusion booking", error: error.message });
	}
};

const createEvent = async (req, res) => {
	try {
		const role = String(req.user?.role || "").toLowerCase();
		const payload = req.body || {};
		const eventType = normalizeEventType(payload.eventType);
		const eventName = String(payload.eventName || "").trim();
		const venue = String(payload.venue || "").trim();
		const eventDateTime = String(payload.eventDateTime || "").trim();
		const maxParticipants = Number(payload.maxParticipants || 0);
		const posterUrl = String(payload.posterUrl || "").trim();

		if (!eventName || !venue || !eventDateTime) {
			return res.status(400).json({ message: "eventName, venue and eventDateTime are required" });
		}

		if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
			return res.status(400).json({ message: "maxParticipants must be greater than 0" });
		}

		if (role === "faculty" && eventType !== "local_department") {
			return res.status(403).json({ message: "Faculty can only create Local Department events" });
		}

		const department = eventType === "local_department"
			? String(role === "faculty" ? (req.user?.department || "General") : (payload.department || req.user?.department || "General")).trim()
			: String(payload.department || "Club/Community").trim();

		if (dbState.mode === "postgres") {
			const nextIdResult = await pool.query(
				"SELECT nextval(pg_get_serial_sequence('events', 'id')) AS id"
			);
			const nextId = Number(nextIdResult.rows[0].id);
			const ticketNo = `EVT-${String(nextId).padStart(4, "0")}`;
			const uploadedPosterUrl = await uploadEventPoster(req, nextId);

			const insertResult = await pool.query(
				`INSERT INTO events
				(id, ticket_no, event_name, venue, event_datetime, department, event_type, max_participants, poster_url, created_by, created_by_name, created_by_role, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5::timestamp, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
				RETURNING *;`,
				[
					nextId,
					ticketNo,
					eventName,
					venue,
					eventDateTime,
					department || "General",
					eventType,
					maxParticipants,
					uploadedPosterUrl || posterUrl || null,
					req.user?.id || null,
					req.user?.name || req.user?.email || role,
					role,
				]
			);

			return res.status(201).json({
				message: "Event created",
				event: mapEventRow(insertResult.rows[0], 0, false),
			});
		}

		const now = new Date().toISOString();
		const uploadedPosterUrl = await uploadEventPoster(req, nextEventId);
		const row = {
			id: nextEventId,
			ticket_no: `EVT-${String(nextEventId).padStart(4, "0")}`,
			event_name: eventName,
			venue,
			event_datetime: eventDateTime,
			department: department || "General",
			event_type: eventType,
			max_participants: maxParticipants,
			poster_url: uploadedPosterUrl || posterUrl || "",
			created_by: req.user?.id || null,
			created_by_name: req.user?.name || req.user?.email || role,
			created_by_role: role,
			created_at: now,
			updated_at: now,
		};
		nextEventId += 1;
		events.unshift(row);

		return res.status(201).json({ message: "Event created", event: mapEventRow(row, 0, false) });
	} catch (error) {
		console.error("Error creating event:", error.message);
		return res.status(500).json({ message: "Failed to create event", error: error.message });
	}
};

const updateEvent = async (req, res) => {
	try {
		const eventId = Number(req.params.eventId);
		if (!Number.isFinite(eventId) || eventId <= 0) {
			return res.status(400).json({ message: "Invalid event id" });
		}

		const payload = req.body || {};
		const eventName = String(payload.eventName || "").trim();
		const venue = String(payload.venue || "").trim();
		const eventDateTime = String(payload.eventDateTime || "").trim();
		const maxParticipants = Number(payload.maxParticipants || 0);
		const posterUrl = String(payload.posterUrl || "").trim();
		const requestedType = normalizeEventType(payload.eventType);

		if (!eventName || !venue || !eventDateTime) {
			return res.status(400).json({ message: "eventName, venue and eventDateTime are required" });
		}

		if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
			return res.status(400).json({ message: "maxParticipants must be greater than 0" });
		}

		if (dbState.mode === "postgres") {
			const check = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
			if (check.rows.length === 0) {
				return res.status(404).json({ message: "Event not found" });
			}

			const current = check.rows[0];
			if (!canManageEvent(req.user, current)) {
				return res.status(403).json({ message: "Not allowed to update this event" });
			}

			const nextType = req.user?.role === "faculty" ? "local_department" : requestedType;
			if (req.user?.role === "faculty" && nextType !== "local_department") {
				return res.status(403).json({ message: "Faculty can only manage Local Department events" });
			}

			const department = nextType === "local_department"
				? String(req.user?.role === "faculty" ? (req.user?.department || current.department || "General") : (payload.department || current.department || req.user?.department || "General")).trim()
				: String(payload.department || current.department || "Club/Community").trim();
			const uploadedPosterUrl = await uploadEventPoster(req, eventId);

			const updated = await pool.query(
				`UPDATE events
				 SET event_name = $1,
				     venue = $2,
				     event_datetime = $3::timestamp,
				     department = $4,
				     event_type = $5,
				     max_participants = $6,
				     poster_url = $7,
				     updated_at = NOW()
				 WHERE id = $8
				 RETURNING *`,
				[eventName, venue, eventDateTime, department, nextType, maxParticipants, uploadedPosterUrl || posterUrl || null, eventId]
			);

			return res.json({
				message: "Event updated",
				event: mapEventRow(updated.rows[0], current.registered_count || 0, false),
			});
		}

		const current = events.find((item) => Number(item.id) === eventId);
		if (!current) {
			return res.status(404).json({ message: "Event not found" });
		}
		if (!canManageEvent(req.user, current)) {
			return res.status(403).json({ message: "Not allowed to update this event" });
		}

		const nextType = req.user?.role === "faculty" ? "local_department" : requestedType;
		if (req.user?.role === "faculty" && nextType !== "local_department") {
			return res.status(403).json({ message: "Faculty can only manage Local Department events" });
		}

		const department = nextType === "local_department"
			? String(req.user?.role === "faculty" ? (req.user?.department || current.department || "General") : (payload.department || current.department || req.user?.department || "General")).trim()
			: String(payload.department || current.department || "Club/Community").trim();
		const uploadedPosterUrl = await uploadEventPoster(req, eventId);

		current.event_name = eventName;
		current.venue = venue;
		current.event_datetime = eventDateTime;
		current.department = department;
		current.event_type = nextType;
		current.max_participants = maxParticipants;
		current.poster_url = uploadedPosterUrl || posterUrl || "";
		current.updated_at = new Date().toISOString();

		return res.json({ message: "Event updated", event: mapEventRow(current, 0, false) });
	} catch (error) {
		console.error("Error updating event:", error.message);
		return res.status(500).json({ message: "Failed to update event", error: error.message });
	}
};

const deleteEvent = async (req, res) => {
	try {
		const eventId = Number(req.params.eventId);
		if (!Number.isFinite(eventId) || eventId <= 0) {
			return res.status(400).json({ message: "Invalid event id" });
		}

		if (dbState.mode === "postgres") {
			const check = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
			if (check.rows.length === 0) {
				return res.status(404).json({ message: "Event not found" });
			}
			if (!canManageEvent(req.user, check.rows[0])) {
				return res.status(403).json({ message: "Not allowed to delete this event" });
			}

			await pool.query("DELETE FROM events WHERE id = $1", [eventId]);
			return res.json({ message: "Event deleted" });
		}

		const index = events.findIndex((item) => Number(item.id) === eventId);
		if (index < 0) {
			return res.status(404).json({ message: "Event not found" });
		}
		if (!canManageEvent(req.user, events[index])) {
			return res.status(403).json({ message: "Not allowed to delete this event" });
		}

		events.splice(index, 1);
		for (let i = eventRegistrations.length - 1; i >= 0; i -= 1) {
			if (Number(eventRegistrations[i].event_id) === eventId) {
				eventRegistrations.splice(i, 1);
			}
		}
		return res.json({ message: "Event deleted" });
	} catch (error) {
		console.error("Error deleting event:", error.message);
		return res.status(500).json({ message: "Failed to delete event", error: error.message });
	}
};

const listEvents = async (req, res) => {
	try {
		const role = String(req.user?.role || "").toLowerCase();
		const userId = Number(req.user?.id || 0);
		const search = String(req.query?.search || "").trim().toLowerCase();
		const eventType = normalizeEventType(req.query?.eventType || "local_department");
		const dateFilter = String(req.query?.date || "").trim();

		if (dbState.mode === "postgres") {
			const params = [eventType, role === "student" ? userId : null];
			let query = `
				SELECT
					e.*,
					COALESCE(er.count, 0) AS registered_count,
					CASE
						WHEN $2::int IS NULL THEN false
						ELSE EXISTS (
							SELECT 1 FROM event_registrations r
							WHERE r.event_id = e.id AND r.student_id = $2
						)
					END AS is_registered
				FROM events e
				LEFT JOIN (
					SELECT event_id, COUNT(*)::int AS count
					FROM event_registrations
					GROUP BY event_id
				) er ON er.event_id = e.id
				WHERE e.event_type = $1
			`;

			if (search) {
				params.push(`%${search}%`);
				query += ` AND (LOWER(e.event_name) LIKE $${params.length} OR LOWER(e.venue) LIKE $${params.length} OR LOWER(COALESCE(e.department, '')) LIKE $${params.length} OR LOWER(COALESCE(e.ticket_no, '')) LIKE $${params.length})`;
			}

			if (dateFilter) {
				params.push(dateFilter);
				query += ` AND DATE(e.event_datetime) = $${params.length}::date`;
			}

			query += " ORDER BY e.event_datetime DESC, e.created_at DESC";

			const result = await pool.query(query, params);
			const rows = result.rows.map((row) => mapEventRow(row, row.registered_count, row.is_registered));
			return res.json({ total: rows.length, events: rows });
		}

		const rows = events
			.filter((row) => row.event_type === eventType)
			.filter((row) => {
				if (!search) return true;
				const target = `${row.ticket_no} ${row.event_name} ${row.venue} ${row.department}`.toLowerCase();
				return target.includes(search);
			})
			.filter((row) => {
				if (!dateFilter) return true;
				return String(row.event_datetime || "").slice(0, 10) === dateFilter;
			})
			.sort((a, b) => new Date(b.event_datetime).getTime() - new Date(a.event_datetime).getTime())
			.map((row) => {
				const registeredCount = eventRegistrations.filter((item) => Number(item.event_id) === Number(row.id)).length;
				const isRegistered = role === "student"
					? eventRegistrations.some((item) => Number(item.event_id) === Number(row.id) && Number(item.student_id) === userId)
					: false;
				return mapEventRow(row, registeredCount, isRegistered);
			});

		return res.json({ total: rows.length, events: rows });
	} catch (error) {
		console.error("Error listing events:", error.message);
		return res.status(500).json({ message: "Failed to list events", error: error.message });
	}
};

const registerEvent = async (req, res) => {
	try {
		const eventId = Number(req.params.eventId);
		const studentId = Number(req.user?.id || 0);
		const studentName = req.user?.name || req.user?.email || "Student";

		if (!Number.isFinite(eventId) || eventId <= 0) {
			return res.status(400).json({ message: "Invalid event id" });
		}

		if (dbState.mode === "postgres") {
			await pool.query("BEGIN");
			try {
				const eventResult = await pool.query(
					"SELECT id, max_participants FROM events WHERE id = $1 FOR UPDATE",
					[eventId]
				);
				if (eventResult.rows.length === 0) {
					await pool.query("ROLLBACK");
					return res.status(404).json({ message: "Event not found" });
				}

				const duplicateCheck = await pool.query(
					"SELECT id FROM event_registrations WHERE event_id = $1 AND student_id = $2 LIMIT 1",
					[eventId, studentId]
				);
				if (duplicateCheck.rows.length > 0) {
					await pool.query("ROLLBACK");
					return res.status(409).json({ message: "You already registered for this event" });
				}

				const countResult = await pool.query(
					"SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1",
					[eventId]
				);
				const registeredCount = Number(countResult.rows[0]?.count || 0);
				const maxParticipants = Number(eventResult.rows[0]?.max_participants || 0);

				if (registeredCount >= maxParticipants) {
					await pool.query("ROLLBACK");
					return res.status(409).json({ message: "Event registration is full" });
				}

				await pool.query(
					`INSERT INTO event_registrations
					(event_id, student_id, student_name, student_roll_no, created_at)
					VALUES ($1, $2, $3, $4, NOW())`,
					[eventId, studentId, studentName, req.user?.rollNo || null]
				);

				await pool.query("COMMIT");
				return res.status(201).json({ message: "Registered successfully" });
			} catch (error) {
				await pool.query("ROLLBACK");
				throw error;
			}
		}

		const targetEvent = events.find((item) => Number(item.id) === eventId);
		if (!targetEvent) {
			return res.status(404).json({ message: "Event not found" });
		}

		const alreadyRegistered = eventRegistrations.some(
			(item) => Number(item.event_id) === eventId && Number(item.student_id) === studentId
		);
		if (alreadyRegistered) {
			return res.status(409).json({ message: "You already registered for this event" });
		}

		const registeredCount = eventRegistrations.filter((item) => Number(item.event_id) === eventId).length;
		if (registeredCount >= Number(targetEvent.max_participants || 0)) {
			return res.status(409).json({ message: "Event registration is full" });
		}

		eventRegistrations.push({
			id: nextEventRegistrationId++,
			event_id: eventId,
			student_id: studentId,
			student_name: studentName,
			student_roll_no: req.user?.rollNo || null,
			created_at: new Date().toISOString(),
		});

		return res.status(201).json({ message: "Registered successfully" });
	} catch (error) {
		console.error("Error registering event:", error.message);
		return res.status(500).json({ message: "Failed to register event", error: error.message });
	}
};

const unregisterEvent = async (req, res) => {
	try {
		const eventId = Number(req.params.eventId);
		const studentId = Number(req.user?.id || 0);

		if (!Number.isFinite(eventId) || eventId <= 0) {
			return res.status(400).json({ message: "Invalid event id" });
		}

		if (dbState.mode === "postgres") {
			const result = await pool.query(
				"DELETE FROM event_registrations WHERE event_id = $1 AND student_id = $2 RETURNING id",
				[eventId, studentId]
			);

			if (result.rows.length === 0) {
				return res.status(404).json({ message: "Registration not found" });
			}

			return res.json({ message: "Registration cancelled" });
		}

		const index = eventRegistrations.findIndex(
			(item) => Number(item.event_id) === eventId && Number(item.student_id) === studentId
		);
		if (index < 0) {
			return res.status(404).json({ message: "Registration not found" });
		}

		eventRegistrations.splice(index, 1);
		return res.json({ message: "Registration cancelled" });
	} catch (error) {
		console.error("Error cancelling event registration:", error.message);
		return res.status(500).json({ message: "Failed to cancel registration", error: error.message });
	}
};

module.exports = {
	createServiceRequest,
	listServiceRequests,
	updateServiceRequestStatus,
	acceptIdCardReissueRequest,
	escalateIdCardReissueRequest,
	grantIboxRequisitionPermission,
	convertIboxRequisitionToComplaint,
	deleteServiceRequest,
	createHallTicket,
	listHallTickets,
	downloadHallTicket,
	replaceHallTicket,
	deleteHallTicket,
	verifyHallTicket,
	listHallTicketAudit,
	createGatepassRequest,
	listGatepassRequests,
	updateGatepassStatus,
	createLatecomerRequest,
	listLatecomerRequests,
	updateLatecomerStatus,
	createAoBooking,
	listAoBookings,
	deleteAoBooking,
	updateAoBookingStatus,
	createFusionBooking,
	listFusionBookings,
	deleteFusionBooking,
	updateFusionBookingStatus,
	createEvent,
	updateEvent,
	deleteEvent,
	listEvents,
	registerEvent,
	unregisterEvent,
	listWaiverRequests,
	updateWaiverRequestStatus,
};
