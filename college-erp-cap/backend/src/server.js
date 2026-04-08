const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const app = require("./app");

const PORT = env.PORT || 5000;
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 10000);

let dbConnected = false;
let dbRetryTimer = null;

const startHttpServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });

  server.on("error", (error) => {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  });
};

const scheduleReconnect = () => {
  if (dbRetryTimer) {
    return;
  }

  dbRetryTimer = setTimeout(async () => {
    dbRetryTimer = null;
    await connectWithRetry();
  }, DB_RETRY_MS);
};

const connectWithRetry = async () => {
  if (dbConnected) {
    return;
  }

  try {
    await connectDB();
    dbConnected = true;
    console.log("Database connected and schema initialized");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error(`Retrying database connection in ${DB_RETRY_MS}ms`);
    scheduleReconnect();
  }
};

const start = async () => {
  startHttpServer(PORT);
  await connectWithRetry();
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

start();

