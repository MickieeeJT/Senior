import bcrypt from "bcrypt";
import db from "../config/db.js";

// Signup
export const signup = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
        db.query(sql, [email, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error inserting user" });
            }
            res.json({ success: true, message: "User registered successfully" });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Login
export const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        res.json({ success: true, message: "Login successful", user: { id: user.id, email: user.email } });
    });
};
