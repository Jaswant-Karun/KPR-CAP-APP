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
const hallTickets = [];
let nextHallTicketId = 1;
const hallTicketAudit = [];
let nextHallTicketAuditId = 1;
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

const createServiceRequest = (req, res) => {
	const payload = {
		title: req.body?.title,
		category: req.body?.category,
		description: req.body?.description,
	};

	const validation = validateServiceRequest(payload);
	if (!validation.valid) {
		return res.status(400).json({ message: validation.message });
	}

	const requestItem = {
		id: nextServiceRequestId++,
		title: payload.title,
		category: payload.category,
		description: payload.description,
		status: "open",
		createdBy: req.user?.id || null,
		role: req.user?.role || "student",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	serviceRequests.push(requestItem);
	return res.status(201).json({ message: "Service request created", request: requestItem });
};

const listServiceRequests = (req, res) => {
	const role = req.user?.role;
	const userId = req.user?.id;
	const status = String(req.query?.status || "").trim().toLowerCase();

	let rows = serviceRequests;
	if (role === "student") {
		rows = rows.filter((item) => item.createdBy === userId);
	}

	if (status) {
		rows = rows.filter((item) => item.status === status);
	}

	return res.json({ total: rows.length, requests: rows });
};

const updateServiceRequestStatus = (req, res) => {
	const requestId = Number(req.params.requestId);
	const status = String(req.body?.status || "").toLowerCase();
	const allowed = ["open", "in-progress", "resolved", "rejected"];

	if (!allowed.includes(status)) {
		return res.status(400).json({ message: "Invalid status value" });
	}

	const target = serviceRequests.find((item) => item.id === requestId);
	if (!target) {
		return res.status(404).json({ message: "Service request not found" });
	}

	target.status = status;
	target.updatedAt = new Date().toISOString();
	return res.json({ message: "Service request updated", request: target });
};

const createGatepassRequest = async (req, res) => {
	try {
		const payload = req.body || {};
		if (!payload.reason || !payload.fromDate || !payload.toDate) {
			return res.status(400).json({ message: "reason, fromDate and toDate are required" });
		}

		const passCategory = normalizeGatepassCategory(payload.passCategory || payload.studentCategory);
		const passType = normalizeGatepassType(payload.type);

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

module.exports = {
	createServiceRequest,
	listServiceRequests,
	updateServiceRequestStatus,
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
	createAoBooking,
	listAoBookings,
	deleteAoBooking,
	updateAoBookingStatus,
	createFusionBooking,
	listFusionBookings,
	deleteFusionBooking,
	updateFusionBookingStatus,
	listWaiverRequests,
	updateWaiverRequestStatus,
};
