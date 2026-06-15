import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();

// Get scores for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const sql = "SELECT * FROM score_history WHERE user_id = ? ORDER BY played_at DESC, id DESC";
    const result = await db.query(sql, [userId]);
    
    res.json({ success: true, scores: result.rows });
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
