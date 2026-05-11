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
export const getTutorialProgress = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get the HIGHEST level this user has achieved
        const sql = "SELECT MAX(tutorial_level) as max_level FROM tutorial_progress WHERE user_id = $1";
        
        const result = await db.query(sql, [userId]);
        
        // If user has no progress, max_level will be null, so default to 0
        const currentLevel = result.rows[0]?.max_level || 0;
        
        res.json({
            success: true,
            tutorialLevel: currentLevel
        });
    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
};

// 2. COMPLETE TUTORIAL
export const completeTutorial = async (req, res) => {
    const userId = req.user.id;
    const { tutorialType } = req.body;

    // Convert 'savings' -> 1
    const level = TUTORIAL_MAP[tutorialType];

    if (!level) {
        return res.status(400).json({ success: false, message: "Invalid tutorial type" });
    }

    try {
        // PostgreSQL: Use ON CONFLICT DO NOTHING to handle duplicates
        const sql = `INSERT INTO tutorial_progress (user_id, tutorial_level) 
                     VALUES ($1, $2) 
                     ON CONFLICT (user_id, tutorial_level) DO NOTHING`;
        
        await db.query(sql, [userId, level]);
        res.json({ success: true, message: "Tutorial completed" });
    } catch (err) {
        console.error("DB Insert Error:", err);
        res.status(500).json({ success: false, message: "Error completing tutorial" });
    }
};

// 3. RESET PROGRESS (For testing or 'New Game')
export const resetTutorialProgress = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const sql = "DELETE FROM tutorial_progress WHERE user_id = $1";
        
        await db.query(sql, [userId]);
        res.json({ success: true, message: "Progress reset successfully" });
    } catch (err) {
        console.error("DB Reset Error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
};

// 4. GET STATS (Leaderboard/Analytics)
export const getTutorialStats = async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.email,
                MAX(tp.tutorial_level) as current_level
            FROM users u
            LEFT JOIN tutorial_progress tp ON u.id = tp.user_id
            GROUP BY u.id, u.email
            ORDER BY current_level DESC
            LIMIT 10
        `;
        
        const result = await db.query(sql);

        res.json({
            success: true,
            stats: result.rows
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
};