require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("./db");

async function initDatabase() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await db.ready;
  await db.query(schemaSql);

  console.log("PostgreSQL schema initialized successfully.");
  await db.end();
}

initDatabase().catch(async (err) => {
  console.error("Failed to initialize PostgreSQL schema:", err.message);

  try {
    await db.end();
  } catch (closeErr) {
    console.error("Failed to close PostgreSQL connection:", closeErr.message);
  }

  process.exit(1);
});
