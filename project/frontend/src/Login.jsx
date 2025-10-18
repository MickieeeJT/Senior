import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "./assets/background.png";
import userIcon from "./assets/user.png";
import lockIcon from "./assets/lock.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok && data.success) {
        setMessage("Login successful!");
        localStorage.setItem("token", data.token);
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("⚠️ Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-md bg-gray-100 backdrop-blur-md p-12 rounded-3xl shadow-lg">
        <h1 className="text-4xl text-center mb-6 text-gray-800 font-kameron pt-4">
          Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center justify-center font-kameron">
            <div className="flex items-center mt-8 w-80 border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-green-200 bg-white">
              <img
                src={userIcon}
                alt="user icon"
                className="w-[16px] h-[16px] mr-3 ml-2"
              />
              <input
                type="text"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xl w-full text-gray-500 placeholder-gray-400 focus:outline-none bg-transparent"
                required
              />
            </div>

            <div className="flex items-center my-8 w-80 border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-green-200 bg-white">
              <img
                src={lockIcon}
                alt="lock icon"
                className="w-[16px] h-[16px] mr-3 ml-2"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xl w-full text-gray-500 placeholder-gray-400 focus:outline-none bg-transparent"
                required
              />
            </div>
            <div className="pb-8 pt-4">
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? "#9CA3AF" : "#6DC601" }}
                className={`w-80 p-3 rounded-lg font-semibold text-white transition ${
                  loading ? "cursor-not-allowed" : "hover:bg-green-700"
                }`}
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </div>
          </div>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-l font-kameron ${
              message.startsWith("✅") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      <div className="mt-16 text-center">
        <span className="text-white font-medium text-xl font-kameron">
          New Here?{" "}
        </span>
        <button
          onClick={() => navigate("/signup")}
          className="text-orange-300 hover:text-orange-500 text-xl font-kameron"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
