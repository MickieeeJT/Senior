import { useState, useEffect } from "react";
import { API_PATHS } from "./config/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

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

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(API_PATHS.authLogin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok && data.success) {
        setMessage("✅ Login successful!");
        localStorage.setItem("token", data.token);
        // Navigate to home after 1 second
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen bg-[#011D10] relative overflow-hidden font-poiret">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20 px-20 py-6">
        <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
          {[...Array(144)].map((_, i) => (
            <div key={i} className="border-4" style={{ borderColor: '#11942F' }}></div>
          ))}
        </div>
      </div>

      {/* Header - Investment Game Title */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-7xl font-poiret font-bold text-white mb-8 tracking-wider">
          INVESTMENT GAME
        </h1>
        <h2 className="text-7xl font-poiret font-bold text-[#B7FD5E] tracking-wider">
          LOG IN
        </h2>
      </div>

      {/* Content Container - for button alignment */}
      <div className="flex w-full pt-16">

        {/* Left Column - Login Form */}
        <div className="flex-1 flex justify-end relative z-10 px-12">
          <div className="flex flex-col justify-center items-start">

            {/* SAME HEIGHT BOX */}
            <div className="mb-6 min-h-[260px] flex flex-col justify-center">
              <div className="flex flex-col gap-8 w-96">

                <input
                  type="text"
                  placeholder="USERNAME"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="p-6 text-2xl font-poiret font-bold bg-transparent border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] text-white placeholder-white focus:outline-none focus:border-[#B7FD5E]"
                />

                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="p-6 text-2xl font-poiret font-bold bg-transparent border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] text-white placeholder-white focus:outline-none focus:border-[#B7FD5E]"
                />

              </div>
            </div>


            {/* LOGIN BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-96 p-6 text-3xl font-poiret font-bold bg-transparent border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] text-[#33ff33] hover:bg-[#11942F]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none"
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

            {message && (
              <p className={`mt-4 text-lg font-poiret font-bold ${message.startsWith("✅") ? "text-[#B7FD5E]" : "text-red-500"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Chart + Create Account */}
        <div className="flex-1 flex justify-start relative z-10 px-12">
          <div className="flex flex-col justify-center items-start">

            {/* SAME HEIGHT BOX */}
            <div className="mb-6 min-h-[260px] flex flex-col justify-center relative">

              {/* WHITE LINE GRAPH */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <polyline
                  points="50,60 110,40 170,10 230,15 290,25 350,5"
                  fill="none"
                  stroke="#B7FD5E"
                  strokeWidth="6"
                />
              </svg>

              {/* GREEN BARS */}
              <div className="flex items-end gap-4 w-96 relative z-10">
                <div className="flex-1 h-20 bg-[#5EBD50]"></div>
                <div className="flex-1 h-28 bg-[#5EBD50]"></div>
                <div className="flex-1 h-48 bg-[#5EBD50]"></div>
                <div className="flex-1 h-44 bg-[#5EBD50]"></div>
                <div className="flex-1 h-36 bg-[#5EBD50]"></div>
              </div>
            </div>


            {/* CREATE ACCOUNT BUTTON */}
            <button
              onClick={() => (window.location.href = "/signup")}
              className="w-96 p-6 text-3xl font-poiret font-bold bg-transparent border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] text-white hover:bg-[#11942F]/20 transition-all [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </div>
      </div>


      {/* Stock Ticker */}
      <div className="absolute bottom-8 left-20 right-20 flex justify-between px-32 text-white text-xl font-poiret font-bold bg-[#01180B] py-4">
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