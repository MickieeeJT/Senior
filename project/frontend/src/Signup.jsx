import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const navigate = useNavigate();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  // Format time as HH:MM AM/PM
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  // Format date as MM/DD/YYYY
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("❌ Password and Confirm Password do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log("Server Response:", result);

      if (response.ok && result.success) {
        setMessage("✅ " + result.message);
        setTimeout(() => navigate("/login"), 500);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setMessage("❌ " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("⚠️ Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#011D10] relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20 px-20 py-6">
        <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
          {[...Array(144)].map((_, i) => (
            <div key={i} className="border-4" style={{ borderColor: '#032F14' }}></div>
          ))}
        </div>
      </div>

      {/* Header - Investment Game Title */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-7xl font-bold text-white mb-8 tracking-wider" style={{ fontFamily: 'monospace, "Press Start 2P"' }}>
          INVESTMENT GAME
        </h1>
        <h2 className="text-7xl font-bold text-white tracking-wider" style={{ fontFamily: 'monospace, "Press Start 2P"' }}>
          SIGN UP
        </h2>
      </div>

      {/* Content Container - for button alignment */}
      <div className="flex w-full pt-16">

        {/* Left Column - Signup Form */}
        <div className="flex-1 flex justify-end relative z-10 px-12">
          <div className="flex flex-col justify-center items-start">

            {/* SAME HEIGHT BOX */}
            <div className="mb-6 min-h-[340px] flex flex-col justify-center">
              <div className="flex flex-col gap-6 w-96">

                <input
                  type="email"
                  placeholder="USERNAME"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="p-6 text-2xl font-bold bg-transparent border-4 border-white text-white placeholder-white focus:outline-none focus:border-green-400"
                  style={{ fontFamily: 'monospace, "Press Start 2P"' }}
                  required
                />

                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="p-6 text-2xl font-bold bg-transparent border-4 border-white text-white placeholder-white focus:outline-none focus:border-green-400"
                  style={{ fontFamily: 'monospace, "Press Start 2P"' }}
                  required
                />

                <input
                  type="password"
                  placeholder="CONFIRM PASSWORD"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="p-6 text-2xl font-bold bg-transparent border-4 border-white text-white placeholder-white focus:outline-none focus:border-green-400"
                  style={{ fontFamily: 'monospace, "Press Start 2P"' }}
                  required
                />

              </div>
            </div>

            {/* REGISTER BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-96 p-6 text-3xl font-bold bg-green-600 hover:bg-green-700 text-white border-4 border-green-800 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
              style={{ fontFamily: 'monospace, "Press Start 2P"' }}
            >
              {loading ? "CREATING..." : "REGISTER"}
            </button>

            {message && (
              <p className={`mt-4 text-lg font-bold ${message.startsWith("✅") ? "text-green-400" : "text-red-500"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Chart + Login */}
        <div className="flex-1 flex justify-start relative z-10 px-12">
          <div className="flex flex-col justify-center items-start">

            {/* SAME HEIGHT BOX */}
            <div className="mb-6 min-h-[340px] flex flex-col justify-center relative">
              
              {/* WHITE LINE GRAPH */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <polyline
                  points="50,60 110,40 170,10 230,15 290,25 350,10"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                />

                {/* ARROW HEAD - pointing right 45 degrees up */}
                {/* <polygon
                  points="355,0 340,10 350,15"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                /> */}
              </svg>

              {/* GREEN BARS */}
              <div className="flex items-end gap-4 w-96 relative z-10">
              <div className="flex-1 h-20 bg-green-600"></div>
                <div className="flex-1 h-28 bg-green-600"></div>
                <div className="flex-1 h-48 bg-green-600"></div>
                <div className="flex-1 h-44 bg-green-600"></div>
                <div className="flex-1 h-36 bg-green-600"></div>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={() => navigate("/login")}
              className="w-96 p-6 text-3xl font-bold bg-gray-300 hover:bg-gray-400 text-black border-4 border-gray-500 transition-all"
              style={{ fontFamily: 'monospace, "Press Start 2P"' }}
            >
              LOGIN HERE
            </button>
          </div>
        </div>
      </div>

      {/* Stock Ticker */}
      <div className="absolute bottom-8 left-20 right-20 flex justify-between px-32 text-white text-xl font-bold bg-[#01180B] py-4" style={{ fontFamily: 'monospace' }}>
        <div>
          <div>GME +15.3%</div>
          <div>TSLA +12.7%</div>
        </div>
        <div>
          <div>GOLD +3.7%</div>
          <div>50,250</div>
        </div>
        <div>
          <div>JPY</div>
          <div>USD</div>
        </div>
        <div>
          <div>{formatTime(currentDateTime)}</div>
          <div>DATE: {formatDate(currentDateTime)}</div>
        </div>
      </div>
    </div>
  );
}
