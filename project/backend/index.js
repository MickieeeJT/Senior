import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import scoreHistory from "./routes/scoreHistory.js";
import investRoutes from "./routes/investRoutes.js";
import "./config/db.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

// ✅ Health check route
app.get("/", (req, res) => {
	res.send("Server is running 🚀");
});

// ✅ Auth routes
app.use("/auth", authRoutes);

// ✅ Score history route
app.use("/api/score-history", scoreHistory);

// ✅ Investment logic route
app.use("/api/invest", investRoutes);

// ✅ Example protected route
app.get("/home", authenticateToken, (req, res) => {
	res.json({
		success: true,
		message: "Welcome to your profile!",
		user: req.user,
	});
});

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
