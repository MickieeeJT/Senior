import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get final game state from navigation state
  const { finalGameState, gameComplete } = location.state || {};
  
  // If no game data, redirect to home
  if (!finalGameState || !gameComplete) {
    navigate("/");
    return null;
  }

  // Calculate total money
  const totalMoney = 
    finalGameState.pocket + 
    finalGameState.savingsBalance + 
    finalGameState.fundBalance + 
    (finalGameState.goldBalance || 0);

  // Calculate total initial investment (starting money was 4000 + income)
  const totalIncome = 4000 + (4000 * 2 * 20); // Initial + half-year income for 20 years
  const totalGain = totalMoney - totalIncome;
  const percentGain = ((totalGain / totalIncome) * 100).toFixed(2);

  // Bot comparison (simple bot strategy)
  const botMoney = totalIncome * 1.05; // Conservative 5% annual return
  const youWin = totalMoney > botMoney;

  // Find highest and lowest performers
  const performances = [
    { name: "Savings Account", profit: finalGameState.profit.savings || 0 },
    { name: "Government Bonds", profit: finalGameState.profit.bonds || 0 },
    { name: "Index Fund", profit: finalGameState.profit.index || 0 },
    { name: "Gold", profit: finalGameState.profit.gold || 0 }
  ];

  // Add stock profits
  if (finalGameState.profit.stocks) {
    Object.entries(finalGameState.profit.stocks).forEach(([symbol, profit]) => {
      performances.push({ name: `Stock ${symbol}`, profit });
    });
  }

  // Add currency profits
  if (finalGameState.profit.currencies) {
    Object.entries(finalGameState.profit.currencies).forEach(([symbol, profit]) => {
      performances.push({ name: `Currency ${symbol}`, profit });
    });
  }

  const highestPerformer = performances.reduce((max, p) => 
    p.profit > max.profit ? p : max, performances[0]
  );
  const lowestPerformer = performances.reduce((min, p) => 
    p.profit < min.profit ? p : min, performances[0]
  );

  const investments = [
    { 
      name: "Savings Account", 
      value: finalGameState.savingsBalance, 
      change: finalGameState.profit.savings >= 0 ? 
        `+${(finalGameState.profit.savings / finalGameState.savingsBalance * 100 || 0).toFixed(1)}%` :
        `${(finalGameState.profit.savings / finalGameState.savingsBalance * 100 || 0).toFixed(1)}%`,
      stars: 1 
    },
    { 
      name: "Gov Bonds", 
      value: finalGameState.holdings.bonds || 0, 
      change: finalGameState.profit.bonds >= 0 ? 
        `+${(finalGameState.profit.bonds / (finalGameState.holdings.bonds || 1) * 100).toFixed(1)}%` :
        `${(finalGameState.profit.bonds / (finalGameState.holdings.bonds || 1) * 100).toFixed(1)}%`,
      stars: 2 
    },
    { 
      name: "Index Fund", 
      value: finalGameState.fundBalance, 
      change: finalGameState.profit.index >= 0 ? 
        `+${(finalGameState.profit.index / finalGameState.fundBalance * 100 || 0).toFixed(1)}%` :
        `${(finalGameState.profit.index / finalGameState.fundBalance * 100 || 0).toFixed(1)}%`,
      stars: 3 
    },
    { 
      name: "Gold", 
      value: finalGameState.goldBalance || 0, 
      change: (finalGameState.profit.gold || 0) >= 0 ? 
        `+${((finalGameState.profit.gold || 0) / (finalGameState.goldBalance || 1) * 100).toFixed(1)}%` :
        `${((finalGameState.profit.gold || 0) / (finalGameState.goldBalance || 1) * 100).toFixed(1)}%`,
      stars: 1 
    }
  ];

  // Add stocks to investments
  if (finalGameState.holdings.stocks) {
    Object.entries(finalGameState.holdings.stocks).forEach(([symbol, holding]) => {
      const profit = finalGameState.profit.stocks?.[symbol] || 0;
      const value = holding.shares * holding.avgCost;
      investments.push({
        name: `Stock ${symbol}`,
        value,
        change: profit >= 0 ? `+${(profit / value * 100).toFixed(1)}%` : `${(profit / value * 100).toFixed(1)}%`,
        stars: profit > value * 0.1 ? 3 : profit > 0 ? 2 : 1
      });
    });
  }

  const achievements = [
    { name: "Investment Complete", icon: "🏆" },
    { name: youWin ? "Beat the Bot" : "Learning Experience", icon: youWin ? "🥇" : "📚" },
    { name: totalGain > 0 ? "Profitable Investor" : "Risk Taker", icon: totalGain > 0 ? "💎" : "🎯" },
  ];

  const takeaways = [
    `Total Return: ${percentGain >= 0 ? '+' : ''}${percentGain}% over 20 years`,
    `Best Investment: ${highestPerformer.name} (+${highestPerformer.profit.toFixed(2)}$)`,
    `Diversification: You invested in ${investments.filter(inv => inv.value > 0).length} different asset types`
  ];

  return (
    <div className="min-h-screen bg-[url('/retro-green.png')] bg-cover bg-center text-[#00ffcc] font-mono text-[#aaffaa]">
      <div className=" bg-[#002b11] min-h-screen flex flex-col items-center px-6 py-10">
       
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#7CFC00]">
            🏆 FINAL GAME SUMMARY 🏆
          </h1>
          <p className="text-sm text-[#66ffcc]">Investment Performance Overview - 20 Years Complete!</p>
        </div>

        {/* TOP SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
          <div className="bg-black/50 border-2 border-[#00ff99] p-4 rounded-xl text-center">
            <h2 className="text-lg font-bold text-[#00ff99]">Total Money</h2>
            <p className="text-2xl mt-1">${totalMoney.toLocaleString()}</p>
            <p className={`${totalGain >= 0 ? 'text-[#00ff66]' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}{percentGain}%
            </p>
          </div>

          <div className="bg-black/50 border-2 border-[#00ffaa] p-4 rounded-xl text-center">
            <h2 className="text-lg font-bold text-[#00ffaa]">Highest Performer</h2>
            <p className="text-xl mt-1">{highestPerformer.name}</p>
            <p className="text-sm text-[#66ffcc]">+${highestPerformer.profit.toFixed(2)}</p>
          </div>

          <div className="bg-black/50 border-2 border-[#33ff88] p-4 rounded-xl text-center">
            <h2 className="text-lg font-bold text-[#33ff88]">Lowest Performer</h2>
            <p className="text-xl mt-1">{lowestPerformer.name}</p>
            <p className="text-sm text-red-400">${lowestPerformer.profit.toFixed(2)}</p>
          </div>
        </div>

        {/* BOT COMPARISON */}
        <div className="w-full max-w-5xl bg-black/50 border-2 border-[#00ff88] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#00ff88] mb-4">🤖 BOT Comparison</h2>

          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b border-[#008866]">
                <td className="py-2 text-[#66ffcc]">YOU</td>
                <td className="text-[#00ffaa]">${totalMoney.toLocaleString()}</td>
                <td className={youWin ? "text-[#00ff66] font-bold" : "text-red-400"}>
                  {youWin ? "WINNER!" : "LOSER"}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-[#66ffcc]">BOT</td>
                <td className="text-[#55ddbb]">${botMoney.toLocaleString()}</td>
                <td className="text-[#447799]">{youWin ? "Defeated" : "Winner"}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-[#66ffcc] mt-3">
            **Bot Strategy:** Conservative portfolio with bonds and savings accounts (5% annual return).
          </p>
        </div>

        {/* INVESTMENT PORTFOLIO */}
        <div className="w-full max-w-5xl bg-black/50 border-2 border-[#22ff88] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#22ff88] mb-4">Investment Portfolio</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#00ffaa] border-b border-[#009966]">
                <th className="py-2">Asset</th>
                <th>Value ($)</th>
                <th>Return</th>
                <th>Stars</th>
              </tr>
            </thead>
            <tbody>
              {investments.filter(item => item.value > 0).map((item, idx) => (
                <tr key={idx} className="border-b border-[#005544] hover:bg-[#003322]/50">
                  <td className="py-2">{item.name}</td>
                  <td>{item.value.toLocaleString()}</td>
                  <td className={item.change.startsWith("+") ? "text-[#00ff66]" : "text-red-400"}>
                    {item.change}
                  </td>
                  <td>{"⭐".repeat(item.stars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KEY TAKEAWAYS */}
        <div className="w-full max-w-5xl bg-black/50 border-2 border-[#33ffbb] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#33ffbb] mb-4">💡 Key Takeaways</h2>

          <ul className="list-disc pl-6 text-sm text-[#99ffe6]">
            {takeaways.map((t, i) => (
              <li key={i} className="mb-2">{t}</li>
            ))}
          </ul>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="w-full max-w-5xl bg-black/50 border-2 border-[#00ffaa] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#00ffaa] mb-4">Achievements</h2>

          <div className="flex flex-wrap justify-center gap-4">
            {achievements.map((a, i) => (
              <div
                key={i}
                className="bg-[#002b22] border border-[#00ff99] rounded-lg p-4 w-40 text-center hover:bg-[#003b2a] transition"
              >
                <div className="text-4xl mb-2">{a.icon}</div>
                <p className="text-sm text-[#99ffe6]">{a.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 pb-10">
          <button 
            onClick={() => navigate("/invest")}
            className="bg-[#00ff99] text-black px-6 py-2 rounded-lg font-bold hover:bg-[#00dd88] transition"
          >
            Play Again
          </button>
          <button 
            onClick={() => navigate("/")}
            className="bg-[#003322] text-[#00ffcc] px-6 py-2 rounded-lg font-bold hover:bg-[#004433] transition"
          >
            Return to Menu
          </button>
        </div>

      </div>
    </div>
  );
}
