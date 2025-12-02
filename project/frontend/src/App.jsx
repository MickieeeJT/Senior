import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import LoginPage from "./Login.jsx";
import SignupPage from "./Signup.jsx";
import Home from "./Home.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import Score from "./Score.jsx";
import Tutorial from "./Tutorial.jsx";
import Invest from "./Invest.jsx";
import Dashboard from "./Dashboard.jsx";
// import Dashboard from "./DashboardTemp.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/score-history"
        element={
          <PrivateRoute>
            <Score />
          </PrivateRoute>
        }
      />
      <Route
        path="/tutorial"
        element={
          <PrivateRoute>
            <Tutorial />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/invest"
        element={
          <PrivateRoute>
            <Invest />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
