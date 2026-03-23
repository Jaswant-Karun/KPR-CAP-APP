const { validateServiceRequest } = require("../validations/student.validation");

const serviceRequests = [];
let nextServiceRequestId = 1;
const gatepassRequests = [];
let nextGatepassId = 1;

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

const createGatepassRequest = (req, res) => {
	const payload = req.body || {};
	if (!payload.reason || !payload.fromDate || !payload.toDate) {
		return res.status(400).json({ message: "reason, fromDate and toDate are required" });
	}

	const requestItem = {
		id: nextGatepassId++,
		studentId: req.user?.id || null,
		studentName: payload.studentName || req.user?.email || "Student",
		rollNo: payload.rollNo || null,
		reason: String(payload.reason),
		fromDate: String(payload.fromDate),
		toDate: String(payload.toDate),
		status: "pending",
		approvedBy: null,
		remarks: payload.remarks || "",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	gatepassRequests.push(requestItem);
	return res.status(201).json({ message: "Gatepass request created", gatepass: requestItem });
};

const listGatepassRequests = (req, res) => {
	const role = req.user?.role;
	const userId = req.user?.id;
	const status = String(req.query?.status || "").trim().toLowerCase();

	let rows = gatepassRequests;
	if (role === "student") {
		rows = rows.filter((item) => item.studentId === userId);
	}

	if (status) {
		rows = rows.filter((item) => item.status === status);
	}

	return res.json({ total: rows.length, requests: rows });
};

const updateGatepassStatus = (req, res) => {
	const gatepassId = Number(req.params.gatepassId);
	const status = String(req.body?.status || "").toLowerCase();
	if (!["approved", "rejected"].includes(status)) {
		return res.status(400).json({ message: "status must be approved or rejected" });
	}

	const target = gatepassRequests.find((item) => item.id === gatepassId);
	if (!target) {
		return res.status(404).json({ message: "Gatepass request not found" });
	}

	target.status = status;
	target.remarks = req.body?.remarks || target.remarks;
	target.approvedBy = req.user?.id || null;
	target.updatedAt = new Date().toISOString();
	return res.json({ message: "Gatepass request updated", gatepass: target });
};

module.exports = {
	createServiceRequest,
	listServiceRequests,
	updateServiceRequestStatus,
	createGatepassRequest,
	listGatepassRequests,
	updateGatepassStatus,
};
