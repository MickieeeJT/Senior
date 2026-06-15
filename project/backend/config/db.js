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

import mysql from "mysql2/promise";
import { env } from "./env.js";

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = {
  query: async (sql, values = []) => {
    const translatedSql = sql.replace(/\$(\d+)/g, "?");
    const [result] = await pool.query(translatedSql, values);

    if (Array.isArray(result)) {
      return { rows: result, rowCount: result.length };
    }

    return {
      rows: [],
      rowCount: result.affectedRows ?? 0,
      insertId: result.insertId,
    };
  },
};

pool
  .getConnection()
  .then((connection) => {
    connection.release();
    console.log("📦 Connected to MySQL Database successfully!");
  })
  .catch((err) => console.error("❌ Database connection error:", err.message));

export default db;