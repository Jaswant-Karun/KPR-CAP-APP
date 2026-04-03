const net = require("net");
const { execFileSync } = require("child_process");

const port = Number(process.argv[2] || process.env.PORT || 5000);

const isPortListening = () =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });

    socket.on("error", () => resolve(false));
  });

const killWindowsProcessOnPort = () => {
  try {
    const output = execFileSync("powershell", [
      "-NoProfile",
      "-Command",
      `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
    ], { encoding: "utf8" }).trim();

    if (!output) {
      return false;
    }

    const pids = [...new Set(output.split(/\s+/).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
    for (const pid of pids) {
      try {
        execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
      } catch (error) {
        // Ignore kill failures so the main server script can still try to bind.
      }
    }

    return pids.length > 0;
  } catch (error) {
    return false;
  }
};

const main = async () => {
  const busy = await isPortListening();
  if (!busy) {
    process.exit(0);
  }

  const killed = killWindowsProcessOnPort();
  if (killed) {
    console.log(`Freed port ${port} before starting backend`);
  }

  process.exit(0);
};

main();