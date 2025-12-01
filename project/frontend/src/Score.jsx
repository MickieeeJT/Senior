import { useEffect, useState } from "react";
import star from "./assets/star.png";

export default function ScoreHistoryPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          "http://localhost:8080/api/score-history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        console.log("Score history response:", data);

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
    <div className="min-h-screen bg-[#0a1b0d]/90 text-[#ADFF2F] font-mono flex flex-col items-center py-10 backdrop-blur-md">
      {/* Title */}
      <h1 className="text-5xl font-extrabold text-[#7CFC00] mb-8 text-center tracking-widest">
        SCORE HISTORY
      </h1>

      {/* Loading / Error */}
      {loading && (
        <p className="text-center text-[#9ACD32] text-xl animate-pulse">
          Loading...
        </p>
      )}
      {error && (
        <p className="text-center text-red-400 text-xl font-semibold">
          {error}
        </p>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="w-11/12 md:w-4/5 lg:w-3/4 bg-[#001a0a]/70 border-4 border-[#00FF00] rounded-xl p-6 backdrop-blur-lg">
          {scores.length === 0 ? (
            <p className="text-center text-[#ADFF2F] text-lg">
              No score history yet. Play to earn your first score!
            </p>
          ) : (
            <table className="w-full border-collapse text-center text-[#ADFF2F]">
              <thead className="border-b-2 border-[#00FF00] bg-[#002a12]/60">
                <tr>
                  <th className="py-3 text-lg font-bold">#</th>
                  <th className="py-3 text-lg font-bold">DATE</th>
                  <th className="py-3 text-lg font-bold">TOTAL EARNED ($)</th>
                  <th className="py-3 text-lg font-bold">ACHIEVEMENTS</th>
                  <th className="py-3 text-lg font-bold">STARS</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#003300]/40 transition border-b border-[#003d1a]"
                  >
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3">
                      {new Date(entry.played_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-[#7CFC00]">
                      {entry.score}
                    </td>
                    <td className="py-3 flex justify-center space-x-2">
                      {entry.achievements?.length > 0 ? (
                        entry.achievements.map((achv, i) => (
                          <img
                            key={i}
                            src={
                              achv.icon || "/assets/pixel_achv_placeholder.png"
                            }
                            alt={achv.name}
                            className="w-8 h-8"
                          />
                        ))
                      ) : (
                        <span className="text-[#9ACD32]">None</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-center space-x-1">
                        {Number(entry.star) > 0 ? (
                          [...Array(Number(entry.star))].map((_, i) => (
                            <img
                              key={i}
                              src={star}
                              alt="star"
                              className="w-6 h-6"
                            />
                          ))
                        ) : (
                          <span></span>
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

      {/* Footer */}
      <div className="mt-10 text-[#7CFC00] text-sm opacity-80">
        © 2025 INVESTMENT GAME ▪ Score History
      </div>
    </div>
  );
}
