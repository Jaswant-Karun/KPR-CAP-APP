const { Pool } = require("pg");

const configs = [
  { name: "Empty password", user: "postgres", password: "", port: 5432 },
  { name: "postgres password", user: "postgres", password: "postgres", port: 5432 },
  { name: "No user/pass", user: "postgres", password: "", port: 5432 },
];

async function testConnection(config) {
  try {
    const pool = new Pool({
      host: "localhost",
      port: config.port,
      user: config.user,
      password: config.password,
      database: "postgres",
    });
    await pool.query("SELECT version()");
    console.log(`✅ SUCCESS: ${config.name}`);
    console.log(`   User: ${config.user}, Password: '${config.password || "(empty)"}'`);
    await pool.end();
    return config;
  } catch (error) {
    console.log(`❌ FAILED: ${config.name} - ${error.message.split("\n")[0]}`);
    return null;
  }
}

async function run() {
  console.log("Testing PostgreSQL authentication methods...\n");
  for (const config of configs) {
    await testConnection(config);
  }
}

run();
