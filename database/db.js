const { Pool } = require("pg");

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in your .env file before starting the app.");
}

const pool = new Pool({
  connectionString: DATABASE_URL
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

const ready = pool.query("SELECT NOW() AS connected_at")
  .then((res) => {
    console.log("PostgreSQL connected at:", res.rows[0].connected_at);
    return res;
  })
  .catch((err) => {
    console.error("PostgreSQL connection failed:", err.message);
    throw err;
  });

module.exports = pool;
module.exports.ready = ready;
