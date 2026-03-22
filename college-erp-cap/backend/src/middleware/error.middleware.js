const notFoundHandler = (req, res) => {
	res.status(404).json({
		message: `Route not found: ${req.method} ${req.originalUrl}`,
	});
};

const errorHandler = (error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	const status = Number(error.statusCode) || 500;
	return res.status(status).json({
		message: error.message || "Internal server error",
		...(process.env.NODE_ENV !== "production" ? { stack: error.stack } : {}),
	});
};

module.exports = {
	notFoundHandler,
	errorHandler,
};
