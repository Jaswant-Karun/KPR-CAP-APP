const fs = require("fs/promises");
const path = require("path");
const { env } = require("./env");

const isConfigured = Boolean(
	env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

const sanitizeSegment = (value = "") => String(value).replace(/[^a-zA-Z0-9._-]/g, "-");

const saveToLocalDisk = async ({ buffer, filename, folder }) => {
	const uploadRoot = path.resolve(__dirname, "../../uploads");
	const safeFolderParts = String(folder || "kpr-erp")
		.split("/")
		.map((part) => sanitizeSegment(part))
		.filter(Boolean);
	const safeFilename = sanitizeSegment(filename || `file-${Date.now()}.bin`);
	const stampedFilename = `${Date.now()}-${safeFilename}`;

	const destinationDir = path.join(uploadRoot, ...safeFolderParts);
	await fs.mkdir(destinationDir, { recursive: true });

	const absoluteFilePath = path.join(destinationDir, stampedFilename);
	await fs.writeFile(absoluteFilePath, buffer);

	const publicId = [...safeFolderParts, stampedFilename].join("/");
	const defaultBaseUrl = `http://localhost:${env.PORT || 5000}`;
	const baseUrl = String(env.APP_BASE_URL || defaultBaseUrl).replace(/\/+$/, "");
	const secureUrl = `${baseUrl}/uploads/${publicId}`;

	return {
		provider: "local-disk",
		secure_url: secureUrl,
		public_id: publicId,
	};
};

const uploadBuffer = async ({ buffer, filename = "upload.bin", folder = "kpr-erp" }) => {
	if (!buffer) {
		throw new Error("No buffer provided for upload");
	}

	if (!isConfigured) {
		return saveToLocalDisk({ buffer, filename, folder });
	}

	// Cloudinary SDK is optional in this project setup.
	return {
		provider: "cloudinary",
		secure_url: `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${folder}/${filename}`,
		public_id: `${folder}/${Date.now()}-${filename}`,
	};
};

module.exports = {
	isConfigured,
	uploadBuffer,
};
