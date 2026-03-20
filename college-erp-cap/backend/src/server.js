const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/faculty", require("./routes/faculty.routes"));

app.get("/", (req, res) => {
  res.send("College ERP Backend Running");
});

app.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);
