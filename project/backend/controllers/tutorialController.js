import db from "../config/db.js";

// Map strings to integers (Strict Order)
const TUTORIAL_MAP = {
  'savings': 1,
  'bonds': 2,
  'indexFund': 3,
  'stocks': 4,
  'gold': 5,
  'currency': 6
};

// 1. GET PROGRESS
export const getTutorialProgress = (req, res) => {
    const userId = req.user.id;

    // Get the HIGHEST level this user has achieved
    const sql = "SELECT MAX(tutorial_level) as max_level FROM tutorial_progress WHERE user_id = ?";
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        // If user has no progress, max_level will be null, so default to 0
        const currentLevel = results[0].max_level || 0;
        
        res.json({
            success: true,
            tutorialLevel: currentLevel
        });
    });
};

// 2. COMPLETE TUTORIAL
export const completeTutorial = (req, res) => {
    const userId = req.user.id;
    const { tutorialType } = req.body;

    // Convert 'savings' -> 1
    const level = TUTORIAL_MAP[tutorialType];

    if (!level) {
        return res.status(400).json({ success: false, message: "Invalid tutorial type" });
    }

    // Insert the level. INSERT IGNORE prevents crashing if they did it already.
    const sql = "INSERT IGNORE INTO tutorial_progress (user_id, tutorial_level) VALUES (?, ?)";
    
    db.query(sql, [userId, level], (err, result) => {
        if (err) {
            console.error("DB Insert Error:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, message: "Tutorial completed" });
    });
};

// 3. RESET PROGRESS (For testing or 'New Game')
export const resetTutorialProgress = (req, res) => {
    const userId = req.user.id;
    
    const sql = "DELETE FROM tutorial_progress WHERE user_id = ?";
    
    db.query(sql, [userId], (err) => {
        if (err) {
            console.error("DB Reset Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Progress reset successfully" });
    });
};

// 4. GET STATS (Leaderboard/Analytics)
export const getTutorialStats = (req, res) => {
    const sql = `
        SELECT 
            u.username,
            MAX(tp.tutorial_level) as current_level
        FROM users u
        LEFT JOIN tutorial_progress tp ON u.id = tp.user_id
        GROUP BY u.id, u.username
        ORDER BY current_level DESC
        LIMIT 10
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Stats Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({
            success: true,
            stats: results
        });
    });
};