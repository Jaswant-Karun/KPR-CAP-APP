const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const app = require("./app");

const PORT = env.PORT || 5000;

const startHttpServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  });
};

const start = async () => {
  try {
    await connectDB();
    startHttpServer(PORT);
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

start();

