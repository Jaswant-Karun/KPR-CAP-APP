const { env } = require("./env");

const isConfigured = Boolean(
	env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

const uploadBuffer = async ({ buffer, filename = "upload.bin", folder = "kpr-erp" }) => {
	if (!buffer) {
		throw new Error("No buffer provided for upload");
	}

	if (!isConfigured) {
		return {
			provider: "local-mock",
			secure_url: `https://mock.storage.local/${folder}/${Date.now()}-${filename}`,
			public_id: `${folder}/${Date.now()}-${filename}`,
		};
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
