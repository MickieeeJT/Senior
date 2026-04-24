import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import star from "./assets/star.png";
import gold from "./assets/Gold.png";
import starAch from "./assets/5stars.png";
import bond from "./assets/bond.png";
import hand from "./assets/hand.png";
import inflation from "./assets/inflation.png";
import money from "./assets/money.png";
import lose from "./assets/robot_lose.png";
import win from "./assets/robot_win.png";
import stock from "./assets/stocktrader.png";
import turtle from "./assets/turtle.png";
import whale from "./assets/whale.png";
import rekt from "./assets/rekt.png";
import { API_PATHS } from "./config/api";

// --- 1. ACHIEVEMENTS DATA (Static Definitions) ---
const ACHIEVEMENT_DATA = [
  { id: 1, name: "5-Star General", desc: "Achieve a perfect 5-star rating", img: starAch },
  { id: 2, name: "The Whale", desc: "Finish with > $1,000,000 Net Worth", img: whale },
  { id: 3, name: "Bot Crusher", desc: "Beat the Bot by 20%", img: win },
  { id: 4, name: "Inflation Buster", desc: "Total Return > 200%", img: inflation },
  { id: 5, name: "The Turtle", desc: "Profit with $0 in Stocks/Crypto", img: turtle },
  { id: 6, name: "YOLO Trader", desc: "Profit with > 90% in Stocks", img: stock },
  { id: 7, name: "Iron Hands", desc: "Profit despite -40% Drawdown", img: hand },
  { id: 8, name: "The Hoarder", desc: "End with > $100,000 Savings", img: money },
  { id: 9, name: "Goldfinger", desc: "Gold profit > Stocks & Bonds", img: gold },
  { id: 10, name: "Coupon Clipper", desc: "Earn > $20,000 from Bonds", img: bond },
  { id: 11, name: "Rekt", desc: "Finish with less than invested", img: rekt },
  { id: 12, name: "Lost Decade", desc: "Final value lower than Bot", img: lose },
];

