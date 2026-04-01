const express = require("express");
const cors = require("cors");
const path = require("path");
const auth = require("./middleware/auth.middleware");
const maintenance = require("./middleware/maintenance.middleware");
const { getStudentProfile } = require("./controllers/studentController");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

const cfacRoutes = require("./routes/cfac.routes");
const courseRoutes = require("./routes/course.routes");
const internalMarkCourseRoutes = require("./routes/internalMarkCourse.routes");
const departmentRoutes = require("./routes/department.routes");

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(maintenance);

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
app.use("/api/files", require("./routes/files.routes"));
app.use("/api/digital-assets", require("./routes/digitalAssets.routes"));
app.get("/api/profile", auth, getStudentProfile);

app.get("/", (req, res) => {
	res.send("College ERP Backend (PostgreSQL) Running");
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
