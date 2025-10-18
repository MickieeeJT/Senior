import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const SECRET_KEY = "your-secret-key"; // move this to .env later

// Signup
export const signup = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    try {
        // Check if email already exists
        const checkSql = "SELECT * FROM users WHERE email = ?";
        db.query(checkSql, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Email already registered" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const insertSql = "INSERT INTO users (email, password) VALUES (?, ?)";
            db.query(insertSql, [email, hashedPassword], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: "Error inserting user" });
                }

                res.json({ success: true, message: "User registered successfully" });
            });
        });
    } catch (err) {
        console.error(err);
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

        // ✅ SIGN A JWT THAT CONTAINS THE USER ID
        const token = jwt.sign(
            { id: user.id, email: user.email },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        // ✅ Send the token back
        res.json({
            success: true,
            message: "Login successful",
            token, // 👈 frontend should store this
            user: { id: user.id, email: user.email }
        });
    });
};