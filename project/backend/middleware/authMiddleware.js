import jwt from "jsonwebtoken";

// Use a secret key (put in .env in real projects)
const SECRET_KEY = "your-secret-key";

export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT error:", err);
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
}
