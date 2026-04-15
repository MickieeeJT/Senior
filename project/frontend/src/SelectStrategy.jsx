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
  const buttonStyle =
    "group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#33ff33] bg-transparent px-6 font-poiret text-3xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#00542A] text-[#33ff33] font-jersey">

      <button
        onClick={handleBackClick}
        className="absolute top-8 right-8 z-50 inline-flex h-12 items-center justify-center rounded-sm border border-[#33ff33]/30 bg-transparent px-8 font-poiret text-2xl tracking-wide text-[#33ff33]/60 transition-all duration-150 hover:border-[#33ff33] hover:bg-[#33ff33]/10 hover:text-[#33ff33]"
      >
        Back
      </button>

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_50%,#000000_100%)]"></div>

      <div className="relative z-10 flex w-[min(92vw,760px)] flex-col items-center rounded-lg border-4 border-[#0f3d0f] bg-[#032F14]/90 px-8 py-12 text-center shadow-[0_0_50px_rgba(51,255,51,0.1)] backdrop-blur-sm md:px-16 md:py-16">

        <div className="mb-4 text-center">
          <h1 className="text-7xl md:text-8xl tracking-widest text-[#33ff33] drop-shadow-[0_0_10px_#33ff33]">
            SIMUVEST
          </h1>
        </div>

        <div className="h-2 w-full bg-[#33ff33] shadow-[0_0_10px_#33ff33] mb-4"></div>
        <p className="mb-12 tracking-[0.3em] text-[#00aa00]">
          select your mission
        </p>

        {/* Duration */}
        <div className="mb-10 w-full text-left">
          <h2 className="text-3xl mb-6 font-poiret tracking-widest">Duration:</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            {durations.map((year) => (
              <button
                key={year}
                onClick={() => setDuration(year)}
                className={`inline-flex h-14 items-center justify-center border-2 px-10 text-2xl font-jersey tracking-widest transition-all duration-150 ${
                  duration === year
                    ? "border-[#33ff33] bg-[#33ff33] text-black [box-shadow:0px_6px_0px_#005500]"
                    : "border-[#33ff33] bg-[#032F14] text-[#33ff33] hover:bg-[#0a4a1a]"
                }`}
              >
                {year} Years
              </button>
            ))}
          </div>
        </div>

        {/* Target Return */}
        <div className="mb-4 w-full text-left">
          <h2 className="text-3xl mb-6 font-poiret tracking-widest">Target Return:</h2>
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
            className="no-spinner w-full border-2 border-[#33ff33] bg-[#021a0a] px-6 py-4 text-2xl font-jersey tracking-widest text-[#33ff33] outline-none placeholder-[#33ff33]/40"
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
          className={`mt-8 inline-flex h-14 w-full items-center justify-center border-2 text-2xl font-poiret tracking-widest transition-all duration-150
          ${
            !targetAmount || Number(targetAmount) < 160000
              ? "cursor-not-allowed border-[#33ff33]/30 bg-transparent text-[#33ff33]/30"
              : "cursor-pointer border-[#33ff33] bg-[#032F14] text-[#33ff33] hover:bg-[#0a4a1a] active:scale-95"
          }`}
        >
          Confirm Strategy
        </button>
      </div>

      
    </div>
  );
}