export default function ScoreHistoryPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [achievements, setAchievements] = useState(ACHIEVEMENT_DATA);

  // --- NEW: State for the Floating Tooltip ---
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    name: "",
    desc: ""
  });

  // Retro Button Style
  const buttonStyle =
    "group relative inline-flex h-12 w-48 items-center justify-center overflow-hidden rounded-sm border-2 border-[#33ff33] bg-transparent px-4 font-poiret text-2xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none";

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const [scoreRes, achievementRes] = await Promise.all([
          fetch(API_PATHS.scoreHistory, { headers }),
          fetch(API_PATHS.userAchievements, { headers }),
        ]);

        const scoreData = await scoreRes.json();
        const achievementData = await achievementRes.json();

        // 1. Handle Scores
        if (scoreRes.ok && scoreData.success) {
          setScores(scoreData.scores);
        } else {
          console.error("Score fetch failed:", scoreData.message);
        }

        // 2. Handle Achievements
        if (achievementRes.ok && achievementData.success) {
          const unlockedIds = new Set(achievementData.data.map((item) => item.achievement_id));

          const updatedAchievements = ACHIEVEMENT_DATA.map((ach) => ({
            ...ach,
            unlocked: unlockedIds.has(ach.id),
          }));

          setAchievements(updatedAchievements);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Handlers for Tooltip ---
  const handleMouseEnter = (e, name, desc) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2, // Center horizontally
      y: rect.bottom + 10,           // Position below the item
      name,
      desc
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center bg-[#00542A] text-[#33ff33] font-jersey overflow-hidden selection:bg-[#33ff33] selection:text-[#00542A]">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_50%,#000000_100%)]"></div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 flex flex-col w-full h-full max-w-5xl p-6 md:p-10">
        
        {/* HEADER */}
        <div className="text-center shrink-0 mb-6">
          <h1 className="text-6xl md:text-7xl font-jersey tracking-widest text-[#33ff33] drop-shadow-[0_0_8px_#33ff33]">
            SCORE BOARD
          </h1>
          <div className="h-1 w-full bg-[#33ff33] mt-2 shadow-[0_0_5px_#33ff33]"></div>
        </div>

        {/* LOADING / ERROR */}
        {loading && <p className="text-3xl animate-pulse text-center mt-10">LOADING DATA...</p>}
        {error && <p className="text-red-500 text-2xl text-center mt-10">ERROR: {error}</p>}

        {!loading && !error && (
          <div className="flex-1 w-full flex flex-col border-4 border-[#0f3d0f] bg-[#032F14]/90 shadow-[0_0_20px_rgba(0,255,0,0.1)] overflow-hidden">
            
            {/* --- ACHIEVEMENTS SECTION (ALWAYS VISIBLE NOW) --- */}
            <div className="shrink-0 z-20 flex flex-wrap justify-center gap-6 p-6 border-b-4 border-[#0f3d0f] bg-[#02491f] relative">
                {achievements.map((ach) => (
                <div 
                    key={ach.id} 
                    className="group relative flex flex-col items-center cursor-help"
                    onMouseEnter={(e) => handleMouseEnter(e, ach.name, ach.desc)}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* ICON WITH SHADOW LOGIC */}
                    <img
                    src={ach.img}
                    alt={ach.name}
                    className={`w-12 h-12 transition-all duration-300 
                        ${ach.unlocked 
                        ? "drop-shadow-[0_0_8px_#ffff00] filter-none opacity-100 scale-100" 
                        : "brightness-0 opacity-60 grayscale drop-shadow-[0_0_4px_#33ff33]"
                        }
                    `}
                    />
                </div>
                ))}
            </div>

            {/* --- CONDITIONAL CONTENT: TABLE OR "NO RECORDS" --- */}
            {scores.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <p className="text-3xl mb-2 text-[#33ff33]">NO RECORDS FOUND</p>
                <p className="text-lg text-[#00aa00]">PLAY A GAME TO START RANKING</p>
              </div>
            ) : (
                /* --- TABLE SECTION --- */
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#33ff33] scrollbar-track-[#003300]">
                  <table className="w-full text-center border-collapse">
                    <thead className="sticky top-0 bg-[#017039] text-[#33ff33] border-b-4 border-[#0f3d0f] shadow-md z-10">
                      <tr>
                        <th className="py-4 text-2xl tracking-wider w-1/6">GAME</th>
                        <th className="py-4 text-2xl tracking-wider w-1/4">DATE</th>
                        <th className="py-4 text-2xl tracking-wider w-1/4">NET WORTH</th>
                        <th className="py-4 text-2xl tracking-wider w-1/3">STAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((entry, index) => (
                        <tr key={entry.id} className="group hover:bg-[#33ff33]/20 transition-colors border-b border-[#0f3d0f]/50">
                          <td className="py-4 text-2xl font-bold text-[#00aa00] group-hover:text-[#33ff33]">#{index + 1}</td>
                          <td className="py-4 text-xl tracking-wide">{new Date(entry.played_at).toLocaleDateString()}</td>
                          <td className="py-4 text-2xl text-[#ADFF2F]">${entry.score.toLocaleString()}</td>
                          <td className="py-4 flex justify-center items-center h-full">
                            <div className="flex gap-1">
                              {Number(entry.star) > 0 ? (
                                [...Array(Number(entry.star))].map((_, i) => (
                                  <img key={i} src={star} alt="star" className="w-6 h-6 drop-shadow-[0_0_5px_#ffff00]" />
                                ))
                              ) : (
                                <span className="text-[#006600] text-lg">UNRATED</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="shrink-0 mt-6 flex justify-end items-center border-t-2 border-[#0f3d0f] pt-4 px-2">
            <Link to="/home" className={buttonStyle}>Back to Menu</Link>
        </div>

      </div>

      {/* --- FLOATING TOOLTIP (FIXED POSITION) --- */}
      {tooltip.show && (
        <div 
          className="fixed z-[9999] flex flex-col items-center pointer-events-none"
          style={{ 
            top: tooltip.y, 
            left: tooltip.x,
            transform: 'translateX(-50%)' 
          }}
        >
           {/* ARROW */}
           <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#33ff33]"></div>
           
           {/* TEXT BOX */}
           <div className="bg-black border-2 border-[#33ff33] p-2 text-center shadow-[0_0_10px_#000] w-48">
              <p className="text-xl mb-1 text-[#ffff00]">{tooltip.name}</p>
              <p className="text-sm text-[#33ff33] leading-tight">{tooltip.desc}</p>
           </div>
        </div>
      )}

    </div>
  );
}