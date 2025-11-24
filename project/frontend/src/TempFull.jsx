import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import index from "./assets/Index.png";
import gold from "./assets/Gold.png";

const API_BASE_URL = "http://localhost:8080/api/invest";

//Import all index fund data files
const indexFiles = import.meta.glob("./data/IndexFund/*.json", { eager: true });

// Import all stock data files
const stockFiles = import.meta.glob("./data/Stocks/*.json", { eager: true });

// Import all gold data files
const goldFiles = import.meta.glob("./data/Gold/*.json", { eager: true });

//Import all currency data files
const currencyFiles = import.meta.glob("./data/Currencies/*.json", {
  eager: true,
});

// Function to randomly select 4 stocks
const getRandomStocks = () => {
  const allStocks = Object.entries(stockFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));

  // Shuffle and pick 4
  const shuffled = allStocks.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
};

// Function to randomly select 1 index fund
const getRandomIndex = () => {
  const allIndexes = Object.entries(indexFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));

  // Pick a random one
  const randomIndex = Math.floor(Math.random() * allIndexes.length);
  return allIndexes[randomIndex];
};

// Function to randomly select 1 gold asset
const getRandomGold = () => {
  const allGold = Object.entries(goldFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));

  // Pick a random one
  const randomIndex = Math.floor(Math.random() * allGold.length);
  return allGold[randomIndex];
};

