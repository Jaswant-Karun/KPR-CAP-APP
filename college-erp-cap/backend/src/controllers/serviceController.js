const { validateServiceRequest } = require("../validations/student.validation");
const { pool, dbState } = require("../config/db");

const serviceRequests = [];
let nextServiceRequestId = 1;
const gatepassRequests = [];
let nextGatepassId = 1;
const aoServiceBookings = [];
let nextAoBookingId = 1;
const fusionSpaceBookings = [];
let nextFusionBookingId = 1;

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
				`INSERT INTO gatepass_requests (id, ticket_no, student_id, student_name, roll_no, type, reason, from_date, to_date, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW())
				RETURNING id, ticket_no, student_id, student_name, roll_no, type, reason, from_date, to_date, status, approved_by, approved_by_name, remarks, created_at, updated_at;`,
				[
					nextId,
					ticketNo,
					req.user?.id || null,
					payload.studentName || req.user?.name || req.user?.email || "Student",
					payload.rollNo || derivedRollNo,
					String(payload.type || "Day Pass"),
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
			type: String(payload.type || "Day Pass"),
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

			query += " ORDER BY created_at DESC";

			const result = await pool.query(query, params);
			const requests = result.rows.map((row) => ({
				id: row.id,
				ticketNo: row.ticket_no,
				studentId: row.student_id,
				studentName: row.student_name,
				rollNo: row.roll_no,
				type: row.type,
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
				RETURNING id, ticket_no, student_id, student_name, roll_no, type, reason, from_date, to_date, status, approved_by, approved_by_name, remarks, created_at, updated_at;`,
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
};
