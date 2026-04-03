const express = require("express");
const cors = require("cors");
const path = require("path");
const auth = require("./middleware/auth.middleware");
const maintenance = require("./middleware/maintenance.middleware");
const { getStudentProfile } = require("./controllers/studentController");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");
const { pool, dbState } = require("./config/db");

const app = express();

const cfacRoutes = require("./routes/cfac.routes");
const courseRoutes = require("./routes/course.routes");
const internalMarkCourseRoutes = require("./routes/internalMarkCourse.routes");
const departmentRoutes = require("./routes/department.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const ndcAchievementRoutes = require("./routes/ndcAchievement.routes");

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(maintenance);

// Hard block non-PostgreSQL execution to avoid any accidental in-memory fallback paths.
app.use((req, res, next) => {
	if (dbState.mode !== "postgres") {
		return res.status(503).json({
			message: "Database is unavailable. PostgreSQL is required for all features.",
		});
	}
	return next();
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/faculty", require("./routes/faculty.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/timetable", require("./routes/timetable.routes"));
app.use("/api/services", require("./routes/service.routes"));
app.use("/api/cfac", cfacRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/internal-mark-courses", internalMarkCourseRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ndc-achievements", ndcAchievementRoutes);
app.use("/api/files", require("./routes/files.routes"));
app.use("/api/digital-assets", require("./routes/digitalAssets.routes"));
app.get("/api/profile", auth, getStudentProfile);

app.get("/", (req, res) => {
	res.send("College ERP Backend (PostgreSQL) Running");
});

app.get("/api/health", async (req, res) => {
	try {
		const dbPing = await pool.query("SELECT NOW() AS now");
		const tableChecks = await Promise.all([
			pool.query("SELECT to_regclass('public.users') AS table_name"),
			pool.query("SELECT to_regclass('public.service_requests') AS table_name"),
			pool.query("SELECT to_regclass('public.ndc_achievements') AS table_name"),
		]);

		const schema = {
			users: Boolean(tableChecks[0].rows[0]?.table_name),
			serviceRequests: Boolean(tableChecks[1].rows[0]?.table_name),
			ndcAchievements: Boolean(tableChecks[2].rows[0]?.table_name),
		};

		return res.json({
			status: "ok",
			database: dbState.mode,
			timestamp: dbPing.rows[0]?.now,
			schema,
		});
	} catch (error) {
		return res.status(500).json({
			status: "error",
			database: dbState.mode,
			message: "Health check failed",
			error: error.message,
		});
	}
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
