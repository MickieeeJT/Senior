import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();

// Get achievements for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const sql = "SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1";
    const result = await db.query(sql, [userId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;