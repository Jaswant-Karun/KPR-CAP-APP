const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

async function run() {
  try {
    const sqlPath = path.resolve(__dirname, "..", "seed_departments.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await pool.query(sql);

    const out = await pool.query("SELECT code, name FROM departments ORDER BY name ASC");
    console.log(`departments: ${out.rows.length}`);
    out.rows.forEach((row) => console.log(`${row.code} - ${row.name}`));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
