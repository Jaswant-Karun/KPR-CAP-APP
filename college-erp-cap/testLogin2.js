const http = require("http");

const options = {
  hostname: "localhost",
  port: 5004,
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(JSON.stringify({
      email: "cb003@kpriet.ac.in",
      password: "Password@123",
      role: "faculty"
    }))
  }
};

const req = http.request(options, (res) => {
  let data = "";
  
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      console.log("Response:", JSON.stringify(json, null, 2));
    } catch (e) {
      console.log("Response (raw):", data);
    }
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});

const body = JSON.stringify({
  email: "cb003@kpriet.ac.in",
  password: "Password@123",
  role: "faculty"
});

req.write(body);
req.end();

setTimeout(() => {
  console.error("Timeout waiting for response");
  process.exit(1);
}, 3000);
