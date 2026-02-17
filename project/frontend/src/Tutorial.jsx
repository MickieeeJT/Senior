import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import index from "./assets/Index.png";
import gold from "./assets/Gold.png";

// --- CONFIGURATION ---
// CHECK YOUR BACKEND CONSOLE: If it says "Server running on port 8080", change this to 8080.
const API_BASE_URL = "http://localhost:8000/api/tutorial"; 

const TUTORIAL_TYPES = {
  SAVINGS: 'savings',
  BONDS: 'bonds',
  INDEX_FUND: 'indexFund',
  STOCKS: 'stocks',
  GOLD: 'gold',
  CURRENCY: 'currency'
};

// Define the required order for tutorial completion
// This array acts as the map: Index 0 = Level 1, Index 1 = Level 2, etc.
const TUTORIAL_ORDER = [
  TUTORIAL_TYPES.SAVINGS,
  TUTORIAL_TYPES.BONDS,
  TUTORIAL_TYPES.INDEX_FUND,
  TUTORIAL_TYPES.STOCKS,
  TUTORIAL_TYPES.GOLD,
  TUTORIAL_TYPES.CURRENCY
];

const TUTORIAL_DATA = {
  [TUTORIAL_TYPES.SAVINGS]: {
    title: "SAVINGS ACCOUNT",
    icon: saving,
    description: "Safe Haven for Your Money",
    content: [
      "Savings accounts offer the lowest risk investment option with guaranteed returns.",
      "Interest Rate: Typically 1.5% monthly (18% annually) in this game.",
      "Liquidity: You can deposit and withdraw money anytime without penalties.",
      "Best For: Emergency funds and short-term savings goals.",
      "Risk Level: Very Low - Your principal is always protected."
    ],
    practiceConfig: {
      type: 'savings',
      initialBalance: 1000,
      initialPocket: 5000,
      interestRate: 0.015
    }
  },
  [TUTORIAL_TYPES.BONDS]: {
    title: "GOVERNMENT BONDS",
    description: "Steady Returns from Government Securities",
    content: [
      "Government bonds are loans you give to the government for fixed periods.",
      "Duration Options: 1 year, 5 years, or 10 years with increasing interest rates.",
      "Interest Rates: Longer duration = Higher returns (3-7% annually).",
      "Early Withdrawal: Available but comes with a 10% penalty fee.",
      "Risk Level: Low - Government-backed security with predictable returns."
    ],
    practiceConfig: {
      type: 'bonds',
      initialPocket: 5000,
      bondRates: {
        "1 year": 0.04,
        "5 years": 0.055,
        "10 years": 0.07
      }
    }
  },
  [TUTORIAL_TYPES.INDEX_FUND]: {
    title: "INDEX FUND",
    icon: index,
    description: "Diversified Market Investment",
    content: [
      "Index funds track stock market performance automatically.",
      "Diversification: Spreads risk across multiple companies and sectors.",
      "Market Exposure: Returns mirror overall market performance (can be positive or negative).",
      "Professional Management: No need to pick individual stocks.",
      "Risk Level: Medium - Subject to market volatility but historically reliable."
    ],
    practiceConfig: {
      type: 'indexFund',
      initialPocket: 5000,
      initialPrice: 1245.50,
      priceChange: 2.3
    }
  },
  [TUTORIAL_TYPES.STOCKS]: {
    title: "INDIVIDUAL STOCKS",
    description: "High-Risk, High-Reward Investments",
    content: [
      "Individual stocks represent ownership shares in specific companies.",
      "Price Volatility: Stock prices can fluctuate dramatically month by month.",
      "Research Required: Success depends on company performance and market conditions.",
      "Share Trading: Buy/sell in quantities (1, 10, 25 shares, or MAX available).",
      "Risk Level: High - Potential for significant gains or losses."
    ],
    practiceConfig: {
      type: 'stocks',
      initialPocket: 5000,
      mockStocks: [
        { symbol: "AOT", price: 72.50, change: 2.8 },
        { symbol: "CPALL", price: 58.25, change: -1.2 }
      ]
    }
  },
  [TUTORIAL_TYPES.GOLD]: {
    title: "GOLD INVESTMENT",
    icon: gold,
    description: "Precious Metal as Inflation Hedge",
    content: [
      "Gold is a traditional store of value during economic uncertainty.",
      "Inflation Protection: Historically maintains purchasing power over time.",
      "Price Measured: Traded by grams with prices fluctuating based on global demand.",
      "Portfolio Diversification: Often moves independently from stocks and bonds.",
      "Risk Level: Medium - Less volatile than stocks but can have periods of decline."
    ],
    practiceConfig: {
      type: 'gold',
      initialPocket: 5000,
      goldPrice: 2150.00,
      priceChange: 0.8
    }
  },
  [TUTORIAL_TYPES.CURRENCY]: {
    title: "CURRENCY EXCHANGE",
    description: "Foreign Exchange Trading",
    content: [
      "Currency trading involves buying and selling foreign currencies (USD, EUR, JPY).",
      "Exchange Rates: Currency values fluctuate based on economic and political factors.",
      "Global Markets: Affected by international trade, interest rates, and geopolitical events.",
      "Speculation: Profits come from correctly predicting currency value changes.",
      "Risk Level: High - Currency markets are extremely volatile and unpredictable."
    ],
    practiceConfig: {
      type: 'currency',
      initialPocket: 5000,
      currencies: [
        { symbol: "USD", price: 35.42, change: 0.15 },
        { symbol: "EUR", price: 38.76, change: -0.32 }
      ]
    }
  }
};

