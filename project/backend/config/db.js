import mysql from "mysql2";

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "InvestGame"
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL");
});

export default db;