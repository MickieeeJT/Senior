import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api/invest";

export default function SelectStrategy() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(30);
  const [targetAmount, setTargetAmount] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState(null);

  const durations = [20, 30, 40];

  const handleConfirm = () => {
    if (!targetAmount || Number(targetAmount) <= 0) {
      alert("Please enter valid target amount");
      return;
    }

    // ส่งค่าผ่าน state ไปหน้า invest
    navigate("/invest", {
      state: {
        duration,
        targetAmount: Number(targetAmount),
        forceNew: true,
      },
    });
  };

  const handleBackClick = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/check-session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.hasSession) {
        setResumeSessionData(data);
        setShowResumeModal(true);
      } else {
        navigate("/");
      }
    } catch (err) {
      navigate("/");
    }
  };

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
          <h2 className="text-3xl mb-6">Duration:</h2>

          <div className="flex gap-6 justify-center">
            {durations.map((year) => (
              <button
                key={year}
                onClick={() => setDuration(year)}
                className={`px-10 py-4 border-2 text-2xl transition-all duration-150
                ${
                  duration === year
                    ? "bg-[#66ff66] text-black border-[#66ff66] shadow-[0_0_10px_#33ff33]"
                    : "bg-transparent border-[#33ff33] hover:bg-[#003300]"
                }`}
              >
                {year} Years
              </button>
            ))}
          </div>
        </div>

        {/* Target Return */}
        <div className="text-left mb-10">
          <h2 className="text-3xl mb-6">Target Return:</h2>

          <input
            type="number"
            placeholder="$"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-full py-4 px-6 text-2xl bg-[#66bb55] text-black outline-none border-2 border-[#33ff33]"
          />
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="mt-6 px-16 py-4 border-2 border-[#33ff33] text-3xl hover:bg-[#003300] transition-all duration-150"
        >
          Confirm Strategy
        </button>
      </div>

      {/* Resume Game Modal */}
      {showResumeModal && resumeSessionData && resumeSessionData.preview && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative border-4 border-[#33ff33] bg-[#001a0a] p-8 rounded-lg shadow-[0_0_30px_rgba(51,255,51,0.3)] max-w-xl w-full">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px] opacity-20"></div>

            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-jersey text-[#33ff33] tracking-wider mb-2 drop-shadow-[0_0_10px_#33ff33]">
                RESUME GAME?
              </h2>
              <div className="h-1 w-full bg-[#33ff33] shadow-[0_0_10px_#33ff33] mb-6"></div>

              <div className="bg-[#022c19] border-2 border-[#11942F] p-6 rounded mb-8 text-left space-y-3 font-jersey">
                <div className="flex justify-between items-center border-b border-[#11942F] pb-2">
                  <span className="text-[#00aa00] text-2xl">Year / Month</span>
                  <span className="text-[#33ff33] text-3xl">
                    {resumeSessionData.preview?.currentYear} /{" "}
                    {Math.floor(resumeSessionData.preview?.currentMonth)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#11942F] py-2">
                  <span className="text-[#00aa00] text-2xl">Pocket Cash</span>
                  <span className="text-[#33ff33] text-3xl">
                    {resumeSessionData.preview?.pocket?.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}{" "}
                    $
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#00aa00] text-2xl">Total Assets</span>
                  <span className="text-[#33ff33] text-3xl">
                    {resumeSessionData.preview?.totalAssets?.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}{" "}
                    $
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() =>
                    navigate("/invest", { state: { forceNew: false } })
                  }
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#33ff33] bg-[#003300] px-6 font-jersey text-2xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_4px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#005500] active:translate-y-[2px] active:shadow-none"
                >
                  CONTINUE GAME
                </button>

                <button
                  onClick={() => {
                    setShowResumeModal(false);
                    // Stay on current page to allow new game setup
                  }}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#550000] text-red-500 bg-[#1a0000] hover:border-red-500 hover:text-red-400 font-jersey text-2xl tracking-wide transition-all duration-150 shadow-none"
                >
                  START NEW GAME
                </button>

                <button
                  onClick={() => navigate("/home")}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#005500] bg-transparent px-6 font-jersey text-2xl tracking-wide text-[#005500] transition-all duration-150 mt-2 hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#003300] active:translate-y-[2px] active:shadow-none"
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