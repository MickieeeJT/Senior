import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000/api/invest";

export default function Home() {
  const navigate = useNavigate();
  const [tutorialLevel, setTutorialLevel] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tutorial progress on mount
  useEffect(() => {
    const fetchTutorialProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/tutorial-progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          setTutorialLevel(data.tutorialLevel);
        }
      } catch (error) {
        console.error("Failed to fetch tutorial progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorialProgress();
  }, []);

  const handleStartInvest = (e) => {
    e.preventDefault();
    
    // Check if user has completed at least tutorial level 1
    if (tutorialLevel < 1) {
      setShowModal(true);
    } else {
      navigate("/invest");
    }
  };

  const buttonStyle =
    "group relative inline-flex h-14 w-72 items-center justify-center overflow-hidden rounded-sm border-2 border-[#33ff33] bg-transparent px-6 font-jersey text-3xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none";

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-[#00542A] text-[#33ff33] font-jersey overflow-hidden">
      
      {/* CRT Scanline Overlay Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
      
      {/* Vignette / Glow Corner Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_50%,#000000_100%)]"></div>

      {/* Main Content Container with "Retro Screen" Border */}
      <div className="relative z-10 flex flex-col items-center border-4 border-[#0f3d0f] bg-[#032F14]/90 px-24 py-12 shadow-[0_0_50px_rgba(51,255,51,0.1)] rounded-lg backdrop-blur-sm">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-9xl font-jersey tracking-widest text-[#33ff33] drop-shadow-[0_0_10px_#33ff33] animate-pulse">
            SIMUVEST
          </h1>
          {/* Pixelated Separator Line */}
          <div className="h-2 w-full bg-[#33ff33] mt-4 shadow-[0_0_10px_#33ff33]"></div>
          <p className="mt-2 text-xl tracking-[0.5em] text-[#00aa00] font-jersey">INSERT COIN TO START</p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col items-center gap-8">
          <Link to="/tutorial" className={buttonStyle}>
            TUTORIAL
          </Link>

          <button onClick={handleStartInvest} className={buttonStyle}>
            START INVEST
          </button>

          <Link to="/score-history" className={buttonStyle}>
            SCORE HISTORY
          </Link>
        </div>

        {/* Tutorial Progress Indicator */}
        {!loading && (
          <div className="mt-8 text-center">
            <div className="text-sm text-[#00aa00] tracking-wider">
              TUTORIAL PROGRESS: LEVEL {tutorialLevel}/6
            </div>
            <div className="flex gap-1 mt-2 justify-center">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div
                  key={level}
                  className={`w-8 h-2 ${
                    tutorialLevel >= level
                      ? "bg-[#33ff33] shadow-[0_0_5px_#33ff33]"
                      : "bg-[#003300]"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-[#005500] text-l tracking-widest uppercase">
          © 2025 Investment Game System • <span className="animate-blink">READY</span>
        </div>
      </div>

      {/* Tutorial Incomplete Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative border-4 border-[#33ff33] bg-[#001a0a] p-8 rounded-lg shadow-[0_0_30px_rgba(51,255,51,0.3)] max-w-md">
            {/* CRT effect on modal */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px] opacity-20"></div>
            
            <div className="relative z-10">
              {/* Warning Icon */}
              <div className="text-center mb-6">
                <div className="text-6xl text-[#33ff33] animate-pulse mb-4">⚠️</div>
                <h2 className="text-4xl font-jersey text-[#33ff33] tracking-wider mb-2 drop-shadow-[0_0_10px_#33ff33]">
                  ACCESS DENIED
                </h2>
                <div className="h-1 w-full bg-[#33ff33] shadow-[0_0_10px_#33ff33]"></div>
              </div>

              {/* Message */}
              <div className="text-center mb-8">
                <p className="text-xl font-jersey text-[#00aa00] mb-4 tracking-wide">
                  TUTORIAL NOT COMPLETED
                </p>
                <p className="text-base font-jersey text-[#00aa00] leading-relaxed">
                  You must complete at least Tutorial Level 1 before starting the investment game.
                </p>
                <p className="text-sm font-jersey text-[#005500] mt-4">
                  Current Progress: Level {tutorialLevel}/6
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate("/tutorial");
                  }}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#33ff33] bg-[#003300] px-6 font-jersey text-2xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_4px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#005500] active:translate-y-[2px] active:shadow-none"
                >
                  GO TO TUTORIAL
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#005500] bg-transparent px-6 font-jersey text-2xl tracking-wide text-[#005500] transition-all duration-150 [box-shadow:0px_4px_0px_#003300] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#003300] active:translate-y-[2px] active:shadow-none"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}