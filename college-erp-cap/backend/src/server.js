const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const app = require("./app");

const PORT = env.PORT || 5000;
const MAX_PORT_RETRIES = 10;

const startHttpServer = (port, retriesLeft = MAX_PORT_RETRIES) => {
  const server = app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && retriesLeft > 0) {
      const nextPort = Number(port) + 1;
      console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`);
      return startHttpServer(nextPort, retriesLeft - 1);
    }

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