export default function Tutorial() {
  const navigate = useNavigate();
  const [completedTutorials, setCompletedTutorials] = useState(new Set());
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  
  // Tutorial mode state
  const [showGameInterface, setShowGameInterface] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);

  // Practice mode state
  const [practiceData, setPracticeData] = useState({});
  const [practiceAmount, setPracticeAmount] = useState("");
  const [selectedBond, setSelectedBond] = useState("");

  // 1. UPDATED: Fetch Tutorial Progress (Number -> Set)
  const fetchTutorialProgress = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // Using API_BASE_URL to avoid port mismatch issues
      const response = await fetch(`${API_BASE_URL}/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Backend returns: { success: true, tutorialLevel: 3 }
        // We convert Level 3 -> ['savings', 'bonds', 'indexFund']
        const level = data.tutorialLevel || 0;
        const completedList = TUTORIAL_ORDER.slice(0, level);
        
        setCompletedTutorials(new Set(completedList));
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        console.error('Failed to fetch tutorial progress:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tutorial progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Mark Tutorial Complete
  const markTutorialComplete = async (tutorialType) => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Using API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tutorialType })
      });

      if (response.ok) {
        // Optimistic UI Update: Add to set immediately so user sees checkmark
        const newCompleted = new Set(completedTutorials);
        newCompleted.add(tutorialType);
        setCompletedTutorials(newCompleted);
        return true;
      } else {
        console.error('Failed to complete tutorial:', response.status);
      }
      return false;
    } catch (error) {
      console.error('Error marking tutorial complete:', error);
      // Still update UI even if network fails temporarily (optional choice)
      const newCompleted = new Set(completedTutorials);
      newCompleted.add(tutorialType);
      setCompletedTutorials(newCompleted);
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username || 'User');
    } catch (error) {
      console.error('Invalid token:', error);
      navigate('/login');
      return;
    }

    fetchTutorialProgress();
  }, [navigate]);

  const initializePracticeMode = (tutorialType) => {
    const config = TUTORIAL_DATA[tutorialType].practiceConfig;
    
    switch (config.type) {
      case 'savings':
        setPracticeData({
          pocket: config.initialPocket,
          savingsBalance: config.initialBalance,
          interestRate: config.interestRate
        });
        break;
      case 'bonds':
        setPracticeData({
          pocket: config.initialPocket,
          bondInvestments: [],
          bondRates: config.bondRates
        });
        break;
      case 'indexFund':
        setPracticeData({
          pocket: config.initialPocket,
          fundBalance: 0,
          shares: 0,
          price: config.initialPrice,
          priceChange: config.priceChange
        });
        break;
      case 'stocks':
        setPracticeData({
          pocket: config.initialPocket,
          stocks: config.mockStocks.reduce((acc, stock) => {
            acc[stock.symbol] = { shares: 0, avgCost: 0 };
            return acc;
          }, {})
        });
        break;
      case 'gold':
        setPracticeData({
          pocket: config.initialPocket,
          goldBalance: 0,
          goldPrice: config.goldPrice,
          priceChange: config.priceChange
        });
        break;
      case 'currency':
        setPracticeData({
          pocket: config.initialPocket,
          currencies: config.currencies.reduce((acc, curr) => {
            acc[curr.symbol] = { units: 0, avgCost: 0 };
            return acc;
          }, {})
        });
        break;
      default:
        setPracticeData({ pocket: 5000 });
    }
  };

  const isInvestmentAvailable = (type) => {
    const tutorialIndex = TUTORIAL_ORDER.indexOf(type);
    if (tutorialIndex === 0) return true;
    
    // Check if previous tutorial in the ORDER list is completed
    const previousType = TUTORIAL_ORDER[tutorialIndex - 1];
    return completedTutorials.has(previousType);
  };

  const handleTutorialSelect = (type) => {
    const isUnlocked = isInvestmentAvailable(type);
    
    if (!isUnlocked) {
      const tutorialIndex = TUTORIAL_ORDER.indexOf(type);
      const previousTutorial = TUTORIAL_ORDER[tutorialIndex - 1];
      const previousTutorialName = TUTORIAL_DATA[previousTutorial]?.title || 'previous tutorial';
      alert(`Please complete ${previousTutorialName} first!`);
      return;
    }

    if (!completedTutorials.has(type)) {
      setActiveTutorial(type);
      setCurrentStep(0);
      setShowGameInterface(true);
    } else {
      setActiveTutorial(type);
      initializePracticeMode(type);
      setShowPracticeMode(true);
    }
  };

  const handleNext = () => {
    const tutorial = TUTORIAL_DATA[activeTutorial];
    if (currentStep < tutorial.content.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      initializePracticeMode(activeTutorial);
      setShowGameInterface(false);
      setShowPracticeMode(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloseTutorial = () => {
    setActiveTutorial(null);
    setCurrentStep(0);
    setShowGameInterface(false);
    setShowPracticeMode(false);
    setPracticeAmount("");
    setSelectedBond("");
  };

  const handleStartGame = () => {
    navigate("/invest");
  };

  const handleCompleteTutorial = async () => {
    try {
      await markTutorialComplete(activeTutorial);
      handleCloseTutorial();
    } catch (error) {
      console.error('Error completing tutorial:', error);
      alert("There was an issue saving your progress, but you can continue.");
      handleCloseTutorial();
    }
  };

  // --- PRACTICE MODE HANDLERS ---
  const handlePracticeTransaction = (action) => {
    const amount = parseFloat(practiceAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    const config = TUTORIAL_DATA[activeTutorial].practiceConfig;
    
    switch (config.type) {
      case 'savings':
        if (action === 'deposit') {
          if (amount <= practiceData.pocket) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket - amount,
              savingsBalance: prev.savingsBalance + amount
            }));
          } else alert("Insufficient pocket money!");
        } else if (action === 'withdraw') {
          if (amount <= practiceData.savingsBalance) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket + amount,
              savingsBalance: prev.savingsBalance - amount
            }));
          } else alert("Insufficient savings balance!");
        }
        break;
        
      case 'bonds':
        if (action === 'buy' && selectedBond) {
          if (amount <= practiceData.pocket) {
            const newBond = {
              id: Date.now(),
              amount: amount,
              duration: selectedBond,
              rate: practiceData.bondRates[selectedBond]
            };
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket - amount,
              bondInvestments: [...prev.bondInvestments, newBond]
            }));
            setSelectedBond("");
          } else alert("Insufficient pocket money!");
        }
        break;
        
      case 'indexFund':
        const shares = amount / practiceData.price;
        if (action === 'buy') {
          if (amount <= practiceData.pocket) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket - amount,
              fundBalance: prev.fundBalance + amount,
              shares: prev.shares + shares
            }));
          } else alert("Insufficient pocket money!");
        } else if (action === 'sell') {
          if (amount <= practiceData.fundBalance) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket + amount,
              fundBalance: prev.fundBalance - amount,
              shares: prev.shares - shares
            }));
          } else alert("Insufficient fund balance!");
        }
        break;
        
      case 'gold':
        if (action === 'buy') {
          if (amount <= practiceData.pocket) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket - amount,
              goldBalance: prev.goldBalance + amount
            }));
          } else alert("Insufficient pocket money!");
        } else if (action === 'sell') {
          if (amount <= practiceData.goldBalance) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket + amount,
              goldBalance: prev.goldBalance - amount
            }));
          } else alert("Insufficient gold balance!");
        }
        break;
    }
    setPracticeAmount("");
  };

  const handleStockTransaction = (symbol, action, price) => {
    const amount = parseInt(practiceAmount) || 1;
    const totalCost = amount * price;
    
    if (action === 'buy') {
      if (totalCost <= practiceData.pocket) {
        setPracticeData(prev => ({
          ...prev,
          pocket: prev.pocket - totalCost,
          stocks: {
            ...prev.stocks,
            [symbol]: {
              ...prev.stocks[symbol],
              shares: prev.stocks[symbol].shares + amount,
              avgCost: price
            }
          }
        }));
      } else alert("Insufficient pocket money!");
    } else if (action === 'sell') {
      const currentShares = practiceData.stocks[symbol].shares;
      if (amount <= currentShares) {
        setPracticeData(prev => ({
          ...prev,
          pocket: prev.pocket + totalCost,
          stocks: {
            ...prev.stocks,
            [symbol]: {
              ...prev.stocks[symbol],
              shares: prev.stocks[symbol].shares - amount
            }
          }
        }));
      } else alert("Insufficient shares!");
    }
  };

  const handleCurrencyTransaction = (symbol, action, price) => {
    const amount = parseInt(practiceAmount) || 1;
    const totalCost = amount * price;
    
    if (action === 'buy') {
      if (totalCost <= practiceData.pocket) {
        setPracticeData(prev => ({
          ...prev,
          pocket: prev.pocket - totalCost,
          currencies: {
            ...prev.currencies,
            [symbol]: {
              ...prev.currencies[symbol],
              units: prev.currencies[symbol].units + amount,
              avgCost: price
            }
          }
        }));
      } else alert("Insufficient pocket money!");
    } else if (action === 'sell') {
      const currentUnits = practiceData.currencies[symbol].units;
      if (amount <= currentUnits) {
        setPracticeData(prev => ({
          ...prev,
          pocket: prev.pocket + totalCost,
          currencies: {
            ...prev.currencies,
            [symbol]: {
              ...prev.currencies[symbol],
              units: prev.currencies[symbol].units - amount
            }
          }
        }));
      } else alert("Insufficient units!");
    }
  };

  const allTutorialsCompleted = completedTutorials.size === TUTORIAL_ORDER.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#011D10] text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-poiret text-[#B7FD5E] mb-4">Loading Tutorial...</div>
          <div className="text-4xl font-jersey text-[#B7FD5E] mb-4">Loading Progress...</div>
          <div className="animate-spin w-12 h-12 border-4 border-[#B7FD5E] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // --- RENDER PRACTICE MODE ---
  if (showPracticeMode) {
    const config = TUTORIAL_DATA[activeTutorial].practiceConfig;
    
    return (
      <div className="min-h-screen bg-[#011D10] text-white font-mono p-6">
        <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-8">
          <h1 className="text-5xl font-poiret text-[#B7FD5E] mx-8">
            PRACTICE: {TUTORIAL_DATA[activeTutorial].title}
          </h1>
          <nav className="flex gap-10 text-3xl font-poiret mr-3">
            <button
              onClick={handleCloseTutorial}
              className="text-[#B7FD5E] hover:text-white transition"
            >
              Back to Tutorials
            </button>
          </nav>
        </header>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-poiret text-white mb-4">
            Practice Mode - Try the buttons and see how it works!
          </h2>
          <p className="text-2xl font-poiret text-[#B7FD5E]">
            Pocket Money: {practiceData.pocket?.toFixed(2)} $
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {config.type === 'savings' && (
            <div className="border-4 border-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">SAVINGS ACCOUNT PRACTICE</h3>
              <div className="flex justify-center mb-4"><img src={saving} className="w-[120px]" /></div>
              <p className="text-2xl font-jersey text-white mb-2">
                Savings Balance: {practiceData.savingsBalance?.toFixed(2)} $
              </p>
              <div className="flex justify-center items-center gap-4 mb-6">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={practiceAmount}
                  onChange={(e) => setPracticeAmount(e.target.value)}
                  className="px-4 py-2 rounded border text-black text-xl font-poiret w-48"
                />
              </div>
              <div className="flex justify-center gap-6">
                <button onClick={() => handlePracticeTransaction('deposit')} className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black">DEPOSIT</button>
                <button onClick={() => handlePracticeTransaction('withdraw')} className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black">WITHDRAW</button>
              </div>
            </div>
          )}

          {config.type === 'bonds' && (
            <div className="border-4 border-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">GOVERNMENT BONDS</h3>
              <div className="flex justify-center gap-4 mb-6">
                {Object.entries(practiceData.bondRates || {}).map(([duration, rate]) => (
                  <div
                    key={duration}
                    onClick={() => setSelectedBond(duration)}
                    className={`cursor-pointer p-4 rounded border-2 transition-colors ${
                      selectedBond === duration ? "border-[#B7FD5E] bg-[#B7FD5E] text-black" : "border-white text-white"
                    }`}
                  >
                    <div className="text-lg font-poiret">{duration}</div>
                    <div className="text-sm">{(rate * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center gap-4 mb-6">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={practiceAmount}
                  onChange={(e) => setPracticeAmount(e.target.value)}
                  className="px-4 py-2 rounded border text-black text-xl font-poiret w-48"
                />
                <button
                  onClick={() => handlePracticeTransaction('buy')}
                  disabled={!selectedBond}
                  className={`text-xl font-jersey px-8 py-3 rounded ${selectedBond ? "bg-[#11942F] text-white" : "bg-gray-600 text-gray-400"}`}
                >
                  BUY BOND
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(practiceData.bondInvestments || []).map((bond) => (
                  <div key={bond.id} className="border border-white p-4 rounded">
                    <div className="text-lg font-poiret text-white">{bond.duration}</div>
                    <div className="text-sm text-[#B7FD5E]">${bond.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.type === 'indexFund' && (
            <div className="border-4 border-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">INDEX FUND</h3>
              <div className="flex justify-center mb-4"><img src={index} className="w-[120px]" /></div>
              <div className="flex justify-center gap-8 mb-4">
                <p className="text-xl font-jersey">Price: {practiceData.price?.toFixed(2)}</p>
                <p className={`text-xl font-jersey ${practiceData.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {practiceData.priceChange >= 0 ? "▲" : "▼"} {Math.abs(practiceData.priceChange || 0)}%
                </p>
              </div>
              <p className="text-lg font-jersey text-[#B7FD5E] mb-6">Shares: {practiceData.shares?.toFixed(4) || 0}</p>
              <div className="flex justify-center gap-6">
                <input type="number" value={practiceAmount} onChange={(e) => setPracticeAmount(e.target.value)} className="px-4 py-2 text-black w-48 font-jersey" placeholder="Amount" />
                <button onClick={() => handlePracticeTransaction('buy')} className="bg-[#11942F] text-white px-8 py-2 font-jersey rounded">BUY</button>
                <button onClick={() => handlePracticeTransaction('sell')} className="bg-[#11942F] text-white px-8 py-2 font-jersey rounded">SELL</button>
              </div>
            </div>
          )}

          {(config.type === 'stocks' || config.type === 'currency') && (
             <div className="border-4 border-[#11942F] p-8 text-center">
               <h3 className="text-3xl font-jersey mb-4 text-white uppercase">{config.type} PRACTICE</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {(config.mockStocks || config.currencies).map((item) => (
                   <div key={item.symbol} className="border border-white p-4 rounded">
                     <h4 className="text-2xl font-jersey text-white">{item.symbol}</h4>
                     <div className="flex justify-between mb-2">
                        <span className="text-white">${item.price.toFixed(2)}</span>
                        <span className={item.change >= 0 ? "text-green-400" : "text-red-400"}>{item.change}%</span>
                     </div>
                     <p className="text-[#B7FD5E] mb-4">Owned: {config.type === 'stocks' ? practiceData.stocks?.[item.symbol]?.shares : practiceData.currencies?.[item.symbol]?.units} {config.type === 'stocks' ? 'shares' : 'units'}</p>
                     <div className="flex items-center gap-2 mb-4 justify-center">
                       <input type="number" value={practiceAmount} onChange={(e) => setPracticeAmount(e.target.value)} className="w-20 px-2 text-black font-jersey" placeholder="Qty" />
                     </div>
                     <div className="flex justify-center gap-4">
                       <button onClick={() => config.type === 'stocks' ? handleStockTransaction(item.symbol, 'buy', item.price) : handleCurrencyTransaction(item.symbol, 'buy', item.price)} className="bg-[#11942F] px-4 py-1 rounded">BUY</button>
                       <button onClick={() => config.type === 'stocks' ? handleStockTransaction(item.symbol, 'sell', item.price) : handleCurrencyTransaction(item.symbol, 'sell', item.price)} className="bg-[#11942F] px-4 py-1 rounded">SELL</button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
          
          {config.type === 'gold' && (
            <div className="border-4 border-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">GOLD</h3>
              <div className="flex justify-center mb-4"><img src={gold} className="w-[120px]" /></div>
              <p className="text-2xl font-jersey text-white mb-6">Gold Balance: {practiceData.goldBalance?.toFixed(2)} $</p>
              <div className="flex justify-center gap-6">
                <input type="number" value={practiceAmount} onChange={(e) => setPracticeAmount(e.target.value)} className="px-4 py-2 text-black w-48 font-jersey" placeholder="Amount" />
                <button onClick={() => handlePracticeTransaction('buy')} className="bg-[#11942F] text-white px-8 py-2 font-jersey rounded">BUY</button>
                <button onClick={() => handlePracticeTransaction('sell')} className="bg-[#11942F] text-white px-8 py-2 font-jersey rounded">SELL</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleCompleteTutorial}
            className="bg-[#11942F] text-white text-xl font-poiret px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
          >
            Complete Tutorial
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER SELECTION MENU ---
  return (
    <div className="min-h-screen bg-[#011D10] text-white font-mono p-6">
      <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-8">
        <h1 className="text-5xl font-jersey text-[#B7FD5E] mx-8">INVESTMENT TUTORIAL</h1>
        <nav className="flex gap-10 text-3xl font-jersey mr-3">
          <button onClick={() => navigate("/")} className="text-[#B7FD5E] hover:text-white transition">Home</button>
          {allTutorialsCompleted && (
            <button onClick={handleStartGame} className="text-[#B7FD5E] hover:text-white transition bg-[#11942F] px-4 py-2 rounded">Start Game</button>
          )}
        </nav>
      </header>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-jersey text-white mb-4">
          Progress: {completedTutorials.size} / {TUTORIAL_ORDER.length} Completed
        </h2>
        <div className="flex justify-center gap-2">
          {TUTORIAL_ORDER.map((_, index) => (
            <div key={index} className={`w-8 h-8 rounded-full border-2 ${index < completedTutorials.size ? "bg-[#B7FD5E] border-[#B7FD5E]" : "bg-transparent border-gray-500"}`}></div>
          ))}
        </div>
      </div>

      {!activeTutorial && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {Object.entries(TUTORIAL_DATA).map(([type, data]) => {
            const isCompleted = completedTutorials.has(type);
            const isAvailable = isInvestmentAvailable(type);

            return (
              <div
                key={type}
                className={`relative p-6 text-center border-4 border-[#11942F] transition-all duration-300 ${
                  isCompleted ? "opacity-100 cursor-default" : isAvailable ? "opacity-100 cursor-pointer hover:scale-105" : "opacity-32 cursor-not-allowed"
                }`}
                onClick={() => isAvailable && !isCompleted && handleTutorialSelect(type)}
              >
                {isCompleted && (
                  <div className="absolute top-2 right-2 w-8 h-8 bg-[#B7FD5E] rounded-full flex items-center justify-center">
                    <span className="text-black text-xl font-bold">✓</span>
                  </div>
                )}
                {!isAvailable && !isCompleted && (
                  <div className="absolute top-2 right-2 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🔒</span>
                  </div>
                )}

                <h3 className="text-2xl font-jersey mb-4 text-[#B7FD5E]">{data.title}</h3>
                {data.icon && <div className="flex justify-center mb-4"><img src={data.icon} alt={data.title} className="w-20 h-20" /></div>}
                <p className="text-lg font-jersey text-white mb-4">{data.description}</p>

                {isCompleted ? (
                  <div className="bg-[#11942F] text-[#B7FD5E] px-4 py-2 rounded font-jersey">COMPLETED</div>
                ) : isAvailable ? (
                  <div className="bg-[#11942F] text-white px-4 py-2 rounded font-jersey hover:bg-[#B7FD5E] hover:text-black">START TUTORIAL</div>
                ) : (
                  <div className="bg-gray-600 text-gray-400 px-4 py-2 rounded font-jersey">LOCKED</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TUTORIAL POPUP */}
      {activeTutorial && !showPracticeMode && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-8 max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-4xl font-jersey text-[#B7FD5E]">{TUTORIAL_DATA[activeTutorial].title}</h2>
              <button onClick={handleCloseTutorial} className="text-white text-2xl">✕</button>
            </div>
            <div className="mb-8 min-h-[100px]">
              <p className="text-xl font-jersey text-white leading-relaxed">{TUTORIAL_DATA[activeTutorial].content[currentStep]}</p>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {TUTORIAL_DATA[activeTutorial].content.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full ${index === currentStep ? "bg-[#B7FD5E]" : "bg-gray-600"}`}></div>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={handlePrevious} disabled={currentStep === 0} className={`text-xl font-jersey px-6 py-2 rounded ${currentStep === 0 ? "text-gray-500" : "text-white"}`}>← Previous</button>
              <button onClick={handleNext} className="bg-[#11942F] text-white text-xl font-jersey px-6 py-2 rounded hover:bg-[#B7FD5E] hover:text-black">
                {currentStep === TUTORIAL_DATA[activeTutorial].content.length - 1 ? "Practice mode" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}