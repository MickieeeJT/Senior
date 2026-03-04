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
const currencyFiles = import.meta.glob("./data/Currencies/*.json", {
  eager: true,
});

// --- HELPER FUNCTIONS ---
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
  
  // Tutorial progress state
  const [tutorialLevel, setTutorialLevel] = useState(0);
  const [unlockedSections, setUnlockedSections] = useState([]);

  const [progress, setProgress] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [isRunning, setIsRunning] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isProcessingYear, setIsProcessingYear] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1); // Add game speed state

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
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState(null);
  const randomEvents = randomEvent;
  const timerRef = useRef(null);
  const processingRef = useRef(null);

  // Refs
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
  }, [
    gameState,
    selectedStocks,
    selectedCurrency,
    currentMonth,
    selectedIndex,
  ]);

  // Load tutorial progress from database on mount
  useEffect(() => {
    const fetchTutorialProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/tutorial-progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setTutorialLevel(data.tutorialLevel);
          setUnlockedSections(data.unlockedSections);
        }
      } catch (error) {
        console.error("Failed to fetch tutorial progress:", error);
        // Default to no unlocks on error
        setTutorialLevel(0);
        setUnlockedSections([]);
      }
    };

    fetchTutorialProgress();
  }, []);

  // Check if a section is unlocked
  const isSectionUnlocked = (sectionName) => {
    return unlockedSections.includes(sectionName);
  };

  // Calculate Total Assets for UI
  useEffect(() => {
    if (!gameState) return;
    const displayTotalMonths =
      (gameState.currentYear - 1) * 12 +
      Math.max(0, Math.floor(currentMonth) - 1);
    let total =
      gameState.pocket +
      gameState.savingsBalance +
      (gameState.holdings.bonds || 0) +
      gameState.fundBalance +
      gameState.goldBalance;

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
    const displayTotalMonths =
      (gs.currentYear - 1) * 12 + Math.floor(currentMonthRef.current) - 1;
    let total =
      gs.pocket +
      gs.savingsBalance +
      (gs.holdings.bonds || 0) +
      gs.fundBalance +
      gs.goldBalance;

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
    const totalMonthsPassed = Math.max(
      0,
      (gs.currentYear - 1) * 12 + Math.floor(currentMonthRef.current) - 1
    );

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: gs.sessionId,
          finalStockPrices,
          finalCurrencyPrices,
          botIndexHistory,
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
          newAchievements: data.newAchievements,
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

  const initGame = async (forceNew = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/init`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ forceNew })
      });
      
      if (response.status === 401) {
          alert("Please login first");
          navigate("/login");
          return;
      }

      const data = await response.json();
      
      if (data.sessionId) {
          setSessionId(data.sessionId);
          setGameState(data.gameState);
          
          // Resume Logic: Restore Month and Progress
          if (data.gameState.currentMonth > 1) {
              const restoredProgress = data.gameState.currentProgress || ((data.gameState.currentMonth - 1) / 12) * 100 + 0.1;

              setCurrentMonth(data.gameState.currentMonth);
              setProgress(restoredProgress);
          } else {
              // New year or new game start
              setCurrentMonth(1);
              setProgress(0);
          }
      }
      
      setLoading(false);
      setShowResumeModal(false);
    } catch (error) {
      console.error("Failed to initialize game:", error);
      alert("Failed to start game");
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
           navigate("/login");
           return;
        }

        const res = await fetch(`${API_BASE_URL}/check-session`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.hasSession) {
          setResumeSessionData(data);
          setShowResumeModal(true);
          setLoading(false); 
        } else {
          initGame(false);
        }
      } catch (err) {
        console.error("Session check failed", err);
        initGame(false);
      }
    };
    checkSession();
  }, []);

  // --- MAIN GAME TIMER ---
  useEffect(() => {
    if (!isRunning || !gameState || isProcessingYear) return;
    if (timerRef.current) return;

    // Clear any existing timer to restart with new speed
    clearInterval(timerRef.current);

    const duration = 60000; // 1 real minute per game year at 1x speed
    const steps = 100;
    const baseInterval = duration / steps;
    const interval = baseInterval / gameSpeed; // Adjust interval by speed

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
                      state: {
                        finalGameState: data.gameState,
                        gameComplete: true,
                        scoreData: saved,
                      },
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
        
        // --- CHANGED LOGIC START ---
        // Increment progress
        const newProgress = prev + (100 / steps); // Ensure increment matches total duration steps
        
        // Calculate month based on 0-100 scale:
        // 0-8.33 -> Month 1
        // 8.33-16.66 -> Month 2
        // ...
        const rawMonth = (newProgress / 100) * 12;
        const newMonth = Math.floor(rawMonth) + 1;
        
        setCurrentMonth(Math.min(12, newMonth)); // Clamp to 12
        return newProgress;
        // --- CHANGED LOGIC END ---
      });
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, sessionId, isProcessingYear, navigate, gameState, gameSpeed]); // Add gameSpeed to dependencies

  // --- MONTHLY UPDATE EFFECT ---
  useEffect(() => {
    if (!sessionId || !gameState || !selectedIndex || !selectedGold) return;
    const month = Math.floor(currentMonth);

    if (month >= 1 && month <= 12 && month > gameState.lastProcessedMonth) {
      const updateKey = `${gameState.currentYear}-${month}`;
      if (processingRef.current === updateKey) return;
      processingRef.current = updateKey;

      if (Math.random() < 0.05) {
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
        .then((res) => {
          if (!res.ok) throw new Error("Monthly update failed");
          return res.json();
        })
        .then((data) => {
          if (data.gameState) setGameState(data.gameState);
          return fetch(`${API_BASE_URL}/bond-update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        })
        .then((res) => {
          if (!res || !res.ok) {
             console.warn("Bond update skipped or failed");
             return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data?.gameState) setGameState(data.gameState);
          return fetch(`${API_BASE_URL}/gold-update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, goldData: currentGoldData }),
          });
        })
        .then((res) => {
          if (!res || !res.ok) {
             console.warn("Gold update skipped or failed");
             return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data?.gameState) setGameState(data.gameState);
        })
        .catch((error) => {
          console.error("Monthly, bond, or gold update failed:", error);
          if (error.message.includes("Monthly update failed") && !loading) {
              // verify if session is still valid
              fetch(`${API_BASE_URL}/state/${sessionId}`)
              .then(res => {
                  if (res.status === 404) {
                      alert("Session expired. Please start a new game.");
                      navigate("/dashboard");
                  }
              });
          }
        });
    }
  }, [currentMonth, sessionId, gameState, selectedIndex, selectedGold]);

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
      if (data.updatedGameState) {
          setGameState(data.updatedGameState);
      } else if (data.gameState) {
          setGameState(data.gameState);
      }
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

  const toggleInput = (type, e) => {
    if (e) e.stopPropagation();
    setActiveInput((prev) => (prev === type ? null : type));
    setSelectedBond("");
    setAmount("");
  };

  const handleBackgroundClick = () => {
    if (activeInput) {
      setActiveInput(null);
      setAmount("");
      setSelectedBond("");
    }
  };

  const preventClose = (e) => {
    e.stopPropagation();
  };

  const handleStockTransaction = async (symbol, action, price) => {
    const amountStr = stockAmounts[symbol] || "1";
    let amount = 0;
    const holding = gameState.holdings?.stocks?.[symbol];
    if (amountStr === "MAX") {
      amount =
        action === "buy"
          ? Math.floor(gameState.pocket / price)
          : holding?.shares || 0;
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
        body: JSON.stringify({ sessionId, symbol, amount, price }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Transaction failed");
        return;
      }
      if (data.updatedGameState) setGameState(data.updatedGameState);
      else if (data.gameState) setGameState(data.gameState);
      
      setActiveStockInput(null);
    } catch (error) {
      console.error("Stock transaction error:", error);
      alert("Failed to process stock transaction.");
    }
  };

  const handleCurrencyTransaction = async (symbol, action, price) => {
    const amountStr = currencyAmounts[symbol] || "1";
    let amount = 0;
    const holding = gameState.holdings?.currencies?.[symbol];
    if (amountStr === "MAX") {
      amount =
        action === "buy"
          ? Math.floor(gameState.pocket / price)
          : holding?.units || 0;
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
        body: JSON.stringify({ sessionId, symbol, amount, price }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Transaction failed");
        return;
      }
      if (data.updatedGameState) setGameState(data.updatedGameState);
      else if (data.gameState) setGameState(data.gameState);
      
      setActiveCurrencyInput(null);
    } catch (error) {
      console.error("Currency transaction error:", error);
      alert("Failed to process currency transaction.");
    }
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
    } catch (error) {
      console.error("Error selling bond:", error);
    }
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

  const handleExitConfirm = () => {
    navigate("/home");
  };

  if (showResumeModal && resumeSessionData && resumeSessionData.preview) {
      const { currentYear, currentMonth, pocket, totalAssets } = resumeSessionData.preview;
      
      const modalButtonStyle = "group relative inline-flex h-12 w-64 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-transparent px-4 font-poiret font-bold text-xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none mb-3";

      return (
        <div className="h-screen w-screen bg-[#011D10] flex items-center justify-center font-poiret">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-10 text-center max-w-xl w-full shadow-[0_0_50px_rgba(0,255,0,0.2)]">
            <h2 className="text-4xl font-bold text-[#B7FD5E] mb-8 tracking-widest uppercase">Resume Game?</h2>
            
            <div className="bg-[#022c19] border-2 border-[#11942F] p-6 rounded mb-8 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-[#11942F] pb-2">
                    <span className="text-white text-xl">Year / Month</span>
                    <span className="text-[#B7FD5E] font-bold text-2xl">{currentYear} / {Math.floor(currentMonth)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#11942F] py-2">
                     <span className="text-white text-xl">Pocket Cash</span>
                     <span className="text-[#B7FD5E] font-bold text-2xl">{pocket?.toLocaleString(undefined, { maximumFractionDigits: 0 })} $</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                     <span className="text-white text-xl">Total Assets</span>
                     <span className="text-[#B7FD5E] font-bold text-2xl">{totalAssets?.toLocaleString(undefined, { maximumFractionDigits: 0 })} $</span>
                </div>
            </div>

            <div className="flex flex-col items-center w-full">
                <button 
                    onClick={() => initGame(false)} 
                    className={`${modalButtonStyle} bg-[#003300] hover:bg-[#004400]`}
                >
                    CONTINUE GAME
                </button>
                
                <button 
                    onClick={() => {
                        if(window.confirm("Are you sure? Current progress will be lost.")) {
                            initGame(true);
                        }
                    }} 
                    className={`${modalButtonStyle} border-red-700 text-red-500 shadow-none hover:shadow-none hover:text-red-400 hover:border-red-500`}
                    style={{boxShadow: 'none'}}
                >
                    START NEW GAME
                </button>
            </div>
          </div>
        </div>
      );
  }

  if (loading || !gameState) {
    return (
      <div className="h-screen w-screen bg-[#011D10] flex items-center justify-center">
        <p className="text-white text-2xl font-poiret font-bold">Loading...</p>
      </div>
    );
  }

  const currentIndexValue = gameState.indexShares * indexValue;
  const indexUnrealizedProfit =
    gameState.fundBalance - gameState.holdings.index;
  const displayTotalMonths =
    (gameState.currentYear - 1) * 12 +
    Math.max(0, Math.floor(currentMonth) - 1);

  const buttonStyle =
    "group relative inline-flex h-10 w-24 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-transparent px-3 font-poiret font-bold text-sm tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_4px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#005500] active:translate-y-[2px] active:shadow-none";
  const InputStyle =
    "group relative inline-flex h-10 w-32 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-white px-3 font-poiret font-bold text-sm tracking-wide text-black";

  // Locked Overlay Component
  const LockedOverlay = ({ sectionName }) => (
    <div className="absolute inset-0 bg-black bg-opacity-80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
      <div className="text-center">
        <div className="text-6xl mb-3">🔒</div>
        <p className="text-white text-xl font-poiret font-bold mb-2">
          {sectionName} Locked
        </p>
        <p className="text-gray-300 text-sm font-poiret">
          Complete Tutorial Level {
            sectionName === 'SAVING ACCOUNT' ? '1' :
            sectionName === 'GOVERNMENT BONDS' ? '2' :
            sectionName === 'INDEX FUND' ? '3' :
            sectionName === 'INDIVIDUAL STOCKS' ? '4' :
            sectionName === 'GOLD' ? '5' :
            sectionName === 'CURRENCY EXCHANGE' ? '6' : '?'
          } to unlock
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="h-screen w-screen bg-[#011D10] text-[#494a48] font-poiret flex flex-col overflow-hidden"
      onClick={handleBackgroundClick}
    >
      <div className="h-screen w-screen flex flex-col font-poiret text-[#494a48]">
        {/* HEADER - Fixed height */}
        <header className="flex justify-between items-end border-b-4 border-[#ffffff] mb-3 px-4 pb-1">
        {/* LEFT SIDE: Group Title and Stats together */}
        <div className="flex items-end gap-10">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Stop propagation here too
              setShowExitModal(true);
            }}
            className="text-[#B7FD5E] text-5xl hover:text-white transition font-poiret font-bold leading-none"
          >
            Investment Game
          </button>

          {/* Stats Container */}
          <div className="flex items-end gap-6 pb-1">
            <div className="flex items-baseline pr-8">
              <h2 className="text-2xl font-poiret font-bold text-white mr-3">
                Pocket Money :
              </h2>
              <p className="text-2xl font-poiret text-[#B7FD5E]">
                {gameState.pocket.toLocaleString()} $
              </p>
            </div>
            <div className="flex items-baseline">
              <h2 className="text-2xl font-poiret font-bold text-white mr-3">
                Total Asset :
              </h2>
              <p className="text-2xl font-poiret text-[#B7FD5E]">
                {totalAssets.toLocaleString()} $
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Progress Bar */}
        <div className="self-center mb-1 pt-1 w-1/4">
          <p className="text-xl font-poiret font-bold text-white mb-1 text-center">
            YEAR {gameState.currentYear} OF 20
          </p>

          <div className="relative h-4 w-full mb-1 bg-white border border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] overflow-hidden">
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
          
          {/* Speed Controls */}
          <div className="flex justify-center gap-2 mt-2">
            {[1, 2, 3, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setGameSpeed(speed)}
                className={`
                  w-8 h-6 flex items-center justify-center font-bold text-sm tracking-wide transition-all duration-150 rounded-sm border-2
                  ${gameSpeed === speed 
                    ? "bg-[#B7FD5E] text-black border-[#B7FD5E] shadow-[0_0_8px_#B7FD5E]" 
                    : "bg-transparent text-[#33ff33] border-[#11942F] hover:bg-[#003300]"}
                `}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </header>

        {/* MAIN CONTENT - Flexible height */}
        <div className="flex-1 overflow-hidden px-4 py-2">
          <div className="h-full grid grid-cols-3 grid-rows-3 gap-2">
            {/* ROW 1: Savings, Bonds, Index */}
            {/* Savings Account */}
            <div className="col-span-1 row-span-1 p-2 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col justify-between h-full relative">
              {!isSectionUnlocked('savings') && <LockedOverlay sectionName="SAVING ACCOUNT" />}
              <div>
                <h3 className="text-xl font-poiret font-bold mb-1 text-white">
                  SAVING ACCOUNT
                </h3>
                <div className="flex justify-center">
                  <img
                    src={saving}
                    alt="saving icon"
                    className="w-20 h-20"
                  />
                </div>
                <div className="flex justify-between px-4 mt-1">
                  <p className="text-white text-base font-poiret font-bold">
                    Balance: {gameState.savingsBalance.toFixed(2)} $
                  </p>
                  <p className="text-white text-base font-poiret font-bold">
                    Profit: {gameState.profit.savings.toFixed(2)} $
                  </p>
                </div>
              </div>
              <div className="pb-1">
                {!activeInput?.includes("savings") && (
                  <div className="flex justify-center gap-2 mt-1">
                    <button
                      onClick={(e) => toggleInput("savings-withdraw", e)}
                      className={buttonStyle}
                    >
                      WITHDRAW
                    </button>
                    <button
                      onClick={(e) => toggleInput("savings-deposit", e)}
                      className={buttonStyle}
                    >
                      DEPOSIT
                    </button>
                  </div>
                )}
                {activeInput?.includes("savings") && (
                  <div
                    onClick={preventClose}
                    className="mt-1 flex justify-center items-center gap-2"
                  >
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={InputStyle}
                    />
                    <button onClick={handleSubmit} className={buttonStyle}>
                      {activeInput === "savings-deposit" ? "DEPOSIT" : "WITHDRAW"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Government Bonds */}
            <div className="col-span-1 row-span-1 p-2 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col justify-between overflow-hidden h-full relative">
              {!isSectionUnlocked('bonds') && <LockedOverlay sectionName="GOVERNMENT BONDS" />}
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-xl font-poiret font-bold mb-1 text-white">
                  GOVERNMENT BONDS
                </h3>
                <div className="flex justify-center mb-1">
                  <p className="text-white text-base font-poiret font-bold">
                    Profit: {gameState.profit.bonds.toFixed(2)} $
                  </p>
                </div>

                {activeInput !== "bond-select" &&
                  gameState.bondInvestments.length > 0 && (
                    <div className="mt-1 flex justify-center gap-2 flex-wrap">
                      {gameState.bondInvestments.map((inv) => {
                        const progress =
                          ((inv.duration - inv.remaining) / inv.duration) * 100;

                        return (
                          <div
                            key={inv.id}
                            className="flex flex-col items-center mb-1"
                          >
                            <div className="relative w-12 h-12">
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
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-base font-poiret text-white">
                                <div className="text-sm font-poiret font-bold text-white">
                                  ${inv.amount.toFixed(0)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBondSell(inv);
                              }}
                              className="mt-1 text-white text-base font-poiret font-bold hover:underline"
                            >
                              Collect
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>

              <div className="pb-1">
                {!activeInput?.includes("bond") && (
                  <button
                    onClick={(e) => {
                      if (gameState.bondInvestments.length >= 3) {
                        alert("Maximum 3 active bonds allowed!");
                        e.stopPropagation();
                        return;
                      }
                      toggleInput("bond-select", e);
                    }}
                    className={`${buttonStyle} ${
                      gameState.bondInvestments.length >= 3
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    BUY
                  </button>
                )}

                {activeInput === "bond-select" && (
                  <div
                    onClick={preventClose}
                    className="mt-1 flex flex-col items-center space-y-2"
                  >
                    <div className="flex justify-center gap-2">
                      {["1 year", "5 years", "10 years"].map((t) => {
                        const rate = gameState.bondInterestRates[t];
                        const ratePercent = (rate * 100).toFixed(1);

                        return (
                          <div
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBond(t);
                            }}
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <div
                              className={`font-bold rounded-full w-10 h-10 flex items-center justify-center transition-all text-base ${
                                selectedBond === t
                                  ? "bg-[#B7FD5E] text-black scale-105 shadow-[0_0_10px_#00FF00]"
                                  : "bg-gray-100 text-black hover:bg-gray-300"
                              }`}
                            >
                              {t.split(" ")[0]}
                            </div>
                            <div className="text-base font-poiret font-bold text-[#B7FD5E] mt-1">
                              {ratePercent}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={InputStyle}
                      />
                      <button onClick={handleSubmit} className={buttonStyle}>
                        BUY
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Index Fund */}
            <div className="col-span-1 row-span-1 p-2 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col justify-between h-full relative">
              {!isSectionUnlocked('index') && <LockedOverlay sectionName="INDEX FUND" />}
              <div>
                <h3 className="text-xl font-poiret font-bold mb-1 text-white">
                  INDEX - {selectedIndex?.symbol || "Loading..."}
                </h3>

                {/* Mini Chart */}
                <div className="w-full flex justify-center mb-1">
                  <div className="w-[85%] h-12">
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

                <div className="flex justify-between px-4 mt-1">
                  <p className="text-white text-sm font-poiret font-bold">
                    {indexValue.toFixed(2)}
                  </p>
                  <div
                    className={`text-sm font-poiret font-bold ${
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
                    ).toFixed(2)}%
                  </div>
                </div>
                <div className="flex justify-between px-4 mt-1">
                  <p className="text-white text-base font-poiret font-bold">
                    Balance: {gameState.fundBalance.toFixed(2)} $
                  </p>
                  <p
                    className={`text-base font-poiret font-bold ${
                      indexUnrealizedProfit >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    Unrealized: {indexUnrealizedProfit.toFixed(2)} $
                  </p>
                </div>
              </div>

              <div className="pb-1">
                {!activeInput?.includes("index") && (
                  <div className="flex justify-center gap-2 mt-1">
                    <button
                      onClick={(e) => toggleInput("index-sell", e)}
                      className={buttonStyle}
                    >
                      SELL
                    </button>
                    <button
                      onClick={(e) => toggleInput("index-buy", e)}
                      className={buttonStyle}
                    >
                      BUY
                    </button>
                  </div>
                )}

                {activeInput?.includes("index") && (
                  <div
                    onClick={preventClose}
                    className="mt-1 flex justify-center items-center gap-2"
                  >
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={InputStyle}
                    />
                    <button onClick={handleSubmit} className={buttonStyle}>
                      {activeInput === "index-buy" ? "BUY" : "SELL"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: Individual Stocks (spanning 3 columns) */}
            <div className="col-span-3 row-span-1 p-2 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col h-full relative">
              {!isSectionUnlocked('stocks') && <LockedOverlay sectionName="INDIVIDUAL STOCKS" />}
              <h3 className="text-center text-xl font-poiret font-bold text-white mb-1 flex-shrink-0">
                INDIVIDUAL STOCKS
              </h3>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-4 gap-2">
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
                        className="border-r border-dashed border-white last:border-r-0 px-2 pt-2 flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-white text-base font-poiret font-bold">
                            {stock.symbol}
                          </p>

                          {/* Mini Chart */}
                          <div className="w-full flex justify-center mb-1">
                            <div className="w-[85%] h-10">
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

                          <div className="flex justify-between px-2">
                            <p className="text-white text-sm font-poiret font-bold">
                              {currentStockData.close.toFixed(2)} $
                            </p>
                            <p
                              className={`text-sm font-poiret font-bold ${
                                currentStockData.change >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {currentStockData.change >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(currentStockData.change).toFixed(2)}%
                            </p>
                          </div>

                          <div className="flex justify-between px-2 mt-1">
                            <p
                              className={`text-base font-poiret font-bold ${
                                unrealizedStockProfit >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              Unreal: {unrealizedStockProfit.toFixed(0)} $
                            </p>
                            <p className="text-white text-base font-poiret font-bold">
                              Shares: {holding?.shares || 0}
                            </p>
                          </div>
                        </div>

                        <div className="pb-1">
                          {/* Amount buttons */}
                          <div className="flex justify-between px-4 mt-1 text-base">
                            {["1", "10", "25", "MAX"].map((amt) => (
                              <button
                                key={amt}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStockAmounts({
                                    ...stockAmounts,
                                    [stockId]: amt,
                                  });
                                }}
                                className={`text-sm font-poiret font-bold transition-all duration-200 ${
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
                          <div className="flex justify-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStockTransaction(
                                  stockId,
                                  "sell",
                                  currentStockData.close
                                );
                              }}
                              className={buttonStyle}
                            >
                              SELL
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStockTransaction(
                                  stockId,
                                  "buy",
                                  currentStockData.close
                                );
                              }}
                              className={buttonStyle}
                            >
                              BUY
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ROW 3: Gold and Currency */}
            {/* Gold */}
            <div
              className="col-span-1 row-span-1 p-2 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col h-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {!isSectionUnlocked('gold') && <LockedOverlay sectionName="GOLD" />}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-poiret font-bold mb-1 text-white">
                    GOLD - {selectedGold?.symbol || "Loading..."}
                  </h3>

                {/* Mini Chart */}
                <div className="w-full flex justify-center mb-1">
                  <div className="w-[85%] h-12">
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

                <div className="flex justify-between px-4 mt-1">
                  <p className="text-white text-sm font-poiret font-bold">
                    {goldValue.toFixed(2)}
                  </p>
                  <p
                    className={`text-sm font-poiret font-bold ${
                      selectedGold?.data[
                        displayTotalMonths % selectedGold.data.length
                      ]?.change >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {selectedGold?.data[
                      displayTotalMonths % selectedGold.data.length
                    ]?.change >= 0
                      ? "▲"
                      : "▼"}{" "}
                    {Math.abs(
                      selectedGold?.data[
                        displayTotalMonths % selectedGold.data.length
                      ]?.change || 0
                    ).toFixed(2)}%
                  </p>
                </div>
                <div className="flex justify-between px-4 mt-1">
                  <p className="text-white text-base font-poiret font-bold">
                    Balance: {gameState.goldBalance?.toFixed(2) || 0} $
                  </p>
                  <p className="text-white text-base font-poiret font-bold">
                    Profit: {gameState.profit?.gold?.toFixed(2) || 0} $
                  </p>
                </div>
              </div>
              </div>
              <div className="pb-1 flex-shrink-0">
                {!activeInput?.includes("gold") && (
                  <div className="flex justify-center gap-2 mt-1">
                    <button
                      onClick={(e) => toggleInput("gold-sell", e)}
                      className={buttonStyle}
                    >
                      SELL
                    </button>
                    <button
                      onClick={(e) => toggleInput("gold-buy", e)}
                      className={buttonStyle}
                    >
                      BUY
                    </button>
                  </div>
                )}
                {activeInput?.includes("gold") && (
                  <div
                    onClick={preventClose}
                    className="mt-1 flex justify-center items-center gap-2"
                  >
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={InputStyle}
                    />
                    <button onClick={handleSubmit} className={buttonStyle}>
                      {activeInput === "gold-buy" ? "BUY" : "SELL"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Currency Exchange */}
            <div
              className="col-span-2 row-span-1 p-2 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col h-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {!isSectionUnlocked('currency') && <LockedOverlay sectionName="CURRENCY EXCHANGE" />}
              <h3 className="text-center text-xl font-poiret font-bold text-white mb-1 flex-shrink-0">
                CURRENCY EXCHANGE
              </h3>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-3 gap-2">
                  {selectedCurrency.map((currency) => {
                    const monthIndex =
                      displayTotalMonths % currency.data.length;
                    const currentCurrencyData = currency.data[monthIndex];
                    const currencyId = currency.symbol;
                    const holding =
                      gameState.holdings?.currencies?.[currencyId];
                    const unrealizedCurrencyProfit = holding
                      ? currentCurrencyData.close * holding.units -
                        holding.avgCost * holding.units
                      : 0;

                    return (
                      <div
                        key={currencyId}
                        className="border-r border-dashed border-white last:border-r-0 px-2 pt-2 flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-white text-base font-poiret font-bold">
                            {currency.symbol}
                          </p>

                          {/* Mini Chart */}
                          <div className="w-full flex justify-center mb-1">
                            <div className="w-[85%] h-10">
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

                          <div className="flex justify-between px-2">
                            <p className="text-white text-sm font-poiret font-bold">
                              {currentCurrencyData.close.toFixed(2)} $
                            </p>
                            <p
                              className={`text-sm font-poiret font-bold ${
                                currentCurrencyData.change >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {currentCurrencyData.change >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(currentCurrencyData.change).toFixed(2)}%
                            </p>
                          </div>

                          <div className="flex justify-between px-2 mt-1">
                            <p
                              className={`text-base font-poiret font-bold ${
                                unrealizedCurrencyProfit >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              Unreal: {unrealizedCurrencyProfit.toFixed(0)} $
                            </p>
                            <p className="text-white text-base font-poiret font-bold">
                              Units: {holding?.units || 0}
                            </p>
                          </div>
                        </div>

                        <div className="pb-1">
                          {/* Amount buttons */}
                          <div className="flex justify-between px-4 mt-1 text-base">
                            {["1", "10", "25", "MAX"].map((amt) => (
                              <button
                                key={amt}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrencyAmounts({
                                    ...currencyAmounts,
                                    [currencyId]: amt,
                                  });
                                }}
                                className={`text-sm font-poiret font-bold transition-all duration-200 ${
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
                          <div className="flex justify-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                handleCurrencyTransaction(
                                  currencyId,
                                  "sell",
                                  currentCurrencyData.close
                                )
                              }
                              className={buttonStyle}
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
                              className={buttonStyle}
                            >
                              BUY
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-8 text-center">
            <h2 className="text-2xl font-poiret font-bold mb-4 text-white">
              Exit the Investment Game?
            </h2>
            <div className="flex justify-center gap-4">
              <button onClick={handleExitConfirm} className={buttonStyle}>
                Yes
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className={buttonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventModal && eventData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-8 text-center w-[400px]">
            <h2 className="text-2xl font-poiret font-bold mb-3 text-[#B7FD5E]">
              {eventData.title}
            </h2>

            <p className="text-xl font-poiret font-bold text-white mb-4">
              {eventData.message}
            </p>

            <p
              className={`text-xl font-poiret font-bold mb-4 ${
                eventData.amount >= 0 ? "text-[#B7FD5E]" : "text-red-500"
              }`}
            >
              {eventData.amount > 0
                ? `+${eventData.amount.toLocaleString()}$`
                : `${eventData.amount.toLocaleString()}$`}
            </p>

            {eventData.amount >= 0 ? (
              <button
                onClick={async () => {
                  await applyEventEffect({ amount: eventData.amount });
                  setShowEventModal(false);
                }}
                className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-transparent px-4 font-poiret font-bold text-xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none"
              >
                Collect
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {gameState.pocket >= Math.abs(eventData.amount) && (
                  <button
                    onClick={async () => {
                      await applyEventEffect({ amount: eventData.amount });
                      setShowEventModal(false);
                    }}
                    className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-red-700 bg-red-400 px-4 font-poiret font-bold text-xl tracking-wide text-red-100 transition-all duration-150 [box-shadow:0px_4px_0px_#550000] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#550000] active:translate-y-[4px] active:shadow-none"
                  >
                    Pay with Pocket Cash (
                    {Math.abs(eventData.amount).toLocaleString()}$)
                  </button>
                )}

                <button
                  onClick={() => {
                    setDebtAmount(Math.abs(eventData.amount));
                    setInDebtMode(true);
                    setShowEventModal(false);
                  }}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-transparent px-4 font-poiret font-bold text-xl tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_6px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_8px_0px_#005500] active:translate-y-[4px] active:shadow-none"
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
          <div className="fixed inset-0 bg-black bg-opacity-20 pointer-events-none z-40"></div>

          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="relative group">
              <div className="bg-red-600 border-2 border-red-900 rounded-sm px-4 py-2 [box-shadow:0px_4px_0px_#550000] cursor-pointer pointer-events-auto">
                <p className="text-base font-poiret font-bold text-red-100 text-center whitespace-nowrap">
                  Debt: {debtAmount.toLocaleString()}$
                </p>
              </div>

              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-600 border-2 border-red-800 rounded-sm p-4 [box-shadow:0px_4px_0px_#550000] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-[280px] pointer-events-auto">
                <p className="text-xl font-poiret font-bold text-red-100 text-center mb-1">
                  You owe: {debtAmount.toLocaleString()}$
                </p>
                <p className="text-base font-poiret font-bold text-red-100 text-center mb-2">
                  Sell assets to raise funds
                </p>

                <button
                  onClick={async () => {
                    if (gameState.pocket >= debtAmount) {
                      await applyEventEffect({ amount: -debtAmount });
                      setDebtAmount(0);
                      setInDebtMode(false);
                    }
                  }}
                  disabled={gameState.pocket < debtAmount}
                  className={`
      group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-sm border-2 px-4 font-poiret font-bold text-base tracking-wide transition-all duration-150
      ${
        gameState.pocket >= debtAmount
          ? "border-red-700 bg-red-400 text-red-100 cursor-pointer [box-shadow:0px_4px_0px_#550000] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#550000] active:translate-y-[2px] active:shadow-none"
          : "border-gray-600 bg-gray-500 text-gray-300 cursor-not-allowed [box-shadow:0px_4px_0px_#333333] opacity-80"
      }
    `}
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