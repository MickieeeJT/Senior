import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import randomEvent from "./data/Event/event.json";
import MiniChart from "./MiniChart";

const API_BASE_URL = "http://localhost:8000/api/invest";

//Import all index fund data files
const indexFiles = import.meta.glob("./data/IndexFund/*.json", { eager: true });
const stockFiles = import.meta.glob("./data/Stocks/*.json", { eager: true });
const goldFiles = import.meta.glob("./data/Gold/*.json", { eager: true });
const currencyFiles = import.meta.glob("./data/Currencies/*.json", { eager: true });

// --- HELPER FUNCTIONS FOR INITIALIZATION ---
const getRandomStocks = () => {
  const allStocks = Object.entries(stockFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));
  return allStocks.sort(() => Math.random() - 0.5).slice(0, 4);
};

const getRandomIndex = () => {
  const allIndexes = Object.entries(indexFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));
  return allIndexes[Math.floor(Math.random() * allIndexes.length)];
};

const getRandomGold = () => {
  const allGold = Object.entries(goldFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));
  return allGold[Math.floor(Math.random() * allGold.length)];
};

const getRandomCurrency = () => {
  const allCurrencies = Object.entries(currencyFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));
  return allCurrencies.sort(() => Math.random() - 0.5).slice(0, 3);
};

