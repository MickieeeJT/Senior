import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { finalGameState, gameComplete, scoreData } = location.state || {};
  
  if (!finalGameState || !gameComplete) {
    navigate("/");
    return null;
  }

  // --- 1. CALCULATE TOTAL MONEY ---
  let stockValue = 0;
  if (finalGameState.holdings?.stocks) {
    Object.values(finalGameState.holdings.stocks).forEach(s => { stockValue += s.shares * (s.avgCost||0); });
  }
  let cryptoValue = 0;
  if (finalGameState.holdings?.currencies) {
    Object.values(finalGameState.holdings.currencies).forEach(c => { cryptoValue += c.units * (c.avgCost||0); });
  }

  const totalMoney = 
    (finalGameState.pocket || 0) + 
    (finalGameState.savingsBalance || 0) + 
    (finalGameState.fundBalance || 0) + 
    (finalGameState.goldBalance || 0) +
    (finalGameState.holdings?.bonds || 0) + stockValue + cryptoValue;

  const playedYears = finalGameState.currentYear || finalGameState.maxYears || 20;
  const totalIncome = finalGameState.totalInvested || (8000 * playedYears); 
  // const totalIncome = finalGameState.totalInvested || (4000 + (8000 * playedYears)); 
  const totalGain = totalMoney - totalIncome;
  const percentGain = ((totalGain / totalIncome) * 100).toFixed(2);

  // --- 2. BOT COMPARISON DATA ---
  const botMoney = (scoreData?.botFinalValue && scoreData.botFinalValue > 0) ? scoreData.botFinalValue : (scoreData?.botScore || totalIncome * 1.05);
  const youWin = totalMoney > botMoney;

  // --- 3. 5-DIMENSION METRICS (FOR WIN/LOSS ANALYSIS ONLY) ---
  const rawPMetrics = scoreData?.playerMetrics || scoreData?.metrics?.playerMetrics || {};
  const rawBMetrics = scoreData?.botMetrics || scoreData?.metrics?.botMetrics || {};

  const pMetrics = {
    returnScore: rawPMetrics.returnScore || 0,
    diversification: rawPMetrics.diversification || 0,
    riskTaking: rawPMetrics.riskTaking || 0,
    safety: rawPMetrics.safety || 0,
    accuracy: rawPMetrics.accuracy || 0,
  };

  const bMetrics = {
    returnScore: rawBMetrics.returnScore || 0,
    diversification: rawBMetrics.diversification || 0,
    riskTaking: rawBMetrics.riskTaking || 0,
    safety: rawBMetrics.safety || 0,
    accuracy: rawBMetrics.accuracy || 0,
  };

  // --- 4. WIN / LOSS EXPLANATION LOGIC ---
  const generateExplanation = () => {
    if (youWin) {
      if (pMetrics.returnScore > bMetrics.returnScore && pMetrics.riskTaking > bMetrics.riskTaking) return "You outperformed the AI by taking calculated risks at the right moments.";
      if (pMetrics.safety > bMetrics.safety && pMetrics.diversification >= bMetrics.diversification) return "Victory through stability! Excellent diversification protected you from market crashes.";
      if (pMetrics.diversification > bMetrics.diversification) return "Your superior asset diversification led to stronger, more resilient growth than the AI.";
      return "You managed your portfolio decisively, timing the market perfectly to beat the AI's algorithm!";
    } else {
      if (pMetrics.safety > 75 && bMetrics.returnScore > pMetrics.returnScore) return "Too conservative. Hoarding cash caused you to miss out on the gains the AI captured.";
      if (bMetrics.diversification > pMetrics.diversification) return "The AI won through diversification. Spreading investments across multiple assets minimized its losses.";
      if (bMetrics.riskTaking > pMetrics.riskTaking) return "The AI correctly identified bullish trends and bought risky assets, compounding its returns past yours.";
      return "The AI's algorithm adapted to market conditions and rebalanced its portfolio more effectively this time.";
    }
  };
  
  const explanationText = generateExplanation();
  const starCount = scoreData?.star || 0;
  const feedbackDetails = scoreData?.details || [];

  // --- 5. FIND HIGHEST / LOWEST PERFORMERS ---
  const performances = [
    { name: "Savings Account", profit: finalGameState.profit?.savings || 0 },
    { name: "Government Bonds", profit: finalGameState.profit?.bonds || 0 },
    { name: "Index Fund", profit: finalGameState.profit?.index || 0 },
    { name: "Gold", profit: finalGameState.profit?.gold || 0 }
  ];

  if (finalGameState.profit?.stocks) {
    Object.entries(finalGameState.profit.stocks).forEach(([symbol, profit]) => {
      performances.push({ name: `Stock ${symbol}`, profit });
    });
  }

  if (finalGameState.profit?.currencies) {
    Object.entries(finalGameState.profit.currencies).forEach(([symbol, profit]) => {
      performances.push({ name: `Currency ${symbol}`, profit });
    });
  }

  const highestPerformer = performances.reduce((max, p) => p.profit > max.profit ? p : max, performances[0]);
  const lowestPerformer = performances.reduce((min, p) => p.profit < min.profit ? p : min, performances[0]);

  // --- 6. INVESTMENT PORTFOLIO DATA ---
  const investments = [
    { name: "Savings Account", value: finalGameState.savingsBalance, change: finalGameState.profit?.savings >= 0 ? `+${(finalGameState.profit.savings / (finalGameState.savingsBalance||1) * 100).toFixed(1)}%` : `${(finalGameState.profit?.savings / (finalGameState.savingsBalance||1) * 100 || 0).toFixed(1)}%`, stars: 1 },
    { name: "Gov Bonds", value: finalGameState.holdings?.bonds || 0, change: finalGameState.profit?.bonds >= 0 ? `+${(finalGameState.profit.bonds / (finalGameState.holdings.bonds || 1) * 100).toFixed(1)}%` : `${(finalGameState.profit?.bonds / (finalGameState.holdings?.bonds || 1) * 100 || 0).toFixed(1)}%`, stars: 2 },
    { name: "Index Fund", value: finalGameState.fundBalance, change: finalGameState.profit?.index >= 0 ? `+${(finalGameState.profit.index / (finalGameState.fundBalance||1) * 100).toFixed(1)}%` : `${(finalGameState.profit?.index / (finalGameState.fundBalance||1) * 100 || 0).toFixed(1)}%`, stars: 3 },
    { name: "Gold", value: finalGameState.goldBalance || 0, change: (finalGameState.profit?.gold || 0) >= 0 ? `+${((finalGameState.profit?.gold || 0) / (finalGameState.goldBalance || 1) * 100).toFixed(1)}%` : `${((finalGameState.profit?.gold || 0) / (finalGameState.goldBalance || 1) * 100).toFixed(1)}%`, stars: 1 }
  ];

  if (finalGameState.holdings?.stocks) {
    Object.entries(finalGameState.holdings.stocks).forEach(([symbol, holding]) => {
      const profit = finalGameState.profit?.stocks?.[symbol] || 0;
      const value = holding.shares * holding.avgCost;
      investments.push({ name: `Stock ${symbol}`, value, change: profit >= 0 ? `+${(profit / (value||1) * 100).toFixed(1)}%` : `${(profit / (value||1) * 100).toFixed(1)}%`, stars: profit > value * 0.1 ? 3 : profit > 0 ? 2 : 1 });
    });
  }

  // --- 7. ACHIEVEMENTS & TAKEAWAYS ---
  const unlockedCodes = scoreData?.newAchievements || [];
  const achievements = unlockedCodes.length > 0 
    ? unlockedCodes.map(code => ({ name: code.replace(/_/g, " "), icon: "🏆" }))
    : [
        { name: "Investment Complete", icon: "🏆" },
        { name: youWin ? "Beat the Bot" : "Learning Experience", icon: youWin ? "🥇" : "📚" }
      ];

  const takeaways = [
    `Total Return: ${percentGain >= 0 ? '+' : ''}${percentGain}% over ${playedYears} years`,
    `Best Investment: ${highestPerformer.name} (+${highestPerformer.profit.toFixed(2)}$)`,
    `Diversification: You invested in ${investments.filter(inv => inv.value > 0).length} different asset types`
  ];

  return (
    <div className="min-h-screen bg-[url('/retro-green.png')] bg-cover bg-center text-[#00ffcc] font-mono text-[#aaffaa]">
      <div className=" bg-[#002b11]/90 min-h-screen flex flex-col items-center px-6 py-10">
       
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#7CFC00]">FINAL GAME SUMMARY</h1>
          <p className="text-sm text-[#66ffcc]">Investment Performance Overview - {playedYears} Years Complete!</p>
        </div>

        {/* TOP SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
          <div className="bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-4 rounded-xl text-center flex flex-col justify-center">
            <h2 className="text-lg font-bold text-[#00ff99]">Total Money</h2>
            <p className="text-2xl mt-1">${totalMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className={`${totalGain >= 0 ? 'text-[#00ff66]' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}{percentGain}%
            </p>
          </div>
          <div className="bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-4 rounded-xl text-center flex flex-col justify-center">
            <h2 className="text-lg font-bold text-[#00ffaa]">Highest Performer</h2>
            <p className="text-xl mt-1 text-white">{highestPerformer.name}</p>
            <p className="text-sm text-[#66ffcc]">+${highestPerformer.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-4 rounded-xl text-center flex flex-col justify-center">
            <h2 className="text-lg font-bold text-[#33ff88]">Lowest Performer</h2>
            <p className="text-xl mt-1 text-white">{lowestPerformer.name}</p>
            <p className="text-sm text-red-400">${lowestPerformer.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* PERFORMANCE ASSESSMENT */}
        <div className="w-full max-w-5xl bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#00ff88] mb-4 text-center">Performance Assessment</h2>
          <div className="flex justify-center mb-6 gap-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-4xl drop-shadow-md ${i < starCount ? "text-yellow-400" : "text-gray-700 opacity-50"}`}>★</span>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {feedbackDetails.map((detail, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#001a0a] p-3 rounded-lg border border-[#11942F]/50">
                <span className={`text-xl ${detail.passed ? "text-[#33ff33]" : "text-red-500"}`}>{detail.passed ? "✅" : "❌"}</span>
                <span className="text-[#aaffaa] text-sm font-bold">{detail.msg}</span>
              </div>
            ))}
          </div>
          <div className={`p-4 rounded-lg border-2 shadow-inner ${youWin ? "bg-[#002b11] border-[#33ff33]" : "bg-[#2b0000] border-red-500"}`}>
            <h3 className={`text-lg font-bold mb-2 ${youWin ? "text-[#33ff33]" : "text-red-500"}`}>
              {youWin ? "🏆 MATCH RESULT: YOU WIN!" : "💀 MATCH RESULT: AI BOT WINS!"}
            </h3>
            <p className="text-white text-sm leading-relaxed">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs block mb-1">Analysis Report:</span> 
              {explanationText}
            </p>
          </div>
        </div>

        {/* BOT COMPARISON (NET WORTH) */}
        <div className="w-full max-w-5xl bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#00ff88] mb-4">BOT Comparison</h2>
          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b border-[#008866]">
                <td className="py-2 text-[#66ffcc]">YOU</td>
                <td className="text-[#00ffaa]">${totalMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className={youWin ? "text-[#00ff66] font-bold" : "text-red-400"}>{youWin ? "WINNER!" : "LOSER"}</td>
              </tr>
              <tr>
                <td className="py-2 text-[#66ffcc]">BOT</td>
                <td className="text-[#55ddbb]">${botMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="text-[#447799]">{youWin ? "Defeated" : "Winner"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* INVESTMENT PORTFOLIO */}
        <div className="w-full max-w-5xl bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] rounded-xl p-6 mb-10">
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
                <tr key={idx} className="border-b border-[#005544] hover:bg-[#003322]/50 transition-colors">
                  <td className="py-2">{item.name}</td>
                  <td>{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className={item.change.startsWith("+") ? "text-[#00ff66]" : "text-red-400"}>{item.change}</td>
                  <td>{"⭐".repeat(item.stars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KEY TAKEAWAYS */}
        <div className="w-full max-w-5xl bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#33ffbb] mb-4">💡 Key Takeaways</h2>
          <ul className="list-disc pl-6 text-sm text-[#99ffe6]">
            {takeaways.map((t, i) => <li key={i} className="mb-2">{t}</li>)}
          </ul>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="w-full max-w-5xl bg-black/50 border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-[#00ffaa] mb-4">Achievements</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {achievements.map((a, i) => (
              <div key={i} className="bg-[#002b22] border border-[#00ff99] rounded-lg p-4 w-40 text-center hover:bg-[#003b2a] transition">
                <div className="text-4xl mb-2">{a.icon}</div>
                <p className="text-sm text-[#99ffe6]">{a.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 pb-10">
          <button onClick={() => navigate("/select-strategy", { state: { forceNew: true } })} className="bg-[#00ff99] text-black px-6 py-2 rounded-lg font-bold hover:bg-[#00dd88] transition">Play Again</button>
          <button onClick={() => navigate("/")} className="bg-[#003322] text-[#00ffcc] px-6 py-2 rounded-lg font-bold hover:bg-[#004433] transition">Return to Menu</button>
        </div>

      </div>
    </div>
  );
}