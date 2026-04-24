const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export const API_PATHS = {
  authLogin: `${API_BASE_URL}/auth/login`,
  authSignup: `${API_BASE_URL}/auth/signup`,
  invest: `${API_BASE_URL}/api/invest`,
  tutorial: `${API_BASE_URL}/api/tutorial`,
  scoreHistory: `${API_BASE_URL}/api/score-history`,
  userAchievements: `${API_BASE_URL}/api/user-achievements`,
};

export default API_BASE_URL;
