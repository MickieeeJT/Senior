import express from "express";
import { 
    getTutorialProgress, 
    completeTutorial, 
    resetTutorialProgress, 
    getTutorialStats 
} from "../controllers/tutorialController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user's tutorial progress (requires authentication)
router.get("/progress", authenticateToken, getTutorialProgress);

// Mark tutorial as completed (requires authentication)
router.post("/complete", authenticateToken, completeTutorial);

// Reset tutorial progress for testing (requires authentication)
router.delete("/reset", authenticateToken, resetTutorialProgress);

// Get tutorial statistics (public route)
router.get("/stats", getTutorialStats);

export default router;