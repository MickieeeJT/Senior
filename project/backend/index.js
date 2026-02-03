import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import scoreHistory from "./routes/scoreHistory.js";
import userAchievements from "./routes/userAchievements.js"; 
import investRoutes from "./routes/investRoutes.js";
import tutorialRoutes from "./routes/tutorialRoutes.js";
import "./config/db.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

app.use("/auth", authRoutes);

app.use("/api/score-history", scoreHistory);

app.use("/api/user-achievements", userAchievements);

app.use("/api/invest", investRoutes);

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