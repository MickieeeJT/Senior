import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SelectStrategy() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(30);
  const [targetAmount, setTargetAmount] = useState("");

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

  return (
    <div className="relative flex items-center justify-center h-screen bg-[#00542A] text-[#33ff33] font-jersey overflow-hidden">
      
      {/* CRT overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

      <div className="relative z-10 border-4 border-[#0f3d0f] bg-[#032F14]/90 px-24 py-16 rounded-lg shadow-[0_0_50px_rgba(51,255,51,0.1)] text-center w-[700px]">
        
        {/* Title */}
        <h1 className="text-7xl tracking-widest drop-shadow-[0_0_10px_#33ff33] mb-4">
          SIMUVEST
        </h1>
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
            placeholder="฿ 1,500.00"
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
    </div>
  );
}