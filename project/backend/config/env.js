// import dotenv from "dotenv";

// dotenv.config();

// const requiredVars = ["JWT_SECRET"];
// const missingVars = requiredVars.filter((name) => !process.env[name]);

// if (missingVars.length > 0) {
//   throw new Error(
//     `Missing required environment variables: ${missingVars.join(", ")}. Add them to backend/.env`
//   );
// }

// export const env = {
//   port: Number(process.env.PORT) || 8000,
//   jwtSecret: process.env.JWT_SECRET,
//   dbHost: process.env.DB_HOST || "localhost",
//   dbUser: process.env.DB_USER || "root",
//   dbPassword: process.env.DB_PASSWORD || "",
//   dbName: process.env.DB_NAME || "InvestGame",
//   frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
// };

import dotenv from "dotenv";

dotenv.config();

export const env = {
    port: Number(process.env.PORT) || 8000,
    frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    dbHost: process.env.DB_HOST || "localhost",
    dbPort: Number(process.env.DB_PORT) || 3306,
    dbUser: process.env.DB_USER || "root",
    dbPassword: process.env.DB_PASSWORD || "",
    dbName: process.env.DB_NAME || "InvestGame",
    jwtSecret: process.env.JWT_SECRET,
};