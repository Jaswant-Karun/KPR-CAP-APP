const { uploadFile } = require("../services/storage.service");
const { pool, dbState } = require("../config/db");

const idCardUploadAudit = [];
let nextAuditId = 1;

const memoryLatestIdCardPhotos = new Map();

const upsertLatestStudentIdCardPhoto = async ({ studentId, file, updatedBy }) => {
	if (!studentId) {
		return;
	}

	if (dbState.mode === "postgres") {
		await pool.query(
			`
				INSERT INTO student_id_card_photos (student_id, file_url, file_public_id, file_provider, updated_by, updated_at)
				VALUES ($1, $2, $3, $4, $5, NOW())
				ON CONFLICT (student_id)
				DO UPDATE SET
					file_url = EXCLUDED.file_url,
					file_public_id = EXCLUDED.file_public_id,
					file_provider = EXCLUDED.file_provider,
					updated_by = EXCLUDED.updated_by,
					updated_at = NOW();
			`,
			[Number(studentId), file.url, file.publicId, file.provider, updatedBy || null]
		);
		return;
	}

	memoryLatestIdCardPhotos.set(String(studentId), {
		url: file.url,
		publicId: file.publicId,
		provider: file.provider,
		updatedBy: updatedBy || null,
		updatedAt: new Date().toISOString(),
	});
};

const getLatestIdCardPhotoByStudentId = async (studentId) => {
	const normalizedStudentId = Number(studentId);
	if (!Number.isInteger(normalizedStudentId) || normalizedStudentId <= 0) {
		return null;
	}

	if (dbState.mode === "postgres") {
		const result = await pool.query(
			`
				SELECT student_id, file_url, file_public_id, file_provider, updated_by, updated_at
				FROM student_id_card_photos
				WHERE student_id = $1
				LIMIT 1;
			`,
			[normalizedStudentId]
		);

		if (result.rows.length === 0) {
			return null;
		}

		return {
			studentId: Number(result.rows[0].student_id),
			url: result.rows[0].file_url,
			publicId: result.rows[0].file_public_id,
			provider: result.rows[0].file_provider,
			updatedBy: result.rows[0].updated_by,
			updatedAt: result.rows[0].updated_at,
		};
	}

	if (memoryLatestIdCardPhotos.has(String(normalizedStudentId))) {
		return {
			studentId: normalizedStudentId,
			...memoryLatestIdCardPhotos.get(String(normalizedStudentId)),
		};
	}

	const latestAuditRow = idCardUploadAudit.find(
		(item) => String(item.studentId || "") === String(normalizedStudentId)
	);

	if (!latestAuditRow) {
		return null;
	}

	return {
		studentId: normalizedStudentId,
		url: latestAuditRow.file?.url,
		publicId: latestAuditRow.file?.publicId,
		provider: latestAuditRow.file?.provider,
		updatedBy: latestAuditRow.uploadedBy?.id,
		updatedAt: latestAuditRow.uploadedAt,
	};
};

const deleteLatestIdCardPhotoByStudentId = async (studentId) => {
	const normalizedStudentId = Number(studentId);
	if (!Number.isInteger(normalizedStudentId) || normalizedStudentId <= 0) {
		return false;
	}

	if (dbState.mode === "postgres") {
		const result = await pool.query(
			`DELETE FROM student_id_card_photos WHERE student_id = $1`,
			[normalizedStudentId]
		);
		return Number(result.rowCount || 0) > 0;
	}

	if (memoryLatestIdCardPhotos.has(String(normalizedStudentId))) {
		memoryLatestIdCardPhotos.delete(String(normalizedStudentId));
		return true;
	}

	return false;
};

const insertAuditRecord = async (record) => {
	if (dbState.mode === "postgres") {
		const result = await pool.query(
			`
				INSERT INTO id_card_upload_audit
					(student_id, uploader_id, uploader_role, uploader_email, uploader_name, file_name, file_url, file_public_id, file_provider, client_ip, user_agent)
				VALUES
					($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
				RETURNING id, created_at;
			`,
			[
				record.studentId,
				record.uploadedBy.id,
				record.uploadedBy.role,
				record.uploadedBy.email,
				record.uploadedBy.name,
				record.file.name,
				record.file.url,
				record.file.publicId,
				record.file.provider,
				record.client.ip,
				record.client.userAgent,
			]
		);

		return {
			id: result.rows[0].id,
			uploadedAt: result.rows[0].created_at,
		};
	}

	const auditRecord = {
		...record,
		id: nextAuditId++,
		uploadedAt: new Date().toISOString(),
	};

	idCardUploadAudit.unshift(auditRecord);
	if (idCardUploadAudit.length > 500) {
		idCardUploadAudit.length = 500;
	}

	return {
		id: auditRecord.id,
		uploadedAt: auditRecord.uploadedAt,
	};
};

