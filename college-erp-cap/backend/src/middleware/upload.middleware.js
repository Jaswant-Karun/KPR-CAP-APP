const normalizeUploadPayload = (req, res, next) => {
	const { fileName, mimeType, fileBase64 } = req.body || {};

	if (!fileBase64) {
		req.upload = null;
		return next();
	}

	try {
		const base64Value = String(fileBase64).split(",").pop();
		const buffer = Buffer.from(base64Value, "base64");

		req.upload = {
			originalname: fileName || `upload-${Date.now()}`,
			mimetype: mimeType || "application/octet-stream",
			buffer,
			size: buffer.length,
		};

		return next();
	} catch (error) {
		return res.status(400).json({ message: "Invalid base64 upload payload" });
	}
};

module.exports = {
	normalizeUploadPayload,
};
