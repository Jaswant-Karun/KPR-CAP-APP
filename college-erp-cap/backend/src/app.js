const express = require("express");
const cors = require("cors");
const auth = require("./middleware/auth.middleware");
const { getStudentProfile } = require("./controllers/studentController");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

const cfacRoutes = require("./routes/cfac.routes");

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/faculty", require("./routes/faculty.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/timetable", require("./routes/timetable.routes"));
app.use("/api/services", require("./routes/service.routes"));
app.use("/api/cfac", cfacRoutes);
app.use("/api/files", require("./routes/files.routes"));
app.get("/api/profile", auth, getStudentProfile);

app.get("/", (req, res) => {
	res.send("College ERP Backend (PostgreSQL) Running");
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
