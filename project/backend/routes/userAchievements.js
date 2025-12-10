import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();

// Get achievements for logged-in user
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = "SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?";

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    }
    res.json({ success: true, data: rows });
  });
});

export default router;