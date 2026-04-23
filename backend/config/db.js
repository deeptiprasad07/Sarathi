const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool (Optimized for production)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Check connection on startup
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Database Connected Successfully");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
})();

module.exports = db;