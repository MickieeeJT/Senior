import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import star from "./assets/star.png";

export default function ScoreHistoryPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retro Button Style
  const buttonStyle =
    "group relative inline-flex h-12 w-48 items-center justify-center overflow-hidden rounded-sm border-2 border-[#33ff33] bg-transparent px-4 font-jersey text-2xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none";

  useEffect(() => {
    const fetchScoreHistory = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8000/api/score-history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setScores(data.scores);
        } else {
          setError(data.message || "Failed to load score history");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchScoreHistory();
  }, []);

  return (
    // Outer container: Fixed height (h-screen), no window scrolling
    <div className="relative h-screen w-full flex flex-col items-center bg-[#00542A] text-[#33ff33] font-jersey overflow-hidden selection:bg-[#33ff33] selection:text-[#00542A]">
      
      {/* CRT Scanline Overlay Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_50%,#000000_100%)]"></div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 flex flex-col w-full h-full max-w-5xl p-6 md:p-10">
        
        {/* HEADER (Fixed at top) */}
        <div className="text-center shrink-0 mb-6">
          <h1 className="text-6xl md:text-7xl font-jersey tracking-widest text-[#33ff33] drop-shadow-[0_0_8px_#33ff33]">
            SCORE BOARD
          </h1>
          <div className="h-1 w-full bg-[#33ff33] mt-2 shadow-[0_0_5px_#33ff33]"></div>
        </div>

        {/* LOADING / ERROR STATE */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-3xl animate-pulse">LOADING DATA...</p>
          </div>
        )}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500 text-2xl">ERROR: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 w-full overflow-y-auto border-4 border-[#0f3d0f] bg-[#032F14]/90 shadow-[0_0_20px_rgba(0,255,0,0.1)] scrollbar-thin scrollbar-thumb-[#33ff33] scrollbar-track-[#003300]">
            
            {scores.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <p className="text-3xl mb-6">NO RECORDS FOUND</p>
              </div>
            ) : (
              <table className="w-full text-center border-collapse">
                {/* Sticky Header */}
                <thead className="sticky top-0 bg-[#017039] text-[#33ff33] border-b-4 border-[#0f3d0f] shadow-md z-10">
                  <tr>
                    <th className="py-4 text-2xl tracking-wider w-1/6">GAME</th>
                    <th className="py-4 text-2xl tracking-wider w-1/4">DATE</th>
                    <th className="py-4 text-2xl tracking-wider w-1/4">NET WORTH</th>
                    <th className="py-4 text-2xl tracking-wider w-1/3">STAR</th>
                  </tr>
                </thead>
                
                {/* Scrollable Body */}
                <tbody>
                  {scores.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="group hover:bg-[#33ff33]/20 transition-colors border-b border-[#0f3d0f]/50"
                    >
                      <td className="py-4 text-2xl font-bold text-[#00aa00] group-hover:text-[#33ff33]">
                        #{index + 1}
                      </td>
                      <td className="py-4 text-xl tracking-wide">
                        {new Date(entry.played_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-2xl text-[#ADFF2F]">
                        ${entry.score.toLocaleString()}
                      </td>
                      <td className="py-4 flex justify-center items-center h-full">
                        <div className="flex gap-1">
                          {Number(entry.star) > 0 ? (
                            [...Array(Number(entry.star))].map((_, i) => (
                              <img
                                key={i}
                                src={star}
                                alt="star"
                                className="w-6 h-6 drop-shadow-[0_0_5px_#ffff00]"
                              />
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
            )}
          </div>
        )}

        {/* FOOTER (Fixed at bottom) */}
        <div className="shrink-0 mt-6 flex justify-end items-center border-t-2 border-[#0f3d0f] pt-4 px-2">
            <Link to="/home" className={buttonStyle}>
                BACK TO MENU
            </Link>
        </div>

      </div>
    </div>
  );
}