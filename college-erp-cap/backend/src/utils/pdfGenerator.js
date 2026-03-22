const generatePdfBuffer = async ({ title = "Document", lines = [] }) => {
	const content = [title, "", ...lines].join("\n");
	return Buffer.from(content, "utf-8");
};

module.exports = {
	generatePdfBuffer,
};