const listAuditRows = async ({ studentId, uploaderId }) => {
	if (dbState.mode === "postgres") {
		const values = [];
		const where = [];

		if (studentId) {
			values.push(studentId);
			where.push(`student_id = $${values.length}`);
		}

		if (uploaderId) {
			values.push(Number(uploaderId));
			where.push(`uploader_id = $${values.length}`);
		}

		const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
		const result = await pool.query(
			`
				SELECT
					id,
					student_id,
					uploader_id,
					uploader_role,
					uploader_email,
					uploader_name,
					file_name,
					file_url,
					file_public_id,
					file_provider,
					client_ip,
					user_agent,
					created_at
				FROM id_card_upload_audit
				${whereSql}
				ORDER BY created_at DESC
				LIMIT 500;
			`,
			values
		);

		return result.rows.map((row) => ({
			id: row.id,
			studentId: row.student_id,
			uploadedBy: {
				id: row.uploader_id,
				role: row.uploader_role,
				email: row.uploader_email,
				name: row.uploader_name,
			},
			file: {
				name: row.file_name,
				url: row.file_url,
				publicId: row.file_public_id,
				provider: row.file_provider,
			},
			client: {
				ip: row.client_ip,
				userAgent: row.user_agent,
			},
			uploadedAt: row.created_at,
		}));
	}

	let rows = idCardUploadAudit;
	if (studentId) {
		rows = rows.filter((item) => String(item.studentId || "") === studentId);
	}

	if (uploaderId) {
		rows = rows.filter((item) => String(item.uploadedBy?.id || "") === String(uploaderId));
	}

	return rows;
};

const uploadStudentIdCard = async (req, res) => {
	if (!req.upload || !req.upload.buffer) {
		return res.status(400).json({ message: "ID card file payload is required" });
	}

	const studentId = req.body?.studentId ? String(req.body.studentId) : null;
	const normalizedStudentId = Number(studentId);
	if (!Number.isInteger(normalizedStudentId) || normalizedStudentId <= 0) {
		return res.status(400).json({ message: "Valid studentId is required" });
	}

	const originalName = String(req.upload.originalname || "id-card.jpg").replace(/\s+/g, "-");
	const fileName = `${normalizedStudentId}-${Date.now()}-${originalName}`;

	try {
		const stored = await uploadFile({
			buffer: req.upload.buffer,
			filename: fileName,
			folder: "kpr-erp/id-cards",
		});

		const auditRecord = {
			studentId: String(normalizedStudentId),
			uploadedBy: {
				id: req.user?.id || null,
				role: req.user?.role || "unknown",
				email: req.user?.email || null,
				name: req.user?.name || null,
			},
			file: {
				name: fileName,
				url: stored.secure_url,
				publicId: stored.public_id,
				provider: stored.provider,
			},
			client: {
				ip: req.ip,
				userAgent: req.get("user-agent") || null,
			},
		};

		await upsertLatestStudentIdCardPhoto({
			studentId: normalizedStudentId,
			file: {
				url: stored.secure_url,
				publicId: stored.public_id,
				provider: stored.provider,
			},
			updatedBy: req.user?.id || null,
		});

		const audit = await insertAuditRecord(auditRecord);

		return res.status(201).json({
			message: "ID card uploaded successfully",
			studentId: String(normalizedStudentId),
			file: {
				url: stored.secure_url,
				publicId: stored.public_id,
				provider: stored.provider,
			},
			audit: {
				id: audit.id,
				uploadedAt: audit.uploadedAt,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to upload ID card", error: error.message });
	}
};

const listIdCardUploadAudit = async (req, res) => {
	const studentId = req.query?.studentId ? String(req.query.studentId) : "";
	const uploaderId = req.query?.uploaderId ? String(req.query.uploaderId) : "";

	try {
		const rows = await listAuditRows({ studentId, uploaderId });
		return res.json({ total: rows.length, uploads: rows });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch upload audit", error: error.message });
	}
};

const getStudentIdCard = async (req, res) => {
	const studentId = Number(req.params?.studentId || 0);
	if (!Number.isInteger(studentId) || studentId <= 0) {
		return res.status(400).json({ message: "Valid studentId is required" });
	}

	try {
		const photo = await getLatestIdCardPhotoByStudentId(studentId);
		if (!photo || !photo.url) {
			return res.status(404).json({ message: "ID card photo not found for this student" });
		}

		return res.json({
			studentId: String(studentId),
			idCardPhoto: {
				url: photo.url,
				publicId: photo.publicId,
				provider: photo.provider,
				updatedBy: photo.updatedBy,
				updatedAt: photo.updatedAt,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch student ID card", error: error.message });
	}
};

const deleteStudentIdCard = async (req, res) => {
	const studentId = Number(req.params?.studentId || 0);
	if (!Number.isInteger(studentId) || studentId <= 0) {
		return res.status(400).json({ message: "Valid studentId is required" });
	}

	try {
		const removed = await deleteLatestIdCardPhotoByStudentId(studentId);
		if (!removed) {
			return res.status(404).json({ message: "No ID card photo found to delete" });
		}

		return res.json({ message: "ID card photo deleted", studentId: String(studentId) });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete student ID card", error: error.message });
	}
};

module.exports = {
	uploadStudentIdCard,
	listIdCardUploadAudit,
	getLatestIdCardPhotoByStudentId,
	getStudentIdCard,
	deleteStudentIdCard,
};