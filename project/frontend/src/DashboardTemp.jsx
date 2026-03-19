import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import starAch from "./assets/5stars.png";
import whaleAch from "./assets/whale.png";
import botCrusherAch from "./assets/robot_win.png";
import inflationAch from "./assets/inflation.png";
import turtleAch from "./assets/turtle.png";
import yoloAch from "./assets/stocktrader.png";
import ironHandsAch from "./assets/hand.png";
import hoarderAch from "./assets/money.png";
import goldfingerAch from "./assets/Gold.png";
import couponClipperAch from "./assets/bond.png";
import rektAch from "./assets/rekt.png";
import lostDecadeAch from "./assets/robot_lose.png";

// --- COMPONENTS ---

const StarIcon = ({ filled, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "#B7FD5E" : "none"} // Lime green
    stroke={filled ? "#B7FD5E" : "#11942F"} // Dark green border
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SimplePieChart = ({ data, totalMoney }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  if (total === 0)
    return <div className="text-[#11942F] flex items-center justify-center h-full text-xl font-poiret font-bold">AWAITING DATA...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative pt-4">
      {/* 1. Increased max-w from 320px to 400px to make the chart physically larger */}
      <div className="relative flex items-center justify-center w-full max-w-[400px] aspect-square shrink-0">
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(51,255,51,0.15)]">
          {data.map((item) => {
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
                className="hover:opacity-80 transition-opacity cursor-pointer stroke-[#011D10] stroke-[0.03]"
              >
                <title>{`${item.name}: $${item.value.toLocaleString()}`}</title>
              </path>
            );
          })}
          <circle cx="0" cy="0" r="0.72" fill="#011D10" />
        </svg>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <p className="text-[#11942F] text-sm font-poiret font-bold uppercase tracking-widest mb-1">Total Assets</p>
          <p className="text-4xl font-poiret font-bold text-[#B7FD5E]">${totalMoney.toLocaleString()}</p>
        </div>
      </div>

      {/* Responsive Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-6 w-full px-4 overflow-y-auto custom-scrollbar">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 border border-[#11942F] px-2 py-1 bg-[#001a0a] rounded-sm">
            <div className="w-3 h-3 border border-[#011D10] shrink-0" style={{ backgroundColor: item.color }}></div>
            <span className="text-sm font-poiret font-bold text-white whitespace-nowrap">
              {item.name} <span className="text-[#33ff33]">({((item.value / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DATA ---

const getLessonContent = (id, passed) => {
  const lessons = {
    wealth: { pass: "Beat inflation! Your money outpaced the cost of living.", fail: "Inflation ate your wealth. You lost purchasing power." },
    roi: { pass: "Compound interest worked perfectly. Great returns.", fail: "Returns were too conservative. Missed out on growth." },
    volatility: { pass: "Smooth sailing! A stable portfolio prevents panic.", fail: "High volatility! Bumpy rides cause panic selling." },
    diversification: { pass: "Masterful allocation! Balanced growth and defense.", fail: "Too concentrated. Relying on one asset is risky." },
    risk: { pass: "Kept a safety net! High liquidity for emergencies.", fail: "Ran out of cash! Always keep an emergency fund." },
  };
  return lessons[id] ? (passed ? lessons[id].pass : lessons[id].fail) : "";
};

const ACHIEVEMENT_DATA = {
  "5_STAR": { name: "5-Star", icon: starAch, desc: "Perfect" },
  WHALE: { name: "Whale", icon: whaleAch, desc: "> $1M" },
  BOT_CRUSHER: { name: "Crusher", icon: botCrusherAch, desc: "Beat Bot" },
  INFLATION_BUSTER: { name: "Buster", icon: inflationAch, desc: "> 200%" },
  TURTLE: { name: "Turtle", icon: turtleAch, desc: "0% Risk" },
  YOLO: { name: "YOLO", icon: yoloAch, desc: ">90% Stock" },
  IRON_HANDS: { name: "Iron Hands", icon: ironHandsAch, desc: "Survived Crash" },
  HOARDER: { name: "Hoarder", icon: hoarderAch, desc: ">$100k Cash" },
  GOLDFINGER: { name: "Goldfinger", icon: goldfingerAch, desc: "Gold Lover" },
  COUPON_CLIPPER: { name: "Clipper", icon: couponClipperAch, desc: "Bond Profits" },
  REKT: { name: "Rekt", icon: rektAch, desc: "Lost Money" },
  LOST_DECADE: { name: "Lost Decade", icon: lostDecadeAch, desc: "Lost to Bot" },
};

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { finalGameState, gameComplete, scoreData } = location.state || {};

  if (!finalGameState || !gameComplete) {
    return (
      <div className="h-screen w-screen bg-[#011D10] flex items-center justify-center font-poiret">
        <div className="text-center">
          <p className="text-white text-2xl font-bold mb-6 tracking-widest uppercase">No Terminal Data Found</p>
          <button 
            onClick={() => navigate("/")} 
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-transparent px-8 font-poiret font-bold text-xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none"
          >
            SYSTEM REBOOT (HOME)
          </button>
        </div>
      </div>
    );
  }

  const assetDistribution = [
    { name: "Cash", value: finalGameState.pocket + finalGameState.savingsBalance, color: "#33ff33" }, 
    { name: "Bonds", value: finalGameState.holdings.bonds || 0, color: "#11942F" }, 
    { name: "Index Fund", value: finalGameState.fundBalance, color: "#5EBD50" }, 
    { name: "Gold", value: finalGameState.goldBalance, color: "#B7FD5E" }, 
    { name: "Stocks/Crypto", value: Math.max(0, (scoreData?.score || 0) - (finalGameState.pocket + finalGameState.savingsBalance + (finalGameState.holdings.bonds || 0) + finalGameState.fundBalance + finalGameState.goldBalance)), color: "#ffffff" }, 
  ].filter((item) => item.value > 0);

  const totalMoney = scoreData?.score || 0;
  const totalInvested = finalGameState.totalInvested || 4000;
  const totalGain = totalMoney - totalInvested;
  const percentGain = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;
  const botMoney = scoreData?.botScore || totalInvested * 1.6;
  const youWin = totalMoney > botMoney;
  const feedbackDetails = scoreData?.details || [];
  const sessionAchievements = scoreData?.newAchievements || [];

  const cardStyle = "border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] bg-[#011D10] flex flex-col relative";
  const buttonStyle = "group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-[#001a0a] px-6 font-poiret font-bold text-base tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_4px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#005500] active:translate-y-[2px] active:shadow-none uppercase cursor-pointer";
  const statBoxStyle = "bg-[#001a0a] border border-[#11942F] p-3 flex flex-col justify-center items-center text-center flex-1";

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#011D10] text-white font-poiret p-4 flex flex-col gap-4">
      
      {/* HEADER (Fixed Height) */}
      <header className="flex justify-between items-end border-b-4 border-white pb-2 shrink-0">
        <div className="flex gap-6 items-end">
          <h1 className="text-[#B7FD5E] text-4xl font-poiret font-bold leading-none uppercase tracking-widest drop-shadow-[0_0_8px_rgba(51,255,51,0.5)]">
            Dashboard
          </h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate("/home")} className={buttonStyle}>Main Menu</button>
          <button onClick={() => navigate("/invest")} className={buttonStyle}>Run Again</button>
        </div>
      </header>

      {/* 3-COLUMN MAIN LAYOUT */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* COLUMN 1: Hard Stats & Badges (25% width) - 50/50 split vertically */}
        <div className="w-[25%] flex flex-col gap-4 min-h-0">
          
          {/* Executive Summary (Takes exactly 50% height) */}
          <div className={`${cardStyle} flex-1 min-h-0 p-4`}>
            <h3 className="text-lg font-poiret font-bold mb-3 text-[#B7FD5E] text-center border-b border-[#11942F] pb-2 tracking-widest uppercase shrink-0">Executive Summary</h3>
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div className={statBoxStyle}>
                <p className="text-xs font-poiret font-bold text-[#11942F] uppercase tracking-widest">Net Profit</p>
                <p className={`text-2xl font-poiret font-bold mt-1 ${totalGain >= 0 ? "text-[#33ff33]" : "text-red-500"}`}>
                  {totalGain >= 0 ? "+" : ""}{totalGain.toLocaleString()} $
                </p>
              </div>
              <div className={statBoxStyle}>
                <p className="text-xs font-poiret font-bold text-[#11942F] uppercase tracking-widest">Total Return</p>
                <p className={`text-2xl font-poiret font-bold mt-1 ${totalGain >= 0 ? "text-[#33ff33]" : "text-red-500"}`}>
                  {totalGain >= 0 ? "+" : ""}{percentGain}%
                </p>
              </div>
              <div className={`${statBoxStyle} ${youWin ? "border-[#33ff33] bg-[#002b11]" : "border-red-800 bg-[#2b0000]"}`}>
                <p className="text-[10px] font-poiret font-bold text-white uppercase tracking-widest">Vs Benchmark Bot</p>
                <p className={`text-lg font-poiret font-bold mt-1 uppercase ${youWin ? "text-[#33ff33]" : "text-red-500"}`}>
                  {youWin ? "Outperformed" : "Underperformed"}
                </p>
              </div>
            </div>
          </div>

          {/* Unlocked Badges (Takes exactly 50% height) */}
          <div className={`${cardStyle} flex-1 min-h-0 p-4 flex flex-col`}>
            <h3 className="text-sm font-poiret font-bold mb-3 text-[#B7FD5E] text-center border-b border-[#11942F] pb-2 uppercase tracking-widest shrink-0">Unlocked Badges</h3>
            {sessionAchievements.length > 0 ? (
              <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
                {sessionAchievements.slice(0, 4).map((code) => {
                  const achievement = ACHIEVEMENT_DATA[code];
                  if (!achievement) return null;
                  return (
                    <div key={code} className="bg-[#001a0a] border border-[#11942F] p-2 text-center flex flex-col justify-center items-center hover:bg-[#002b11] transition-colors h-full">
                      <div className="w-12 h-12 mb-1 flex items-center justify-center">
                        <img src={achievement.icon} alt={achievement.name} className="w-full h-full object-contain" />
                      </div>
                      <h3 className="font-poiret font-bold text-white text-[11px] leading-tight uppercase line-clamp-2">{achievement.name}</h3>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#11942F] font-bold text-xs uppercase tracking-widest text-center">NO BADGES<br/>DETECTED</div>
            )}
          </div>

        </div>

        {/* COLUMN 2: Asset Allocation (40% width) */}
        <div className="w-[40%] flex flex-col gap-4 min-h-0">
          <div className={`${cardStyle} flex-1 min-h-0 p-4`}>
             <h3 className="text-lg font-poiret font-bold text-[#B7FD5E] text-center border-b border-[#11942F] pb-2 shrink-0 tracking-widest uppercase">Asset Allocation Mapping</h3>
             <div className="flex-1 flex w-full h-full min-h-0 items-center justify-center overflow-hidden">
                <SimplePieChart data={assetDistribution} totalMoney={totalMoney} />
             </div>
          </div>
        </div>

        {/* COLUMN 3: Rating & Logs (35% width) */}
        <div className="w-[35%] flex flex-col gap-4 min-h-0">
          
          {/* Investor Rating (Double the height: h-[120px] -> bold and large) */}
          <div className={`${cardStyle} shrink-0 h-[120px] flex flex-col items-center justify-center p-4`}>
            <h3 className="text-xs font-poiret font-bold text-[#11942F] uppercase tracking-widest mb-3">Investor Rating</h3>
            
            <div className="flex w-full justify-between items-center px-2">
              <div className="flex gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <StarIcon 
                    key={i} 
                    filled={i < (scoreData?.star || 0)} 
                    className={`w-10 h-10 ${i < (scoreData?.star || 0) ? 'drop-shadow-[0_0_8px_rgba(183,253,94,0.6)]' : ''}`} 
                  />
                ))}
              </div>
              <div className="text-xl font-bold text-[#B7FD5E] uppercase tracking-widest border-2 border-[#B7FD5E] px-4 py-2 bg-[#001a0a] shadow-[0_0_10px_rgba(183,253,94,0.2)]">
                {scoreData?.star === 5 ? "LEGENDARY" : scoreData?.star === 4 ? "MASTER" : scoreData?.star === 3 ? "COMPETENT" : scoreData?.star === 2 ? "NOVICE" : "ROOKIE"}
              </div>
            </div>
          </div>

          {/* Terminal Logs (System Diagnostics) */}
          <div className={`${cardStyle} flex-1 min-h-0 flex flex-col p-0`}>
            <div className="p-3 bg-[#001a0a] border-b border-[#11942F] shrink-0">
              <h3 className="text-sm font-poiret font-bold text-[#B7FD5E] uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#33ff33] rounded-full animate-pulse"></span>
                System Diagnostics
              </h3>
            </div>
            
            {/* Terminal output area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 font-mono bg-[#011108]">
              {feedbackDetails.map((item, idx) => (
                <div key={idx} className="text-sm leading-relaxed border-b border-[#11942F]/30 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <span className={`font-bold shrink-0 ${item.passed ? "text-[#33ff33]" : "text-red-500"}`}>
                      {item.passed ? "[OK]" : "[ERR]"}
                    </span>
                    <span className="text-[#5EBD50] uppercase shrink-0">{item.id}_MODULE:</span>
                    <span className="text-gray-200">{item.msg}</span>
                  </div>
                  <div className="pl-12 mt-1.5 text-[#11942F] italic">
                    <span className="text-[#33ff33] mr-2">↳</span> 
                    {getLessonContent(item.id, item.passed)}
                  </div>
                </div>
              ))}
              <div className="text-[#11942F] text-xs mt-2 animate-pulse">_END OF LOG</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}