// Function to randomly select 3 currencies
const getRandomCurrency = () => {
  const allCurrencies = Object.entries(currencyFiles).map(([path, module]) => ({
    symbol: path.split("/").pop().replace(".json", ""),
    data: module.default || module,
  }));

  // Shuffle and pick 3
  const shuffled = allCurrencies.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

export default function Invest() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  // Bonds
  const [activeInput, setActiveInput] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedBond, setSelectedBond] = useState("");

  // Index fund state
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [indexValue, setIndexValue] = useState(0);

  // Stock-related state
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [stockAmounts, setStockAmounts] = useState({});
  const [activeStockInput, setActiveStockInput] = useState(null);

  // Gold state
  const [selectedGold, setSelectedGold] = useState(null);
  const [goldValue, setGoldValue] = useState(0);

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState([]);
  const [currencyAmounts, setCurrencyAmounts] = useState({});
  const [activeCurrencyInput, setActiveCurrencyInput] = useState(null);

  // Event popup state
  const [eventData, setEventData] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState(0); // Track unpaid debt
  const [inDebtMode, setInDebtMode] = useState(false); // Track if user is finding funds
  const randomEvents = [
    {
      title: "You Found a Lucky Scratch Card!",
      message: "You won 200$!",
      amount: 200,
    },
    {
      title: "Unexpected Car Repair",
      message: "You had to pay 150$.",
      amount: -150,
    },
    {
      title: "Sold Old Items Online",
      message: "You earned 120$ from selling unused items.",
      amount: 120,
    },
    {
      title: "Lost Your Wallet",
      message: "You lost 80$.",
      amount: -80,
    },
    {
      title: "Gift From a Friend",
      message: "Your friend sent you 300$!",
      amount: 300,
    },
  ];

  function getRandomEvent() {
    return randomEvents[Math.floor(Math.random() * randomEvents.length)];
  }

  const timerRef = useRef(null);

  // Initialize random stocks, index, gold, and currencies on mount
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

  // Initialize game session
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

  // Handle transactions
  const handleTransaction = async (
    action,
    transactionAmount,
    bondType = null
  ) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action,
          amount: transactionAmount,
          bondType,
          indexValue,
          goldValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      setGameState(data.gameState);
      setAmount("");
      setActiveInput(null);
      setSelectedBond("");
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed");
    }
  };

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    if (activeInput === "bond-select") {
      if (!selectedBond) {
        alert("Please select a bond duration!");
        return;
      }
      handleTransaction("bond-buy", value, selectedBond);
    } else if (activeInput) {
      handleTransaction(activeInput, value);
    }
  };

  const toggleInput = (type) => {
    setActiveInput((prev) => (prev === type ? null : type));
    setSelectedBond("");
    setAmount("");
  };

  const handleStockTransaction = async (symbol, action, price) => {
    const amountStr = stockAmounts[symbol] || "1";
    let amount = 0;

    // Determine number of shares to buy or sell
    const holding = gameState.holdings?.stocks?.[symbol];

    if (amountStr === "MAX") {
      amount =
        action === "buy"
          ? Math.floor(gameState.pocket / price) // buy as many as possible
          : holding?.shares || 0; // sell all owned shares
    } else {
      amount = parseInt(amountStr);
    }

    if (amount <= 0 || isNaN(amount)) {
      alert("Please enter a valid share amount.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stock-${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          symbol,
          amount,
          price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Transaction failed");
        return;
      }

      console.log(`${action.toUpperCase()} Success:`, data.message);

      // Update frontend game state
      if (data.updatedGameState) {
        setGameState(data.updatedGameState);
      } else if (data.gameState) {
        setGameState(data.gameState);
      }

      setActiveStockInput(null);
    } catch (error) {
      console.error("Stock transaction error:", error);
      alert("Failed to process stock transaction.");
    }
  };

  // Handle currency transactions (similar to stocks)
  const handleCurrencyTransaction = async (symbol, action, price) => {
    const amountStr = currencyAmounts[symbol] || "1";
    let amount = 0;

    // Determine number of units to buy or sell
    const holding = gameState.holdings?.currencies?.[symbol];

    if (amountStr === "MAX") {
      amount =
        action === "buy"
          ? Math.floor(gameState.pocket / price) // buy as many as possible
          : holding?.units || 0; // sell all owned units
    } else {
      amount = parseInt(amountStr);
    }

    if (amount <= 0 || isNaN(amount)) {
      alert("Please enter a valid currency amount.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/currency-${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          symbol,
          amount,
          price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Transaction failed");
        return;
      }

      console.log(`Currency ${action.toUpperCase()} Success:`, data.message);

      // Update frontend game state
      if (data.updatedGameState) {
        setGameState(data.updatedGameState);
      } else if (data.gameState) {
        setGameState(data.gameState);
      }

      setActiveCurrencyInput(null);
    } catch (error) {
      console.error("Currency transaction error:", error);
      alert("Failed to process currency transaction.");
    }
  };

  const applyEventEffect = async (effect) => {
    const res = await fetch(`${API_BASE_URL}/apply-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        effect,
      }),
    });

    const data = await res.json();

    if (data.updatedGameState) {
      setGameState(data.updatedGameState);
    } else if (data.gameState) {
      setGameState(data.gameState);
    }
  };

  const checkDebtPayment = async () => {
    if (inDebtMode && gameState.pocket >= debtAmount) {
      // User has enough money to pay debt
      const confirmPay = window.confirm(
        `You now have enough to pay your debt of ${debtAmount.toLocaleString()}$. Pay now?`
      );

      if (confirmPay) {
        await applyEventEffect({ amount: -debtAmount });
        setDebtAmount(0);
        setInDebtMode(false);
      }
    }
  };

  // Main year timer
  useEffect(() => {
    if (!isRunning || !gameState) return;
    if (timerRef.current) return;

    const duration = 60000;
    const steps = 100;
    const interval = duration / steps;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Year complete
          fetch(`${API_BASE_URL}/year-increment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.gameComplete) {
                setIsRunning(false);
                // Navigate to dashboard when game is complete (20 years finished)
                setTimeout(() => {
                  navigate("/dashboard", {
                    state: {
                      finalGameState: data.gameState,
                      gameComplete: true,
                    },
                  });
                }, 1000); // Small delay to show completion
              }
              setGameState(data.gameState);
            })
            .catch((error) => {
              console.error("Year increment failed:", error);
            });

          setProgress(0);
          setCurrentMonth(0);
          return 0;
        }

        const newProgress = prev + 1;
        setCurrentMonth(newProgress / 8.33);
        return newProgress;
      });
    }, interval);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning, sessionId, gameState, navigate]);

  // Monthly updates (stocks, index, bond, AND gold)
  useEffect(() => {
    if (!sessionId || !gameState || !selectedIndex || !selectedGold) return;

    const month = Math.floor(currentMonth);

    // Only trigger when the next month starts and hasn't been processed yet
    if (month >= 1 && month <= 12 && month > gameState.lastProcessedMonth) {
      // Chance to trigger event (20%)
      if (Math.random() < 0.2) {
        const event = getRandomEvent();
        setEventData(event);
        setShowEventModal(true);
      }

      const monthIndex = (month - 1) % selectedIndex.data.length;
      const currentIndexData = selectedIndex.data[monthIndex];
      setIndexValue(currentIndexData.close);

      // Update gold value
      const goldMonthIndex = (month - 1) % selectedGold.data.length;
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

          // Bond Update
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
            body: JSON.stringify({
              sessionId,
              goldData: currentGoldData,
            }),
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

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-[#011D10] flex items-center justify-center">
        <p className="text-white text-4xl font-jersey">Loading...</p>
      </div>
    );
  }

  const handleBondSell = async (inv) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bond-sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          bondId: inv.id,
        }),
      });

      const data = await res.json();

      if (data?.gameState) {
        setGameState(data.gameState);
        console.log(`Bond ${inv.id} sold successfully!`);
      } else {
        console.warn("Bond sell response missing gameState:", data);
      }
    } catch (error) {
      console.error("Error selling bond:", error);
    }
  };

  const handleExitConfirm = () => {
    navigate("/");
  };

  // Calculate unrealized profit/loss
  const currentIndexValue = gameState.indexShares * indexValue;
  const indexUnrealizedProfit =
    gameState.fundBalance - gameState.holdings.index;

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
          <div className="flex justify-center">
            <img src={index} alt="index icon" className="w-[90px] h-[90px]" />
          </div>
          <div className="flex justify-center gap-3">
            <p className="text-white text-xl font-jersey">
              Price: {indexValue.toFixed(2)}
            </p>
            <div
              className={`text-xl font-jersey ${
                selectedIndex?.data[
                  Math.max(0, Math.floor(currentMonth) - 1) %
                    selectedIndex.data.length
                ]?.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {selectedIndex?.data[
                Math.max(0, Math.floor(currentMonth) - 1) %
                  selectedIndex.data.length
              ]?.change >= 0
                ? "▲"
                : "▼"}{" "}
              {Math.abs(
                selectedIndex?.data[
                  Math.max(0, Math.floor(currentMonth) - 1) %
                    selectedIndex.data.length
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
                const monthIndex = Math.floor(currentMonth) % stock.data.length;
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
          <div className="flex justify-center">
            <img src={gold} alt="gold icon" className="w-[90px] h-[90px]" />
          </div>
          <div className="flex justify-center gap-3">
            <p className="text-white text-xl font-jersey">
              Price: {goldValue.toFixed(2)}
            </p>
            <p
              className={`text-lg font-jersey ${
                selectedGold?.data[
                  Math.max(0, Math.floor(currentMonth) - 1) %
                    selectedGold.data.length
                ]?.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {selectedGold?.data[
                Math.max(0, Math.floor(currentMonth) - 1) %
                  selectedGold.data.length
              ]?.change >= 0
                ? "▲"
                : "▼"}{" "}
              {Math.abs(
                selectedGold?.data[
                  Math.max(0, Math.floor(currentMonth) - 1) %
                    selectedGold.data.length
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
                const monthIndex =
                  Math.floor(currentMonth) % currency.data.length;
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
          <div className="fixed inset-0 bg-black bg-opacity-40 pointer-events-none z-40"></div>

          {/* Compact debt indicator - expands on hover */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="relative group">
              {/* Compact view (default) - THIS is the hover trigger */}
              <div className="bg-red-600 border-4 border-red-800 rounded-lg px-6 py-3 shadow-2xl cursor-pointer pointer-events-auto">
                <p className="text-2xl font-jersey text-white text-center whitespace-nowrap">
                  ⚠️ Debt: {debtAmount.toLocaleString()}$
                </p>
              </div>

              {/* Expanded view (on hover) - positioned absolutely */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-600 border-4 border-red-800 rounded-lg p-6 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-[350px] pointer-events-auto">
                <p className="text-3xl font-jersey text-white text-center mb-2">
                  ⚠️ DEBT MODE ⚠️
                </p>
                <p className="text-2xl font-jersey text-white text-center mb-1">
                  You owe: {debtAmount.toLocaleString()}$
                </p>
                <p className="text-lg font-jersey text-gray-300 text-center mb-3">
                  Sell assets to raise funds
                </p>

                {/* Progress bar */}
                <div className="w-full bg-red-900 rounded-full h-3 mb-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (gameState.pocket / debtAmount) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>

                {/* Current pocket balance */}
                <p className="text-lg font-jersey text-white text-center mb-4">
                  Pocket: {gameState.pocket.toLocaleString()}$ /{" "}
                  {debtAmount.toLocaleString()}$
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
                  className={`w-full text-xl font-jersey px-6 py-3 rounded transition-colors ${
                    gameState.pocket >= debtAmount
                      ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
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