export default function Invest() {
  const navigate = useNavigate();

  // --- STATE ---
  const [sessionId, setSessionId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [isRunning, setIsRunning] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isProcessingYear, setIsProcessingYear] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);

  // Asset States
  const [activeInput, setActiveInput] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedBond, setSelectedBond] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [indexValue, setIndexValue] = useState(0);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [stockAmounts, setStockAmounts] = useState({});
  const [activeStockInput, setActiveStockInput] = useState(null);
  const [selectedGold, setSelectedGold] = useState(null);
  const [goldValue, setGoldValue] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState([]);
  const [currencyAmounts, setCurrencyAmounts] = useState({});
  const [activeCurrencyInput, setActiveCurrencyInput] = useState(null);

  // Event & Timer
  const [eventData, setEventData] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState(0);
  const [inDebtMode, setInDebtMode] = useState(false);
  const randomEvents = randomEvent;
  const timerRef = useRef(null);
  const processingRef = useRef(null);

  // Refs for Live Data (Crucial for timers and async functions)
  const gameStateRef = useRef(gameState);
  const stocksRef = useRef(selectedStocks);
  const currencyRef = useRef(selectedCurrency);
  const currentMonthRef = useRef(currentMonth);
  const selectedIndexRef = useRef(selectedIndex);

  useEffect(() => {
    gameStateRef.current = gameState;
    stocksRef.current = selectedStocks;
    currencyRef.current = selectedCurrency;
    currentMonthRef.current = currentMonth;
    selectedIndexRef.current = selectedIndex;
  }, [gameState, selectedStocks, selectedCurrency, currentMonth, selectedIndex]);

  // Calculate Total Assets for UI
  useEffect(() => {
    if (!gameState) return;
    const displayTotalMonths = (gameState.currentYear - 1) * 12 + Math.max(0, Math.floor(currentMonth) - 1);
    let total = gameState.pocket + gameState.savingsBalance + (gameState.holdings.bonds || 0) + gameState.fundBalance + gameState.goldBalance;

    if (gameState.holdings.stocks) {
      selectedStocks.forEach((stock) => {
        const holding = gameState.holdings.stocks[stock.symbol];
        if (holding && holding.shares > 0) {
          const monthIndex = displayTotalMonths % stock.data.length;
          total += holding.shares * stock.data[monthIndex].close;
        }
      });
    }
    if (gameState.holdings.currencies) {
      selectedCurrency.forEach((curr) => {
        const holding = gameState.holdings.currencies[curr.symbol];
        if (holding && holding.units > 0) {
          const monthIndex = displayTotalMonths % curr.data.length;
          total += holding.units * curr.data[monthIndex].close;
        }
      });
    }
    setTotalAssets(total);
  }, [gameState, currentMonth, selectedStocks, selectedCurrency]);

  function getRandomEvent() {
    return randomEvents[Math.floor(Math.random() * randomEvents.length)];
  }

  const calculateCurrentNetWorth = () => {
    const gs = gameStateRef.current;
    if (!gs) return 0;
    const displayTotalMonths = (gs.currentYear - 1) * 12 + Math.floor(currentMonthRef.current) - 1;
    let total = gs.pocket + gs.savingsBalance + (gs.holdings.bonds || 0) + gs.fundBalance + gs.goldBalance;

    if (gs.holdings.stocks) {
      stocksRef.current.forEach((stock) => {
        const holding = gs.holdings.stocks[stock.symbol];
        if (holding && holding.shares > 0) {
          const monthIndex = displayTotalMonths % stock.data.length;
          total += holding.shares * stock.data[monthIndex].close;
        }
      });
    }
    if (gs.holdings.currencies) {
      currencyRef.current.forEach((curr) => {
        const holding = gs.holdings.currencies[curr.symbol];
        if (holding && holding.units > 0) {
          const monthIndex = displayTotalMonths % curr.data.length;
          total += holding.units * curr.data[monthIndex].close;
        }
      });
    }
    return total;
  };

  const saveScore = async () => {
    const gs = gameStateRef.current;
    if (!gs) return null;

    const finalStockPrices = {};
    const totalMonthsPassed = Math.max(0, (gs.currentYear - 1) * 12 + Math.floor(currentMonthRef.current) - 1);

    stocksRef.current.forEach((stock) => {
      const monthIndex = totalMonthsPassed % stock.data.length;
      finalStockPrices[stock.symbol] = stock.data[monthIndex].close;
    });

    const finalCurrencyPrices = {};
    currencyRef.current.forEach((curr) => {
      const monthIndex = totalMonthsPassed % curr.data.length;
      finalCurrencyPrices[curr.symbol] = curr.data[monthIndex].close;
    });

    const botIndexHistory = [];
    const idx = selectedIndexRef.current;
    if (idx && idx.data) {
      for (let m = 0; m <= 240; m += 6) {
        const dataIndex = m % idx.data.length;
        botIndexHistory.push(idx.data[dataIndex].close);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/end-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          sessionId: gs.sessionId, 
          finalStockPrices, 
          finalCurrencyPrices, 
          botIndexHistory 
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        return {
          score: data.score,
          botScore: data.botScore,
          star: data.star,
          details: data.details,
          metrics: data.metrics,
          newAchievements: data.newAchievements
        };
      } else {
        alert("Failed to save score.");
        return null;
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  useEffect(() => {
    const randomStocks = getRandomStocks();
    const randomIndex = getRandomIndex();
    const randomGold = getRandomGold();
    const randomCurrency = getRandomCurrency();
    setSelectedStocks(randomStocks);
    setSelectedIndex(randomIndex);
    setIndexValue(randomIndex.data[0].close);
    setSelectedGold(randomGold);
    setGoldValue(randomGold.data[0].close);
    setSelectedCurrency(randomCurrency);
  }, []);

  useEffect(() => {
    const initGame = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        setSessionId(data.sessionId);
        setGameState(data.gameState);
        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize game:", error);
        alert("Failed to start game");
      }
    };
    initGame();
  }, []);

  // --- MAIN GAME TIMER ---
  useEffect(() => {
    if (!isRunning || !gameState || isProcessingYear) return;
    if (timerRef.current) return;

    const duration = 600;
    const steps = 100;
    const interval = duration / steps;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsProcessingYear(true);
          const currentNetWorth = calculateCurrentNetWorth();

          fetch(`${API_BASE_URL}/year-increment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, currentNetWorth }),
          })
            .then((res) => res.json())
            .then(async (data) => {
              if (data.gameComplete) {
                setIsRunning(false);
                const saved = await saveScore();
                if (saved) {
                  setTimeout(() => {
                    navigate("/dashboard", {
                      state: { finalGameState: data.gameState, gameComplete: true, scoreData: saved },
                    });
                  }, 2000);
                }
              }
              if (!data.gameComplete) {
                setGameState(data.gameState);
                setProgress(0);
                setCurrentMonth(1);
                setIsProcessingYear(false);
              }
            })
            .catch((error) => {
              console.error("Year increment failed:", error);
              setIsProcessingYear(false);
            });
          return 100;
        }
        const newProgress = prev + 1;
        const newMonth = Math.floor((newProgress / 100) * 12) + 1;
        setCurrentMonth(newMonth);
        return newProgress;
      });
    }, interval);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning, sessionId, isProcessingYear, navigate, gameState]);

  // --- MONTHLY UPDATE EFFECT ---
  useEffect(() => {
    if (!sessionId || !gameState || !selectedIndex || !selectedGold) return;
    const month = Math.floor(currentMonth);

    if (month >= 1 && month <= 12 && month > gameState.lastProcessedMonth) {
      const updateKey = `${gameState.currentYear}-${month}`;
      if (processingRef.current === updateKey) return;
      processingRef.current = updateKey;

      if (Math.random() < 0) {
        const event = getRandomEvent();
        setEventData(event);
        setShowEventModal(true);
      }

      const totalMonths = (gameState.currentYear - 1) * 12 + (month - 1);
      const monthIndex = totalMonths % selectedIndex.data.length;
      const currentIndexData = selectedIndex.data[monthIndex];
      setIndexValue(currentIndexData.close);

      const goldMonthIndex = totalMonths % selectedGold.data.length;
      const currentGoldData = selectedGold.data[goldMonthIndex];
      setGoldValue(currentGoldData.close);

      fetch(`${API_BASE_URL}/monthly-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          month,
          indexData: currentIndexData,
          goldData: currentGoldData,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setGameState(data.gameState);
          return fetch(`${API_BASE_URL}/bond-update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        })
        .then((res) => (res ? res.json() : null))
        .then((data) => {
          if (data?.gameState) setGameState(data.gameState);
          return fetch(`${API_BASE_URL}/gold-update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, goldData: currentGoldData }),
          });
        })
        .then((res) => (res ? res.json() : null))
        .then((data) => {
          if (data?.gameState) setGameState(data.gameState);
        })
        .catch((error) =>
          console.error("Monthly, bond, or gold update failed:", error)
        );
    }
  }, [currentMonth, sessionId, gameState, selectedIndex, selectedGold]);

  const handleTransaction = async (action, transactionAmount, bondType = null) => {
    if (!sessionId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action, amount: transactionAmount, bondType, indexValue, goldValue }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.error); return; }
      setGameState(data.gameState);
      setAmount("");
      setActiveInput(null);
      setSelectedBond("");
    } catch (error) { console.error("Transaction failed:", error); alert("Transaction failed"); }
  };

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) { alert("Please enter a valid amount!"); return; }
    if (activeInput === "bond-select") {
      if (!selectedBond) { alert("Please select a bond duration!"); return; }
      handleTransaction("bond-buy", value, selectedBond);
    } else if (activeInput) { handleTransaction(activeInput, value); }
  };

  const toggleInput = (type) => {
    setActiveInput((prev) => (prev === type ? null : type));
    setSelectedBond("");
    setAmount("");
  };

  const handleStockTransaction = async (symbol, action, price) => {
    const amountStr = stockAmounts[symbol] || "1";
    let amount = 0;
    const holding = gameState.holdings?.stocks?.[symbol];
    if (amountStr === "MAX") {
      amount = action === "buy" ? Math.floor(gameState.pocket / price) : holding?.shares || 0;
    } else {
      amount = parseInt(amountStr);
    }
    if (amount <= 0 || isNaN(amount)) { alert("Please enter a valid share amount."); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/stock-${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, symbol, amount, price }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Transaction failed"); return; }
      if (data.updatedGameState) setGameState(data.updatedGameState);
      else if (data.gameState) setGameState(data.gameState);
      setActiveStockInput(null);
    } catch (error) { console.error("Stock transaction error:", error); alert("Failed to process stock transaction."); }
  };

  const handleCurrencyTransaction = async (symbol, action, price) => {
    const amountStr = currencyAmounts[symbol] || "1";
    let amount = 0;
    const holding = gameState.holdings?.currencies?.[symbol];
    if (amountStr === "MAX") {
      amount = action === "buy" ? Math.floor(gameState.pocket / price) : holding?.units || 0;
    } else {
      amount = parseInt(amountStr);
    }
    if (amount <= 0 || isNaN(amount)) { alert("Please enter a valid currency amount."); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/currency-${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, symbol, amount, price }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Transaction failed"); return; }
      if (data.updatedGameState) setGameState(data.updatedGameState);
      else if (data.gameState) setGameState(data.gameState);
      setActiveCurrencyInput(null);
    } catch (error) { console.error("Currency transaction error:", error); alert("Failed to process currency transaction."); }
  };

  const handleBondSell = async (inv) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bond-sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, bondId: inv.id }),
      });
      const data = await res.json();
      if (data?.gameState) setGameState(data.gameState);
    } catch (error) { console.error("Error selling bond:", error); }
  };

  const applyEventEffect = async (effect) => {
    const res = await fetch(`${API_BASE_URL}/apply-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, effect }),
    });
    const data = await res.json();
    if (data.updatedGameState) setGameState(data.updatedGameState);
    else if (data.gameState) setGameState(data.gameState);
  };

  const handleExitConfirm = () => { navigate("/"); };

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-[#011D10] flex items-center justify-center">
        <p className="text-white text-4xl font-jersey">Loading...</p>
      </div>
    );
  }

  const currentIndexValue = gameState.indexShares * indexValue;
  const indexUnrealizedProfit = gameState.fundBalance - gameState.holdings.index;
  const displayTotalMonths = (gameState.currentYear - 1) * 12 + Math.max(0, Math.floor(currentMonth) - 1);

  return (
    <div className="min-h-screen bg-[#011D10] text-[#494a48] font-mono flex flex-col p-6">
      <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-1">
        <h1 className="text-5xl font-jersey text-[#B7FD5E] mx-8">
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

      <div className="flex mx-10 justify-between items-center mt-1">
        <div className="flex text-center">
          <h2 className="text-4xl font-jersey text-white mb-1">
            POCKET MONEY :
          </h2>
          <p className="text-4xl font-jersey text-[#B7FD5E] px-8">
            {gameState.pocket.toLocaleString()} $
          </p>
          <h2 className="text-4xl font-jersey text-white mb-1">
            TOTAL ASSET :
          </h2>
          <p className="text-4xl font-jersey text-[#B7FD5E] px-8">
            {totalAssets.toLocaleString()} $
          </p>
        </div>

        <div className="self-center mb-3 pt-1 w-1/4">
          <p className="text-3xl font-jersey text-white mb-1 text-center">
            YEAR {gameState.currentYear} OF 20
          </p>

          <div className="relative h-4 w-full bg-white border border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] overflow-hidden">
            <div
              className="h-full bg-[#85ba3f] transition-all duration-500"
              style={{ width: `${progress + 1}%` }}
            ></div>

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

      <div className="grid grid-cols-3 gap-3">
        {/* Savings Account */}
        <div className="p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">
            SAVING ACCOUNT
          </h3>
          <div className="flex justify-center">
            <img src={saving} alt="saving icon" className="w-[90px] h-[90px]" />
          </div>
          <p className="text-white text-2xl font-jersey">
            Balance: {gameState.savingsBalance.toFixed(2)} $
          </p>
          <p className="text-white text-2xl font-jersey">
            Profit: {gameState.profit.savings.toFixed(2)} $
          </p>
          {!activeInput?.includes("savings") && (
            <div className="flex justify-center gap-4 mt-1 transition-opacity duration-300">
              <button
                onClick={() => toggleInput("savings-withdraw")}
                className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                WITHDRAW
              </button>
              <button
                onClick={() => toggleInput("savings-deposit")}
                className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
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
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40 h-10 text-xl font-jersey"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  {activeInput === "savings-deposit" ? "DEPOSIT" : "WITHDRAW"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Government Bonds */}
        <div className="p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-2 text-white">
            GOVERNMENT BONDS
          </h3>
          <p className="text-white text-2xl font-jersey mb-2">
            Profit: {gameState.profit.bonds.toFixed(2)} $
          </p>

          {!activeInput?.includes("bond") && (
            <button
              onClick={() => toggleInput("bond-select")}
              className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
            >
              BUY
            </button>
          )}

          {activeInput === "bond-select" && (
            <div className="mt-2 flex flex-col items-center space-y-3">
              <div className="flex justify-center gap-4">
                {["1 year", "5 years", "10 years"].map((t) => {
                  const rate = gameState.bondInterestRates[t];
                  const ratePercent = (rate * 100).toFixed(1);

                  return (
                    <div
                      key={t}
                      onClick={() => setSelectedBond(t)}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <div
                        className={`font-bold rounded-full w-14 h-14 flex items-center justify-center transition-all ${
                          selectedBond === t
                            ? "bg-[#B7FD5E] text-black scale-105 shadow-[0_0_10px_#00FF00]"
                            : "bg-gray-100 text-black hover:bg-gray-300"
                        }`}
                      >
                        {t.split(" ")[0]}
                      </div>
                      <div className="text-l font-jersey text-[#B7FD5E] mt-1">
                        {ratePercent}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40 h-10 text-xl font-jersey"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  BUY
                </button>
              </div>
            </div>
          )}

          {/* Bond Investments Progress */}
          {gameState.bondInvestments.length > 0 && (
            <div className="mt-3 flex justify-center gap-4 flex-wrap">
              {gameState.bondInvestments.map((inv) => {
                const progress =
                  ((inv.duration - inv.remaining) / inv.duration) * 100;

                return (
                  <div key={inv.id} className="flex flex-col items-center mb-2">
                    <div className="relative w-16 h-16">
                      <svg
                        viewBox="0 0 36 36"
                        className="w-full h-full rounded-full transform -rotate-90"
                      >
                        <path
                          className="text-gray-700"
                          strokeWidth="30"
                          fill="none"
                          stroke="currentColor"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#B7FD5E]"
                          strokeWidth="30"
                          strokeDasharray={`${progress}, 100`}
                          fill="none"
                          stroke="currentColor"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-jersey text-white">
                        <div className="text-xl font-jersey text-white">
                          ${inv.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBondSell(inv)}
                      className="mt-1 text-white text-l font-jersey hover:underline"
                    >
                      Collect
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Index Fund */}
        <div className="p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-1 text-white">
            INDEX FUND - {selectedIndex?.symbol || "Loading..."}
          </h3>

          {/* Mini Chart */}
          <div className="w-full flex justify-center mb-2">
            <div className="w-[85%] h-[70px]">
              <MiniChart
                data={selectedIndex?.data || []}
                currentIndex={
                  selectedIndex?.data
                    ? displayTotalMonths % selectedIndex.data.length
                    : 0
                }
              />
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <p className="text-white text-xl font-jersey">
              Price: {indexValue.toFixed(2)}
            </p>
            <div
              className={`text-xl font-jersey ${
                selectedIndex?.data[
                  displayTotalMonths % selectedIndex.data.length
                ]?.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {selectedIndex?.data[
                displayTotalMonths % selectedIndex.data.length
              ]?.change >= 0
                ? "▲"
                : "▼"}{" "}
              {Math.abs(
                selectedIndex?.data[
                  displayTotalMonths % selectedIndex.data.length
                ]?.change || 0
              ).toFixed(2)}{" "}
              %
            </div>
          </div>
          <p className="text-white text-xl font-jersey">
            Fund Balance: {gameState.fundBalance.toFixed(2)} $
          </p>
          <p
            className={`text-lg font-jersey ${
              indexUnrealizedProfit >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            Unrealized: {indexUnrealizedProfit.toFixed(2)} $
          </p>

          {!activeInput?.includes("index") && (
            <div className="flex justify-center gap-4 mt-2">
              <button
                onClick={() => toggleInput("index-sell")}
                className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                SELL
              </button>
              <button
                onClick={() => toggleInput("index-buy")}
                className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                BUY
              </button>
            </div>
          )}

          <div
            className={`mt-2 overflow-hidden transition-all duration-500 flex justify-center items-center gap-4 mb-2 ${
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
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40 h-10 text-xl font-jersey"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  {activeInput === "index-buy" ? "BUY" : "SELL"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Individual Stocks */}
        <div className="col-span-3 p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-center text-3xl font-jersey text-white">
            INDIVIDUAL STOCKS
          </h3>

          <div className="lg:col-span-3 p-2 text-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedStocks.map((stock) => {
                const monthIndex = displayTotalMonths % stock.data.length;
                const currentStockData = stock.data[monthIndex];
                const stockId = stock.symbol;
                const holding = gameState.holdings?.stocks?.[stockId];
                const unrealizedStockProfit = holding
                  ? currentStockData.close * holding.shares -
                    holding.avgCost * holding.shares
                  : 0;

                return (
                  <div
                    key={stockId}
                    className="border border-dashed border-white p-3 rounded"
                  >
                    <p className="text-white text-2xl font-jersey">
                      {stock.symbol}
                    </p>

                    {/* Mini CHart */}
                    <div className="w-full flex justify-center mb-2">
                      <div className="w-[85%] h-[70px]">
                        <MiniChart
                          data={stock?.data || []}
                          currentIndex={
                            stock?.data
                              ? displayTotalMonths % stock.data.length
                              : 0
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-between px-8">
                      <p className="text-white text-lg font-jersey">
                        {currentStockData.close.toFixed(2)} $
                      </p>
                      <p
                        className={`text-lg font-jersey ${
                          currentStockData.change >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {currentStockData.change >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(currentStockData.change).toFixed(2)}%
                      </p>
                    </div>

                    <p
                      className={`text-sm font-jersey ${
                        unrealizedStockProfit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      Unrealized: {unrealizedStockProfit.toFixed(2)} $
                    </p>
                    <p className="text-white text-md font-jersey">
                      Shares: {holding?.shares || 0}
                    </p>

                    {/* Amount buttons */}
                    <div className="flex justify-between px-16 mt-2 text-sm">
                      {["1", "10", "25", "MAX"].map((amt) => (
                        <button
                          key={amt}
                          onClick={() =>
                            setStockAmounts({ ...stockAmounts, [stockId]: amt })
                          }
                          className={`text-xl font-jersey transition-all duration-200 ${
                            stockAmounts[stockId] === amt
                              ? "text-[#afffaf] drop-shadow-[0_0_8px_#00FF00]"
                              : "text-white opacity-70 hover:opacity-100"
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-4 mt-3">
                      <button
                        onClick={() =>
                          handleStockTransaction(
                            stockId,
                            "sell",
                            currentStockData.close
                          )
                        }
                        className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                      >
                        SELL
                      </button>
                      <button
                        onClick={() =>
                          handleStockTransaction(
                            stockId,
                            "buy",
                            currentStockData.close
                          )
                        }
                        className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                      >
                        BUY
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gold */}
        <div className="p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-1 text-white">
            GOLD - {selectedGold?.symbol || "Loading..."}
          </h3>
          
          {/* Mini Chart */}
          <div className="w-full flex justify-center mb-2">
            <div className="w-[85%] h-[70px]">
              <MiniChart
                data={selectedGold?.data || []}
                currentIndex={
                  selectedGold?.data
                    ? displayTotalMonths % selectedGold.data.length
                    : 0
                }
              />
            </div>
          </div> 

          <div className="flex justify-center gap-3">
            <p className="text-white text-xl font-jersey">
              Price: {goldValue.toFixed(2)}
            </p>
            <p
              className={`text-lg font-jersey ${
                selectedGold?.data[
                  displayTotalMonths % selectedGold.data.length
                ]?.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {selectedGold?.data[displayTotalMonths % selectedGold.data.length]
                ?.change >= 0
                ? "▲"
                : "▼"}{" "}
              {Math.abs(
                selectedGold?.data[
                  displayTotalMonths % selectedGold.data.length
                ]?.change || 0
              ).toFixed(2)}
              %
            </p>
          </div>
          <p className="text-white text-xl font-jersey">
            Gold Balance: {gameState.goldBalance?.toFixed(2) || 0} $
          </p>
          <p className="text-white text-2xl font-jersey">
            Profit: {gameState.profit?.gold?.toFixed(2) || 0} $
          </p>
          {!activeInput?.includes("gold") && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => toggleInput("gold-sell")}
                className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
              >
                SELL
              </button>
              <button
                onClick={() => toggleInput("gold-buy")}
                className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
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
                  className="px-3 py-2 rounded border border-gray-400 text-black w-40 h-10 text-xl font-jersey"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                >
                  {activeInput === "gold-buy" ? "BUY" : "SELL"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Currency Exchange */}
        <div className="col-span-2 p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-center text-3xl font-jersey text-white">
            CURRENCY EXCHANGE
          </h3>

          <div className="lg:col-span-3 p-2 text-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCurrency.map((currency) => {
                const monthIndex = displayTotalMonths % currency.data.length;
                const currentCurrencyData = currency.data[monthIndex];
                const currencyId = currency.symbol;
                const holding = gameState.holdings?.currencies?.[currencyId];
                const unrealizedCurrencyProfit = holding
                  ? currentCurrencyData.close * holding.units -
                    holding.avgCost * holding.units
                  : 0;

                return (
                  <div
                    key={currencyId}
                    className="border border-dashed border-white p-3 rounded"
                  >
                    <p className="text-white text-2xl font-jersey">
                      {currency.symbol}
                    </p>

                    {/* Mini Chart */}
                    <div className="w-full flex justify-center mb-2">
                      <div className="w-[85%] h-[70px]">
                      <MiniChart
                        data={currency?.data || []}
                        currentIndex={
                          currency?.data
                            ? displayTotalMonths % currency.data.length
                            : 0
                        }
                      />
                      </div>
                    </div>  

                    <div className="flex justify-between px-8">
                      <p className="text-white text-lg font-jersey">
                        {currentCurrencyData.close.toFixed(2)} $
                      </p>
                      <p
                        className={`text-lg font-jersey ${
                          currentCurrencyData.change >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {currentCurrencyData.change >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(currentCurrencyData.change).toFixed(2)}%
                      </p>
                    </div>

                    <p
                      className={`text-sm font-jersey ${
                        unrealizedCurrencyProfit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      Unrealized: {unrealizedCurrencyProfit.toFixed(2)} $
                    </p>
                    <p className="text-white text-md font-jersey">
                      Units: {holding?.units || 0}
                    </p>

                    {/* Amount buttons */}
                    <div className="flex justify-between px-16 mt-2 text-sm">
                      {["1", "10", "25", "MAX"].map((amt) => (
                        <button
                          key={amt}
                          onClick={() =>
                            setCurrencyAmounts({
                              ...currencyAmounts,
                              [currencyId]: amt,
                            })
                          }
                          className={`text-xl font-jersey transition-all duration-200 ${
                            currencyAmounts[currencyId] === amt
                              ? "text-[#afffaf] drop-shadow-[0_0_8px_#00FF00]"
                              : "text-white opacity-70 hover:opacity-100"
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-4 mt-3">
                      <button
                        onClick={() =>
                          handleCurrencyTransaction(
                            currencyId,
                            "sell",
                            currentCurrencyData.close
                          )
                        }
                        className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                      >
                        SELL
                      </button>
                      <button
                        onClick={() =>
                          handleCurrencyTransaction(
                            currencyId,
                            "buy",
                            currentCurrencyData.close
                          )
                        }
                        className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                      >
                        BUY
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
      {showEventModal && eventData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-10 text-center w-[500px]">
            <h2 className="text-5xl font-jersey mb-4 text-[#B7FD5E]">
              {eventData.title}
            </h2>

            <p className="text-3xl font-jersey text-white mb-6">
              {eventData.message}
            </p>

            <p
              className={`text-4xl font-jersey mb-6 ${
                eventData.amount >= 0 ? "text-[#B7FD5E]" : "text-red-500"
              }`}
            >
              {eventData.amount > 0
                ? `+${eventData.amount.toLocaleString()}$`
                : `${eventData.amount.toLocaleString()}$`}
            </p>

            {/* If it's a GAIN */}
            {eventData.amount >= 0 ? (
              <button
                onClick={async () => {
                  await applyEventEffect({ amount: eventData.amount });
                  setShowEventModal(false);
                }}
                className="bg-[#11942F] text-white text-3xl font-jersey px-8 py-2 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
              >
                Collect
              </button>
            ) : (
              /* If it's a LOSS */
              <div className="flex flex-col gap-4">
                {/* Pay with Pocket Cash - only show if user has enough */}
                {gameState.pocket >= Math.abs(eventData.amount) && (
                  <button
                    onClick={async () => {
                      await applyEventEffect({ amount: eventData.amount });
                      setShowEventModal(false);
                    }}
                    className="bg-[#11942F] text-white text-2xl font-jersey px-6 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                  >
                    Pay with Pocket Cash (
                    {Math.abs(eventData.amount).toLocaleString()}$)
                  </button>
                )}

                {/* Find Funds - enter debt mode without paying yet */}
                <button
                  onClick={() => {
                    setDebtAmount(Math.abs(eventData.amount));
                    setInDebtMode(true);
                    setShowEventModal(false);
                    // Don't apply the effect yet - user must pay later
                  }}
                  className="bg-red-600 text-white text-2xl font-jersey px-6 py-3 rounded hover:bg-red-700 transition-colors"
                >
                  Find Funds (Sell Assets)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Debt Mode Overlay */}
      {inDebtMode && (
        <>
          {/* Dark overlay on entire screen */}
          <div className="fixed inset-0 bg-black bg-opacity-20 pointer-events-none z-40"></div>

          {/* Compact debt indicator - expands on hover */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="relative group">
              {/* Compact view (default) - THIS is the hover trigger */}
              <div className="bg-red-500 border-4 border-red-400 rounded-lg px-6 py-3 shadow-2xl cursor-pointer pointer-events-auto">
                <p className="text-2xl font-jersey text-white text-center whitespace-nowrap">
                  Debt: {debtAmount.toLocaleString()}$
                </p>
              </div>

              {/* Expanded view (on hover) - positioned absolutely */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-500 border-4 border-red-400 rounded-lg p-6 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-[350px] pointer-events-auto">
                <p className="text-3xl font-jersey text-white text-center mb-1">
                  You owe: {debtAmount.toLocaleString()}$
                </p>
                <p className="text-2xl font-jersey text-white text-center mb-3">
                  Sell assets to raise funds
                </p>

                {/* Pay button */}
                <button
                  onClick={async () => {
                    if (gameState.pocket >= debtAmount) {
                      await applyEventEffect({ amount: -debtAmount });
                      setDebtAmount(0);
                      setInDebtMode(false);
                    }
                  }}
                  disabled={gameState.pocket < debtAmount}
                  className={`w-full text-2xl font-jersey px-6 py-3 rounded transition-colors ${
                    gameState.pocket >= debtAmount
                      ? "bg-[#941111] text-white hover:bg-[#fd5e5e] cursor-pointer"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  {gameState.pocket >= debtAmount
                    ? `Pay Debt (${debtAmount.toLocaleString()}$)`
                    : `Need ${(
                        debtAmount - gameState.pocket
                      ).toLocaleString()}$ more`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
