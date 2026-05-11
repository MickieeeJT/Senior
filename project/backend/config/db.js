// import mysql from "mysql2";
// import { env } from "./env.js";

// const db = mysql.createPool({
//     host: env.dbHost,
//     user: env.dbUser,
//     password: env.dbPassword,
//     database: env.dbName,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// db.getConnection((err, connection) => {
//     if (err) {
//         console.error("❌ Database connection failed:", err);
//         return;
//     }
//     console.log("✅ Connected to MySQL");
// });

// export default db;

import pkg from 'pg';
const { Pool } = pkg;
import { env } from "./env.js";

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false // Required for Render's external connections
  }
});

pool.connect()
  .then(() => console.log("📦 Connected to PostgreSQL Database successfully!"))
  .catch((err) => console.error("❌ Database connection error:", err.stack));

export default pool;