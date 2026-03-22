const validateServiceRequest = ({ title, category, description }) => {
	if (!title || String(title).trim().length < 3) {
		return { valid: false, message: "Title must be at least 3 characters" };
	}

	if (!category || String(category).trim().length < 2) {
		return { valid: false, message: "Category is required" };
	}

	if (!description || String(description).trim().length < 10) {
		return { valid: false, message: "Description must be at least 10 characters" };
	}

	return { valid: true };
};

module.exports = {
	validateServiceRequest,
};
