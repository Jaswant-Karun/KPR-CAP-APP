const { uploadBuffer } = require("../config/cloudinary");

const uploadFile = async ({ buffer, filename, folder }) => {
	if (!buffer) {
		throw new Error("buffer is required");
	}

	return uploadBuffer({
		buffer,
		filename: filename || `file-${Date.now()}`,
		folder: folder || "kpr-erp",
	});
};

module.exports = {
	uploadFile,
};
