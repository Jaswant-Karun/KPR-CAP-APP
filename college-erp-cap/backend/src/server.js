const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const { connectDB } = require("./config/db");
const auth = require("./middleware/auth.middleware");
const { getStudentProfile } = require("./controllers/studentController");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/faculty", require("./routes/faculty.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/timetable", require("./routes/timetable.routes"));
app.get("/api/profile", auth, getStudentProfile);

app.get("/", (req, res) => {
  res.send("College ERP Backend (PostgreSQL) Running");
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

start();
