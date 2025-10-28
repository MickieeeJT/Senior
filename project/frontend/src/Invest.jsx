import { useState } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import index from "./assets/Index.png";
import gold from "./assets/Gold.png";

export default function Invest() {
  const [balance, setBalance] = useState(1234567.8);
  const [currentYear, setCurrentYear] = useState(10);
  const [currentMonth, setCurrentMonth] = useState(8.5);
  const [showExitModal, setShowExitModal] = useState(false);

  const [activeInput, setActiveInput] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedBond, setSelectedBond] = useState("");
  const [selected, setSelected] = useState(null);

  // Dynamic profit state
  const [profit, setProfit] = useState({
    savings: 0,
    bonds: 0,
    index: 0,
    stocks: [0, 0, 0, 0],
    gold: 0,
    currency: { USD: 0, EUR: 0, JPY: 0, CAD: 0 },
  });

  const navigate = useNavigate();
  const options = ["1", "10", "25", "MAX"];

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigate(-1);
  };

  const toggleInput = (type) => {
    setActiveInput((prev) => (prev === type ? null : type));
    setSelectedBond("");
  };

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (!isNaN(value)) {
      if (activeInput === "savings-deposit") setBalance((prev) => prev + value);
      else if (activeInput === "savings-withdraw")
        setBalance((prev) => prev - value);
      else if (activeInput === "index-buy") setBalance((prev) => prev - value);
      else if (activeInput === "index-sell") setBalance((prev) => prev + value);
      else if (activeInput?.includes("bond"))
        setBalance((prev) => prev - value);
      else if (activeInput?.includes("gold")) {
        if (activeInput.includes("buy")) setBalance((prev) => prev - value);
        else setBalance((prev) => prev + value);
      }

      // Example profit updates (replace with backend API data)
      if (activeInput?.includes("savings"))
        setProfit((prev) => ({
          ...prev,
          savings: prev.savings + value * 0.01,
        }));
      else if (activeInput?.includes("bond"))
        setProfit((prev) => ({ ...prev, bonds: prev.bonds + value * 0.02 }));
      else if (activeInput?.includes("index"))
        setProfit((prev) => ({ ...prev, index: prev.index + value * 0.03 }));
      else if (activeInput?.includes("gold"))
        setProfit((prev) => ({ ...prev, gold: prev.gold + value * 0.015 }));
    }
    setAmount("");
    setActiveInput(null);
    setSelectedBond("");
  };

  return (
    <div className="min-h-screen bg-[#011D10] text-[#494a48] font-mono flex flex-col p-6">
      {/* Header */}
      <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-2">
        <h1 className="text-6xl font-jersey text-[#B7FD5E] mx-8">
          INVESTMENT GAME
        </h1>
        <nav className="flex gap-10 text-5xl font-jersey mr-3">
          <button
            onClick={() => setShowExitModal(true)}
            className="text-[#B7FD5E] hover:text-white transition"
          >
            Exit
          </button>
        </nav>
      </header>

      {/* Portfolio Overview */}
      <div className="flex mx-10 justify-between items-center">
        <div className="text-center mb-3">
          <h2 className="text-5xl font-jersey text-white mb-1">
            PORTFOLIO OVERVIEW
          </h2>
          <p className="text-5xl font-jersey text-[#B7FD5E]">
            {balance.toLocaleString()} $
          </p>
        </div>

        <div className="self-center mb-6 w-1/4">
          <p className="text-4xl font-jersey text-white mb-1 text-center">
            YEAR {currentYear} OF 20
          </p>

          {/* Progress Bar Container */}
          <div className="relative h-8 w-full bg-white border border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] overflow-hidden">
            {/* Filled Progress */}
            <div
              className="h-full bg-[#B7FD5E] transition-all duration-500"
              style={{ width: `${(currentMonth / 12) * 100}%` }}
            ></div>

            {/* Month Markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full w-[3px] bg-[#188040]"
                style={{ left: `${(i / 12) * 100}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main investment panels */}
      <div className="grid grid-cols-3 gap-3">
        {/* Savings */}
        <div className="bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">
            SAVING ACCOUNT
          </h3>
          <div className="flex justify-center">
            <img src={saving} alt="saving icon" className="w-[90px] h-[90px]" />
          </div>
          <p className="text-white text-2xl font-jersey">
            Balance: {balance.toLocaleString()} $
          </p>
          <p className="text-white text-2xl font-jersey">
            Profit: {profit.savings.toLocaleString()} $
          </p>
          {!activeInput?.includes("savings") && (
            <div className="flex justify-center gap-4 mt-1 transition-opacity duration-300">
              <button
                onClick={() => toggleInput("savings-withdraw")}
                className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                WITHDRAW
              </button>
              <button
                onClick={() => toggleInput("savings-deposit")}
                className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                DEPOSIT
              </button>
            </div>
          )}
          <div
            className={`mt-1 overflow-hidden transition-all duration-500 flex justify-center items-center gap-4 ${
              activeInput?.includes("savings")
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {activeInput?.includes("savings") && (
              <>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  {activeInput === "savings-deposit" ? "DEPOSIT" : "WITHDRAW"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Government Bonds */}
        <div className="bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">
            GOVERNMENT BONDS
          </h3>
          <p className="text-white text-2xl font-jersey mb-4">
            Profit: {profit.bonds.toLocaleString()} $
          </p>

          {!activeInput?.includes("bond") && (
            <button
              onClick={() => toggleInput("bond-select")}
              className="bg-[#11942F] text-white text-2xl font-jersey px-6 py-2 rounded hover:bg-[#B7FD5E]"
            >
              BUY
            </button>
          )}

          {activeInput === "bond-select" && (
            <div className="mt-4 flex flex-col items-center space-y-5">
              <div className="flex justify-center gap-6">
                {["1 year", "5 years", "10 years"].map((t) => (
                  <div
                    key={t}
                    onClick={() => setSelectedBond(t)}
                    className={`font-bold rounded-full w-16 h-16 flex items-center justify-center cursor-pointer transition-all ${
                      selectedBond === t
                        ? "bg-[#B7FD5E] text-black scale-105 shadow-[0_0_10px_#00FF00]"
                        : "bg-gray-100 text-black hover:bg-gray-300"
                    }`}
                  >
                    {t.split(" ")[0]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40 focus:ring-2 focus:ring-[#00FF00] focus:outline-none"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#00FF00] text-black font-bold px-5 py-2 rounded hover:bg-[#5CFF5C] transition-all"
                >
                  BUY
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Index Fund */}
        <div className="bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">INDEX FUND</h3>
          <div className="flex justify-center">
            <img src={index} alt="index icon" className="w-[90px] h-[90px]" />
          </div>
          <p className="text-white text-2xl font-jersey">
            Profit: {profit.index.toLocaleString()} $
          </p>

          {!activeInput?.includes("index") && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => toggleInput("index-sell")}
                className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                SELL
              </button>
              <button
                onClick={() => toggleInput("index-buy")}
                className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                BUY
              </button>
            </div>
          )}

          <div
            className={`mt-2 overflow-hidden transition-all duration-500 flex justify-center items-center gap-4 ${
              activeInput?.includes("index")
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {activeInput?.includes("index") && (
              <>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  {activeInput === "index-buy" ? "BUY" : "SELL"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stocks */}
        <div className="col-span-3 bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-center text-3xl font-jersey mb-2 text-white">
            INDIVIDUAL STOCKS
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i, idx) => (
              <div
                key={i}
                className="border-2 border-dashed border-white p-3 text-center rounded"
              >
                <p className="text-white text-2xl font-jersey">xxxxx</p>
                <p className="text-white text-2xl font-jersey">xx.xx $</p>
                <p className="text-green-400 text-2xl font-jersey">▲ 2.25%</p>
                <p className="text-white text-2xl font-jersey">
                  Profit: {profit.stocks[idx].toLocaleString()} $
                </p>
                <p className="text-white text-2xl font-jersey">Shares: 0</p>
                <div className="flex justify-center gap-4 mt-2">
                  <button className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]">
                    SELL
                  </button>
                  <button className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]">
                    BUY
                  </button>
                </div>
                <div className="px-8 mt-1 flex justify-between">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelected(option)}
                      className={`text-2xl font-jersey transition-all duration-200 ${
                        selected === option
                          ? "text-[#afffaf] drop-shadow-[0_0_8px_#00FF00]"
                          : "text-white opacity-70 hover:opacity-100"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gold */}
        <div className="bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">GOLD</h3>
          <div className="flex justify-center">
            <img src={gold} alt="gold icon" className="w-[90px] h-[90px]" />
          </div>{" "}
          <p className="text-white text-2xl font-jersey">
            Profit: {profit.gold.toLocaleString()} $
          </p>
          {!activeInput?.includes("gold") && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => toggleInput("gold-sell")}
                className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                SELL
              </button>
              <button
                onClick={() => toggleInput("gold-buy")}
                className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                BUY
              </button>
            </div>
          )}
          <div
            className={`mt-2 overflow-hidden transition-all duration-500 flex justify-center items-center gap-4 ${
              activeInput?.includes("gold")
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {activeInput?.includes("gold") && (
              <>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  {activeInput.includes("buy") ? "BUY" : "SELL"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Currency */}
        <div className="col-span-2 bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">
            CURRENCY EXCHANGE
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {["USD", "EUR", "JPY", "CAD"].map((c) => (
              <div
                key={c}
                className="border-2 border-dashed border-white p-3 rounded"
              >
                <p className="text-white text-2xl font-jersey">{c}</p>
                <p className="text-green-400 text-2xl font-jersey">▲ 2.25%</p>
                <p className="text-white text-2xl font-jersey">
                  Profit: {profit.currency[c].toLocaleString()} $
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <button className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]">
                    SELL
                  </button>
                  <button className="bg-[#11942F] text-white text-2xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]">
                    BUY
                  </button>
                </div>
                <div className="px-8 mt-1 flex justify-between">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelected(option)}
                      className={`text-2xl font-jersey transition-all duration-200 ${
                        selected === option
                          ? "text-[#afffaf] drop-shadow-[0_0_8px_#00FF00]"
                          : "text-white opacity-70 hover:opacity-100"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-10 text-center">
            <h2 className="text-5xl font-jersey mb-4 text-white">
              Exit the Investment Game?
            </h2>
            <div className="flex justify-center gap-6">
              <button
                onClick={handleExitConfirm}
                className="bg-[#11942F] text-white text-3xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                Yes
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="bg-[#11942F] text-white text-3xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
