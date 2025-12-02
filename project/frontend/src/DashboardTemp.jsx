import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Inline Star Icon SVG Component to prevent build errors with missing assets
const StarIcon = ({ filled, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "#ffeb3b" : "none"}
    stroke={filled ? "#ffeb3b" : "#555"}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Simple SVG Pie Chart Component (Unchanged)
const SimplePieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  if (total === 0)
    return <div className="text-gray-500">No assets to display</div>;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="-1 -1 2 2" className="w-64 h-64 transform -rotate-90">
        {data.map((item, index) => {
          const sliceAngle = (item.value / total) * 2 * Math.PI;
          const x1 = Math.cos(currentAngle);
          const y1 = Math.sin(currentAngle);
          const x2 = Math.cos(currentAngle + sliceAngle);
          const y2 = Math.sin(currentAngle + sliceAngle);

          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

          const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          currentAngle += sliceAngle;

          return (
            <path
              key={item.name}
              d={pathData}
              fill={item.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${item.name}: $${item.value.toLocaleString()} (${(
                (item.value / total) *
                100
              ).toFixed(1)}%)`}</title>
            </path>
          );
        })}
        <circle cx="0" cy="0" r="0.6" fill="#002b11" />
      </svg>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-xs text-[#aaffaa]">
              {item.name} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- LESSON DATA ---
const getLessonContent = (id, passed) => {
  const lessons = {
    wealth: {
      pass: "You successfully beat inflation! By investing, your money grew faster than the cost of living, preserving your real purchasing power.",
      fail: "Inflation ate your wealth. Keeping money in low-yield accounts means you actually lost purchasing power over 20 years.",
    },
    roi: {
      pass: "Compound interest worked its magic. Earning a high return on your total invested capital is the key to building generational wealth.",
      fail: "Your returns were too conservative. While safety is good, you missed out on the exponential growth that stocks or funds can provide.",
    },
    volatility: {
      pass: "Smooth sailing! A stable portfolio prevents panic selling. You managed to grow your wealth without suffering heart-stopping crashes.",
      fail: "It was a bumpy ride! High volatility is dangerous because it often causes investors to panic and sell at the bottom.",
    },
    diversification: {
      pass: "You mastered Asset Allocation! By mixing growth assets (Stocks) with defensive assets (Gold/Bonds), you balanced risk and reward perfectly.",
      fail: "Don't put all your eggs in one basket. Relying on a single asset class exposes you to massive risk if that specific sector crashes.",
    },
    risk: {
      pass: "You kept a safety net! Maintaining liquidity (Cash/Savings) ensures you never have to sell assets at a loss when emergencies strike.",
      fail: "You ran out of liquidity! Being 'Asset Rich but Cash Poor' is dangerous. Always keep an emergency fund for unexpected events.",
    },
  };
  return lessons[id] ? (passed ? lessons[id].pass : lessons[id].fail) : "";
};

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const { finalGameState, gameComplete, scoreData } = location.state || {};

  if (!finalGameState || !gameComplete) {
    return (
      <div className="min-h-screen bg-[#002b11] flex flex-col items-center justify-center text-[#00ffcc]">
        <h1 className="text-2xl mb-4">No Game Data Found</h1>
        <button
          onClick={() => navigate("/")}
          className="bg-[#00ff99] text-black px-6 py-2 rounded font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  // --- 1. DATA PREPARATION ---

  const assetDistribution = [
    {
      name: "Cash & Savings",
      value: finalGameState.pocket + finalGameState.savingsBalance,
      color: "#00ff99",
    },
    {
      name: "Bonds",
      value: finalGameState.holdings.bonds || 0,
      color: "#33ccff",
    },
    { name: "Index Fund", value: finalGameState.fundBalance, color: "#ffff66" },
    { name: "Gold", value: finalGameState.goldBalance, color: "#ffcc00" },
    {
      name: "Stocks & Crypto",
      value: Math.max(
        0,
        (scoreData?.score || 0) -
          (finalGameState.pocket +
            finalGameState.savingsBalance +
            (finalGameState.holdings.bonds || 0) +
            finalGameState.fundBalance +
            finalGameState.goldBalance)
      ),
      color: "#ff6666",
    },
  ].filter((item) => item.value > 0);

  // --- 2. PERFORMANCE METRICS ---

  const totalMoney = scoreData?.score || 0;
  const totalInvested = finalGameState.totalInvested || 4000;
  const totalGain = totalMoney - totalInvested;
  const percentGain =
    totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;

  // Use the Bot Score from backend, fallback to 1.6x if missing
  const botMoney = scoreData?.botScore || totalInvested * 1.6;
  const youWin = totalMoney > botMoney;

  const feedbackDetails = scoreData?.details || [];

  return (
    <div className="min-h-screen bg-[url('/retro-green.png')] bg-cover bg-center text-[#00ffcc] font-mono text-[#aaffaa]">
      <div className="bg-[#002b11]/90 min-h-screen flex flex-col items-center px-6 py-10 overflow-y-auto">
        {/* HEADER */}
        <div className="text-center mb-8 animate-fade-in-down">
          <h1 className="text-5xl font-bold text-[#7CFC00] font-jersey drop-shadow-[0_0_10px_rgba(124,252,0,0.5)]">
            FINAL ASSESSMENT
          </h1>
          <p className="text-sm text-[#66ffcc] mt-2">
            20-Year Simulation Complete
          </p>
        </div>

        {/* --- MAIN DASHBOARD GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {/* LEFT COLUMN: FINANCIALS */}
          <div className="space-y-6">
            {/* 1. SCORE CARD */}
            <div className="bg-black/60 border-[3px] border-[#00ff99] rounded-xl p-6 shadow-[0_0_15px_rgba(0,255,153,0.2)]">
              <h2 className="text-2xl font-bold text-[#00ff99] mb-4 border-b border-[#00ff99]/30 pb-2">
                Wealth Report
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#aaffaa] text-sm">Final Net Worth</p>
                  <p className="text-3xl text-white font-bold">
                    ${totalMoney.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#aaffaa] text-sm">Total Invested</p>
                  <p className="text-xl text-gray-300">
                    ${totalInvested.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#aaffaa] text-sm">Net Profit</p>
                  <p
                    className={`text-2xl font-bold ${
                      totalGain >= 0 ? "text-[#00ff66]" : "text-red-400"
                    }`}
                  >
                    {totalGain >= 0 ? "+" : ""}
                    {totalGain.toLocaleString()} $
                  </p>
                </div>
                <div>
                  <p className="text-[#aaffaa] text-sm">Total Return</p>
                  <p
                    className={`text-2xl font-bold ${
                      totalGain >= 0 ? "text-[#00ff66]" : "text-red-400"
                    }`}
                  >
                    {percentGain}%
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ASSET ALLOCATION CHART */}
            <div className="bg-black/60 border-[3px] border-[#00ff99] rounded-xl p-6">
              <h2 className="text-2xl font-bold text-[#00ff99] mb-4 text-center">
                Portfolio Allocation
              </h2>
              <SimplePieChart data={assetDistribution} />
            </div>

            {/* 3. VS THE BOT */}
            <div className="bg-black/60 border-[3px] border-[#00ff99] rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#00ffaa]">
                  VS. The Bot
                </h3>
                <p className="text-xs text-[#66ffcc]">
                  Strategy: 50% Bonds / 50% Index (DCA)
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    youWin ? "text-yellow-400" : "text-red-400"
                  }`}
                >
                  {youWin ? "VICTORY!" : "DEFEATED"}
                </p>
                <p className="text-sm">
                  Bot: $
                  {botMoney.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ASSESSMENT & LESSONS */}
          <div className="space-y-6">
            {/* 4. STAR RATING (Using SVG Component) */}
            <div className="bg-black/60 border-[3px] border-[#00ff99] rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-[#00ff99] mb-4">
                Investor Rating
              </h2>
              <div className="flex justify-center gap-3 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    filled={i < (scoreData?.star || 0)}
                    className={`w-12 h-12 transition-all duration-500 ${
                      i < (scoreData?.star || 0)
                        ? "drop-shadow-[0_0_10px_#ffeb3b] scale-110"
                        : "text-gray-600 opacity-30 grayscale scale-90"
                    }`}
                  />
                ))}
              </div>
              <p className="text-2xl text-white font-jersey tracking-wider">
                {scoreData?.star === 5
                  ? "LEGENDARY INVESTOR"
                  : scoreData?.star === 4
                  ? "MASTER STRATEGIST"
                  : scoreData?.star === 3
                  ? "COMPETENT TRADER"
                  : scoreData?.star === 2
                  ? "NOVICE SAVER"
                  : "ROOKIE"}
              </p>
            </div>

            {/* 5. EDUCATIONAL FEEDBACK */}
            <div className="bg-black/60 border-[3px] border-[#00ff99] rounded-xl p-6">
              <h2 className="text-2xl font-bold text-[#00ff99] mb-4 border-b border-[#00ff99]/30 pb-2">
                Lessons Learned
              </h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {feedbackDetails.length > 0 ? (
                  feedbackDetails.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded border-l-4 ${
                        item.passed
                          ? "bg-[#003322] border-green-500"
                          : "bg-[#2a0a0a] border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xl font-bold ${
                            item.passed ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.passed ? "PASSED" : "FAILED"}:
                        </span>
                        <span className="text-white font-bold text-lg capitalize font-jersey tracking-wide">
                          {item.id} Star
                        </span>
                      </div>

                      {/* Technical Feedback */}
                      <p
                        className={`text-sm mb-2 ${
                          item.passed ? "text-[#99ffcc]" : "text-[#ff9999]"
                        }`}
                      >
                        Result: {item.msg}
                      </p>

                      {/* Educational Lesson */}
                      <p className="text-xs text-gray-300 italic border-t border-white/10 pt-2 mt-2">
                        💡 {getLessonContent(item.id, item.passed)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">
                    No detailed feedback available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div className="flex gap-6 mt-10 pb-10">
          <button
            onClick={() => navigate("/invest")}
            className="bg-[#00ff99] text-black text-xl px-8 py-3 rounded-lg font-bold hover:bg-[#00dd88] hover:scale-105 transition shadow-[0_0_15px_rgba(0,255,153,0.4)]"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate("/home")}
            className="bg-transparent border-2 border-[#00ff99] text-[#00ff99] text-xl px-8 py-3 rounded-lg font-bold hover:bg-[#00ff99] hover:text-black transition"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
