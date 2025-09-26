import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();

// Get scores for logged-in user using callback style
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = "SELECT * FROM score_history WHERE user_id = ?";
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    }

    res.json({ success: true, scores: rows });
  });
});

export default router;
