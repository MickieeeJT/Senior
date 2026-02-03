import db from "../config/db.js";

// Get user's tutorial progress
export const getTutorialProgress = (req, res) => {
    const userId = req.user.id; // มาจาก middleware authentication

    const sql = `
        SELECT tutorial_type, completed_at 
        FROM tutorial_progress 
        WHERE user_id = ?
    `;
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        // แปลง results เป็น object ที่ frontend ใช้งานง่าย
        const completedTutorials = results.map(row => row.tutorial_type);
        
        res.json({
            success: true,
            completedTutorials,
            progress: results
        });
    });
};

// Mark tutorial as completed
export const completeTutorial = (req, res) => {
    const userId = req.user.id;
    const { tutorialType } = req.body;

    if (!tutorialType) {
        return res.status(400).json({ success: false, message: "Tutorial type is required" });
    }

    // ตรวจสอบว่าผู้ใช้เคยทำ tutorial นี้แล้วหรือยัง
    const checkSql = "SELECT * FROM tutorial_progress WHERE user_id = ? AND tutorial_type = ?";
    
    db.query(checkSql, [userId, tutorialType], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length > 0) {
            return res.json({ success: true, message: "Tutorial already completed" });
        }

        // บันทึกการทำ tutorial เสร็จ
        const insertSql = `
            INSERT INTO tutorial_progress (user_id, tutorial_type, completed_at) 
            VALUES (?, ?, NOW())
        `;
        
        db.query(insertSql, [userId, tutorialType], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error saving progress" });
            }

            res.json({ success: true, message: "Tutorial completed successfully" });
        });
    });
};

// Reset tutorial progress (for testing)
export const resetTutorialProgress = (req, res) => {
    const userId = req.user.id;

    const sql = "DELETE FROM tutorial_progress WHERE user_id = ?";
    
    db.query(sql, [userId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({ success: true, message: "Tutorial progress reset successfully" });
    });
};

// Get all completed tutorials count for leaderboard or stats
export const getTutorialStats = (req, res) => {
    const sql = `
        SELECT 
            u.username,
            COUNT(tp.tutorial_type) as completed_tutorials
        FROM users u
        LEFT JOIN tutorial_progress tp ON u.id = tp.user_id
        GROUP BY u.id, u.username
        ORDER BY completed_tutorials DESC
        LIMIT 10
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({
            success: true,
            stats: results
        });
    });
};