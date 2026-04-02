import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api/invest";

export default function SelectStrategy() {
  const navigate = useNavigate();
  const location = useLocation();
  const [duration, setDuration] = useState(30);
  const [targetAmount, setTargetAmount] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState(null);

  const from = location.state?.from; // "home" | "resume"

  // If came from resume modal, auto-load session data for the modal
  useEffect(() => {
    if (from === "resume") {
      const loadSession = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const res = await fetch(`${API_BASE_URL}/check-session`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.hasSession) {
            setResumeSessionData(data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      loadSession();
    }
  }, [from]);

  const handleConfirm = () => {
    if (!targetAmount || Number(targetAmount) < 160000) return;
    navigate("/invest", {
      state: {
        duration,
        targetAmount: Number(targetAmount),
        forceNew: true,
      },
    });
  };

  const handleBackClick = () => {
    if (from === "resume") {
      navigate("/home", { state: { showResumeModal: true } });
    } else {
      navigate("/home");
    }
  };

  const durations = [20, 30, 40];

  return (
    <div className="relative flex items-center justify-center h-screen bg-[#00542A] text-[#33ff33] font-jersey overflow-hidden">

      {/* CRT overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

      <div className="relative z-10 border-4 border-[#0f3d0f] bg-[#032F14]/90 px-24 py-16 rounded-lg shadow-[0_0_50px_rgba(51,255,51,0.1)] text-center w-[700px]">

        {/* Title with Back Button */}
        <div className="relative mb-4">
          <button
            onClick={handleBackClick}
            className="absolute -top-10 -left-12 px-4 py-2 border-2 border-[#33ff33] text-lg hover:bg-[#003300] transition-all duration-150"
          >
            ← Back
          </button>

          <h1 className="text-7xl text-center tracking-widest drop-shadow-[0_0_10px_#33ff33]">
            SIMUVEST
          </h1>
        </div>

        <div className="h-2 w-full bg-[#33ff33] shadow-[0_0_10px_#33ff33] mb-6"></div>
        <p className="tracking-[0.3em] text-[#00aa00] mb-12">
          select your mission
        </p>

        {/* Duration */}
        <div className="text-left mb-10">
          <h2 className="text-3xl mb-6 font-jersey tracking-widest">Duration:</h2>
          <div className="flex gap-6 justify-center">
            {durations.map((year) => (
              <button
                key={year}
                onClick={() => setDuration(year)}
                className={`px-10 py-4 border-2 text-2xl font-jersey tracking-widest transition-all duration-150
                ${
                  duration === year
                    ? "bg-[#33ff33] text-black border-[#33ff33]"
                    : "bg-[#032F14] border-[#33ff33] text-[#33ff33] hover:bg-[#0a4a1a]"
                }`}
              >
                {year} Years
              </button>
            ))}
          </div>
        </div>

        {/* Target Return */}
        <div className="text-left mb-4">
          <h2 className="text-3xl mb-6 font-jersey tracking-widest">Target Return:</h2>
          <input
            type="number"
            placeholder="Enter amount (at least $160,000)"
            value={targetAmount}
            onChange={(e) => {
              const val = e.target.value;
              setTargetAmount(val);
            }}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
            }}
            min="0"
            max="160000"
            className="w-full py-4 px-6 text-2xl bg-[#021a0a] text-[#33ff33] font-jersey outline-none border-2 border-[#33ff33] placeholder-[#33ff33]/40 tracking-widest"
          />

          {targetAmount !== "" && Number(targetAmount) < 160000 && (
            <p className="mt-3 font-jersey text-red-500 tracking-widest text-lg">
              &#x26A0; TARGET MUST BE AT LEAST $160,000
            </p>
          )}
          {targetAmount !== "" && Number(targetAmount) >= 160000 && (
            <p className="mt-3 font-jersey text-[#33ff33] tracking-widest text-lg">
              &#x2713; TARGET CONFIRMED
            </p>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!targetAmount || Number(targetAmount) < 160000}
          className={`mt-8 w-full py-4 border-2 text-2xl font-jersey tracking-widest transition-all duration-150
          ${
            !targetAmount || Number(targetAmount) < 160000
              ? "border-[#33ff33]/30 text-[#33ff33]/30 bg-transparent cursor-not-allowed"
              : "border-[#33ff33] text-[#33ff33] bg-[#032F14] hover:bg-[#0a4a1a] active:scale-95 cursor-pointer"
          }`}
        >
          CONFIRM STRATEGY
        </button>
      </div>

      {/* Resume Modal — only shown when came from resume and back is clicked */}
      {showResumeModal && resumeSessionData && resumeSessionData.preview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative border-2 border-[#33ff33] bg-[#032F14] p-8 rounded-sm max-w-xl w-full">

            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 rounded-sm"></div>

            <div className="relative z-10 text-center">
              <h2 className="text-5xl font-jersey tracking-widest text-[#33ff33] mb-2">
                RESUME GAME?
              </h2>
              <div className="h-1 w-full bg-[#33ff33] mt-3 mb-2"></div>
              <p className="mb-6 text-sm tracking-[0.5em] text-[#33ff33] font-jersey opacity-70">
                LOAD SAVE DATA
              </p>

              <div className="bg-[#021a0a] border border-[#1a5c2a] p-6 rounded-sm mb-8 text-left space-y-4 font-jersey">
                <div className="flex justify-between items-center border-b border-[#1a5c2a] pb-4">
                  <span className="text-[#33ff33] text-xl opacity-80">Year / Month</span>
                  <span className="text-[#33ff33] text-2xl">
                    {resumeSessionData.preview?.currentYear} / {Math.floor(resumeSessionData.preview?.currentMonth)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#1a5c2a] py-4">
                  <span className="text-[#33ff33] text-xl opacity-80">Pocket Cash</span>
                  <span className="text-[#33ff33] text-2xl">
                    {resumeSessionData.preview?.pocket?.toLocaleString(undefined, { maximumFractionDigits: 0 })} $
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#33ff33] text-xl opacity-80">Total Assets</span>
                  <span className="text-[#33ff33] text-2xl">
                    {resumeSessionData.preview?.totalAssets?.toLocaleString(undefined, { maximumFractionDigits: 0 })} $
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-5">
                <button
                  onClick={() => navigate("/invest", { state: { forceNew: false } })}
                  className="inline-flex h-14 w-4/5 items-center justify-center border-2 border-[#33ff33] bg-[#032F14] font-jersey text-xl tracking-widest text-[#33ff33] transition-all duration-150 hover:bg-[#0a4a1a] active:scale-95"
                >
                  CONTINUE GAME
                </button>

                <button
                  onClick={() => navigate("/select-strategy", { state: { from: "resume" } })}
                  className="inline-flex h-14 w-4/5 items-center justify-center border-2 border-red-800 bg-[#1a0000] font-jersey text-xl tracking-widest text-red-600 transition-all duration-150 hover:bg-[#2a0000] active:scale-95"
                >
                  START NEW GAME
                </button>

                <button
                  onClick={() => navigate("/home")}
                  className="inline-flex h-14 w-4/5 items-center justify-center border-2 border-[#33ff33] bg-[#032F14] font-jersey text-xl tracking-widest text-[#33ff33] transition-all duration-150 hover:bg-[#0a4a1a] active:scale-95"
                >
                  BACK TO MENU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}