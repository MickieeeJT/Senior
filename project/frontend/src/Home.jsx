import { Link } from "react-router-dom";

export default function Home() {
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

          <Link to="/invest" className={buttonStyle}>
            START INVEST
          </Link>

          <Link to="/score-history" className={buttonStyle}>
            SCORE HISTORY
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-[#005500] text-l tracking-widest uppercase">
          © 2025 Investment Game System • <span className="animate-blink">READY</span>
        </div>
      </div>
    </div>
  );
}