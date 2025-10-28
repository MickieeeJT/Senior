import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a1b0d] text-green-400 font-mono border-4 border-[#0f3d0f] p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-widest text-[#7CFC00] drop-shadow-[0_0_6px_#00FF00]">
          INVESTMENT GAME
        </h1>
        <div className="h-1 w-80 bg-[#00FF00] mx-auto mt-3"></div>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col items-center gap-6">
        <Link
          to="/tutorial"
          className="bg-[#00FF00] text-[#0a1b0d] text-xl font-bold px-16 py-4 border-2 border-[#ADFF2F] rounded-md shadow-[0_0_10px_#00FF00] hover:bg-[#ADFF2F] transition"
        >
          TUTORIAL
        </Link>

        <Link
          to="/invest"
          className="bg-[#00BFFF] text-[#0a1b0d] text-xl font-bold px-16 py-4 border-2 border-[#00FFFF] rounded-md shadow-[0_0_10px_#00FFFF] hover:bg-[#1E90FF] transition"
        >
          START INVEST
        </Link>

        <Link
          to="/score-history"
          className="bg-[#FFD700] text-[#0a1b0d] text-xl font-bold px-16 py-4 border-2 border-[#FFFF00] rounded-md shadow-[0_0_10px_#FFFF00] hover:bg-[#FFEA00] transition"
        >
          SCORE HISTORY
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-[#ADFF2F] text-sm tracking-wide">
        © 2025 INVESTMENT GAME ▪ v1.0 BETA
      </div>
    </div>
  );
}
