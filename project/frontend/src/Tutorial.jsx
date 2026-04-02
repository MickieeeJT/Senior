import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import index from "./assets/Index.png";
import gold from "./assets/Gold.png";

// --- CONFIGURATION ---
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
    title: "Savings Account",
    icon: saving,
    description: "Safe Haven for Your Money",
    content: [
      "Savings accounts offer the lowest risk investment option with guaranteed returns and full capital protection.",
      "Interest Rate: Typically 1.5% monthly (18% annually) in this game, compounded automatically at the end of each month.",
      "Capital Safety: Your principal is always protected and cannot decrease in value under normal conditions.",
      "Liquidity: You can deposit and withdraw money anytime without penalties, making it highly flexible.",
      "Predictability: Returns are stable and do not fluctuate with market events or economic crises.",
      "Inflation Impact: While safe, returns may not always outpace inflation over long periods.",
      "Best For: Emergency funds, short-term savings goals, and players who prioritize safety over growth.",
      "Strategy Tip: Ideal for storing cash while waiting for better investment opportunities.",
      "Risk Level: Very Low - Minimal growth but maximum stability."
    ],
    practiceConfig: {
      type: 'savings',
      initialBalance: 1000,
      initialPocket: 5000,
      interestRate: 0.015
    }
  },
  [TUTORIAL_TYPES.BONDS]: {
    title: "Government bonds",
    description: "Steady Returns from Government Securities",
    content: [
      "Government bonds are loans you give to the government for fixed periods in exchange for regular interest payments.",
      "Duration Options: 1 year, 5 years, or 10 years with increasing interest rates for longer commitments.",
      "Interest Rates: Typically range between 3–7% annually depending on duration.",
      "Fixed Income: You receive predictable interest payments at scheduled intervals.",
      "Capital Return: Your full principal is returned at maturity if held until the end of the term.",
      "Early Withdrawal: Available but comes with a 10% penalty fee on earned interest.",
      "Market Sensitivity: Bond values may fluctuate if interest rates change in the broader economy.",
      "Stability Factor: Government-backed securities are considered one of the safest long-term investments.",
      "Best For: Players seeking steady income with moderate growth and low uncertainty.",
      "Risk Level: Low - Stable and predictable, but less flexible than savings accounts."
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
    title: "Index Fund",
    icon: index,
    description: "Diversified Market Investment",
    content: [
      "Index funds track overall stock market performance automatically by investing in a wide range of companies.",
      "Diversification: Spreads risk across multiple companies and sectors to reduce individual company impact.",
      "Market Exposure: Returns mirror overall market performance and can be positive or negative.",
      "Historical Trend: Markets tend to grow over long periods despite short-term volatility.",
      "Automatic Rebalancing: The fund adjusts holdings to match the underlying index.",
      "Cost Efficiency: Typically lower fees compared to actively managed funds.",
      "Volatility: Value may fluctuate significantly during economic booms or recessions.",
      "Long-Term Focus: Designed for players willing to hold investments for 5+ years.",
      "Best For: Balanced growth strategies and passive investors.",
      "Risk Level: Medium - Subject to market swings but historically reliable over time."
    ],
    practiceConfig: {
      type: 'indexFund',
      initialPocket: 5000,
      initialPrice: 1245.50,
      priceChange: 2.3
    }
  },
  [TUTORIAL_TYPES.STOCKS]: {
    title: "Individual Stocks",
    description: "High-Risk, High-Reward Investments",
    content: [
      "Individual stocks represent ownership shares in specific companies.",
      "Ownership Advantage: Shareholders may benefit from company growth and dividend payments.",
      "Price Volatility: Stock prices can fluctuate dramatically month by month based on news and earnings reports.",
      "Research Required: Success depends on analyzing company performance, leadership, industry trends, and financial reports.",
      "Market Sentiment: Prices are influenced by investor confidence and global events.",
      "Share Trading: Buy/sell in quantities (1, 10, 25 shares, or MAX available).",
      "Potential Returns: High growth stocks may generate significant gains over short periods.",
      "Downside Risk: Poor performance or scandals can cause sharp price drops.",
      "Portfolio Impact: Holding too much of one stock increases concentration risk.",
      "Best For: Experienced players willing to monitor markets actively.",
      "Risk Level: High - High reward potential but significant downside risk."
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
    title: "Gold Investment",
    icon: gold,
    description: "Precious Metal as Inflation Hedge",
    content: [
      "Gold is a traditional store of value during economic uncertainty and financial instability.",
      "Safe Haven Asset: Often increases in value during recessions or geopolitical crises.",
      "Inflation Protection: Historically maintains purchasing power over long periods.",
      "Price Measurement: Traded by grams with prices fluctuating based on global demand and supply.",
      "No Passive Income: Gold does not generate interest or dividends.",
      "Currency Hedge: Often rises when fiat currencies weaken.",
      "Diversification Benefit: Frequently moves independently from stocks and bonds.",
      "Market Cycles: Can experience long periods of slow growth or stagnation.",
      "Best For: Risk hedging and portfolio balance.",
      "Risk Level: Medium - More stable than stocks but still subject to global demand fluctuations."
    ],
    practiceConfig: {
      type: 'gold',
      initialPocket: 5000,
      goldPrice: 2150.00,
      priceChange: 0.8
    }
  },
  [TUTORIAL_TYPES.CURRENCY]: {
    title: "Currency Exchange",
    description: "Foreign Exchange Trading",
    content: [
      "Currency trading involves buying and selling foreign currencies (USD, EUR, JPY) in global markets.",
      "Exchange Rates: Currency values fluctuate based on economic performance, inflation, and interest rates.",
      "Central Bank Influence: Policy decisions can cause rapid currency appreciation or depreciation.",
      "Global Factors: International trade, geopolitical tensions, and economic reports impact exchange rates.",
      "Speculation Strategy: Profits come from correctly predicting short-term value changes.",
      "Leverage Option (if enabled in game): Can amplify gains but also magnify losses.",
      "High Liquidity: Currency markets operate 24 hours a day in real-world conditions.",
      "Rapid Movements: Prices can change within minutes during major announcements.",
      "Best For: Advanced players who monitor global economic trends.",
      "Risk Level: High - Extremely volatile and unpredictable."
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

    // Always start with tutorial interface, even if completed
    setActiveTutorial(type);
    setCurrentStep(0);
    setShowGameInterface(true);
    // Reset practice data when starting a tutorial
    if (!completedTutorials.has(type)) {
       // Only needed if strictly new, but harmless to leave out as handleNext/End will init it
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
    // If already learned/completed, just close without API call
    if (completedTutorials.has(activeTutorial)) {
      handleCloseTutorial();
      return;
    }

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

  const buttonStyle =
    "group relative inline-flex h-10 w-24 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-transparent px-3 font-poiret font-bold text-sm tracking-wide text-[#33ff33] transition-all duration-150 [box-shadow:0px_4px_0px_#005500] hover:-translate-y-[2px] hover:[box-shadow:0px_6px_0px_#005500] active:translate-y-[2px] active:shadow-none";
  const InputStyle =
    "group relative inline-flex h-10 w-32 items-center justify-center overflow-hidden rounded-sm border-2 border-[#11942F] bg-white px-3 font-poiret font-bold text-sm tracking-wide text-black";
    
  // Helper for wider buttons if needed
  const wideButtonStyle = buttonStyle.replace("w-24", "w-auto px-6");
  
  // Invest.jsx Card Style
  const investCardStyle = "p-4 text-center border-t-[3px] border-t-[#5EBD50] border-l-[3px] border-l-[#5EBD50] border-b-[3px] border-b-[#11942F] border-r-[3px] border-r-[#11942F] flex flex-col justify-between relative bg-transparent min-h-[300px]";
  const titleStyle = "text-xl font-poiret font-bold mb-2 text-white";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#011D10] text-white font-poiret flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-poiret text-[#B7FD5E] mb-4">Loading Tutorial...</div>
          <div className="text-4xl font-poiret text-[#B7FD5E] mb-4">Loading Progress...</div>
          <div className="animate-spin w-12 h-12 border-4 border-[#B7FD5E] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // --- RENDER PRACTICE MODE ---
  if (showPracticeMode) {
    const config = TUTORIAL_DATA[activeTutorial].practiceConfig;
    
    return (
      <div className="min-h-screen bg-[#011D10] text-white font-poiret p-6 flex flex-col items-center">
        <header className="w-full flex justify-between items-center border-b-4 border-[#ffffff] mb-8 pb-2 ">
          <h1 className="text-5xl font-poiret font-bold text-[#B7FD5E]">
            Practice: {TUTORIAL_DATA[activeTutorial].title}
          </h1>
          <nav className="flex gap-6 text-3xl font-poiret">
            <button
              onClick={handleCloseTutorial}
              className="text-[#B7FD5E] hover:text-white transition font-bold"
            >
              Back to Tutorials
            </button>
          </nav>
        </header>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-poiret font-bold text-white mb-2">
            Practice Mode - Try the buttons and see how it works!
          </h2>
          <p className="text-2xl font-poiret font-bold text-[#B7FD5E]">
            Pocket Money: {practiceData.pocket?.toFixed(2)} $
          </p>
        </div>

        <div className="w-full max-w-4xl">
          {config.type === 'savings' && (
            <div className={`${investCardStyle} max-w-md mx-auto`}>
              <div>
                <h3 className={titleStyle}>Saving Account</h3>
                <div className="flex justify-center mb-2">
                  <img src={saving} alt="saving icon" className="w-20 h-20" />
                </div>
                <div className="flex justify-between px-4 mt-2 mb-4">
                  <p className="text-white text-base font-poiret font-bold">
                    Balance: {practiceData.savingsBalance?.toFixed(2)} $
                  </p>
                  <p className="text-white text-base font-poiret font-bold">
                    Profit: 0.00 $
                  </p>
                </div>
              </div>
              <div className="pb-2">
                <div className="flex justify-center items-center gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={practiceAmount}
                    onChange={(e) => setPracticeAmount(e.target.value)}
                    className={InputStyle}
                  />
                  <div className="flex gap-1">
                    <button onClick={() => handlePracticeTransaction('deposit')} className={buttonStyle}>DEPOSIT</button>
                    <button onClick={() => handlePracticeTransaction('withdraw')} className={buttonStyle}>WITHDRAW</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {config.type === 'bonds' && (
            <div className={`${investCardStyle} h-auto`}>
              <div className="flex-1">
                <h3 className={titleStyle}>GOVERNMENT BONDS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 px-4 overflow-y-auto max-h-[200px]">
                   {(practiceData.bondInvestments || []).length === 0 ? (
                      <div className="col-span-3 text-gray-500 font-bold py-4">No Active Bonds</div>
                   ) : (
                     practiceData.bondInvestments.map((bond) => (
                      <div key={bond.id} className="flex flex-col items-center mb-1">
                        <div className="relative w-12 h-12">
                          <svg viewBox="0 0 36 36" className="w-full h-full rounded-full transform -rotate-90">
                            <path className="text-gray-700" strokeWidth="30" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-[#B7FD5E]" strokeWidth="30" strokeDasharray={`10, 100`} fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-xs font-poiret font-bold text-white">${bond.amount.toFixed(0)}</div>
                          </div>
                        </div>
                        <div className="text-white text-xs font-poiret font-bold mt-1">{bond.duration}</div>
                      </div>
                     ))
                   )}
                </div>
              </div>

              <div className="pb-2 flex flex-col items-center border-t border-gray-700 pt-4">
                 <div className="flex justify-center gap-4 mb-3">
                  {Object.entries(practiceData.bondRates || {}).map(([duration, rate]) => (
                    <div
                      key={duration}
                      onClick={() => setSelectedBond(duration)}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                       <div
                          className={`font-bold rounded-full w-12 h-12 flex items-center justify-center transition-all text-sm ${
                            selectedBond === duration
                              ? "bg-[#B7FD5E] text-black scale-105 shadow-[0_0_10px_#00FF00]"
                              : "bg-gray-100 text-black group-hover:bg-gray-300"
                          }`}
                        >
                          {duration.split(" ")[0]}Y
                        </div>
                        <div className="text-sm font-poiret font-bold text-[#B7FD5E] mt-1">
                          {(rate * 100).toFixed(1)}%
                        </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={practiceAmount}
                    onChange={(e) => setPracticeAmount(e.target.value)}
                    className={InputStyle}
                  />
                  <button
                    onClick={() => handlePracticeTransaction('buy')}
                    disabled={!selectedBond}
                    className={`${buttonStyle} ${!selectedBond ? "opacity-50 cursor-not-allowed border-gray-500 text-gray-500 shadow-none hover:translate-y-0" : ""}`}
                  >
                    BUY
                  </button>
                </div>
              </div>
            </div>
          )}

          {config.type === 'indexFund' && (
            <div className={`${investCardStyle} max-w-md mx-auto`}>
              <div>
                <h3 className={titleStyle}>INDEX FUND</h3>
                {/* Simulated Chart Area */}
                <div className="w-full flex justify-center mb-2">
                   <div className="w-[85%] h-12 border-b border-l border-gray-600 relative overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                         <polyline points="0,40 20,35 40,45 60,20 80,25 100,10" fill="none" stroke={practiceData.priceChange >= 0 ? "#4ade80" : "#f87171"} strokeWidth="2" />
                      </svg>
                   </div>
                </div>

                <div className="flex justify-between px-4 mt-2">
                  <p className="text-white text-base font-poiret font-bold">
                    {practiceData.price?.toFixed(2)} $
                  </p>
                  <p className={`text-base font-poiret font-bold ${practiceData.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {practiceData.priceChange >= 0 ? "▲" : "▼"} {Math.abs(practiceData.priceChange || 0)}%
                  </p>
                </div>
                 <div className="flex justify-between px-4 mt-2 mb-4">
                  <p className="text-white text-base font-poiret font-bold">
                    Shares: {practiceData.shares?.toFixed(4) || 0}
                  </p>
                  <p className="text-white text-base font-poiret font-bold">
                    Balance: {practiceData.fundBalance?.toFixed(2) || 0} $
                  </p>
                </div>
              </div>
              
              <div className="pb-2">
                 <div className="flex justify-center items-center gap-2">
                  <input 
                    type="number" 
                    value={practiceAmount} 
                    onChange={(e) => setPracticeAmount(e.target.value)} 
                    className={InputStyle}
                    placeholder="Amount" 
                  />
                  <button onClick={() => handlePracticeTransaction('buy')} className={buttonStyle}>BUY</button>
                  <button onClick={() => handlePracticeTransaction('sell')} className={buttonStyle}>SELL</button>
                </div>
              </div>
            </div>
          )}

          {(config.type === 'stocks' || config.type === 'currency') && (
             <div className={`${investCardStyle} h-auto`}>
               <h3 className={titleStyle}>{config.type === 'stocks' ? "INDIVIDUAL STOCKS" : "CURRENCY EXCHANGE"}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                 {(config.mockStocks || config.currencies).map((item) => (
                   <div key={item.symbol} className="border-r border-dashed border-white last:border-r-0 px-2 pt-2 flex flex-col justify-between">
                     <div>
                       <p className="text-white text-lg font-poiret font-bold">{item.symbol}</p>
                        {/* Simulated Mini Chart */}
                        <div className="w-full flex justify-center mb-1">
                          <div className="w-[85%] h-10 border-b border-l border-gray-600">
                             <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <polyline points="0,30 25,10 50,25 75,5 100,20" fill="none" stroke={item.change >= 0 ? "#4ade80" : "#f87171"} strokeWidth="1.5" />
                             </svg>
                          </div>
                        </div>

                       <div className="flex justify-between px-2">
                          <span className="text-white font-bold">${item.price.toFixed(2)}</span>
                          <span className={`font-bold ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                             {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change)}%
                          </span>
                       </div>
                       <div className="flex justify-between px-2 mt-1 mb-2">
                          <span className="text-[#B7FD5E] font-bold text-sm">
                             Held: {config.type === 'stocks' ? practiceData.stocks?.[item.symbol]?.shares : practiceData.currencies?.[item.symbol]?.units}
                          </span>
                          <span className="text-gray-400 text-xs">Profit: 0.00</span>
                       </div>
                     </div>

                     <div className="pb-1">
                       <div className="flex items-center gap-2 mb-2 justify-center">
                         <input 
                            type="number" 
                            value={practiceAmount} 
                            onChange={(e) => setPracticeAmount(e.target.value)} 
                            className={`${InputStyle} w-24`}
                            placeholder="Qty" 
                          />
                       </div>
                       <div className="flex justify-center gap-2">
                         <button onClick={() => config.type === 'stocks' ? handleStockTransaction(item.symbol, 'buy', item.price) : handleCurrencyTransaction(item.symbol, 'buy', item.price)} className={buttonStyle}>BUY</button>
                         <button onClick={() => config.type === 'stocks' ? handleStockTransaction(item.symbol, 'sell', item.price) : handleCurrencyTransaction(item.symbol, 'sell', item.price)} className={buttonStyle}>SELL</button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
          
          {config.type === 'gold' && (
            <div className={`${investCardStyle} max-w-md mx-auto`}>
              <div>
                 <h3 className={titleStyle}>GOLD</h3>
                 {/* Simulated Chart Area */}
                <div className="w-full flex justify-center mb-2">
                   <div className="w-[85%] h-12 border-b border-l border-gray-600 relative overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                         <polyline points="0,40 20,38 40,42 60,30 80,32 100,25" fill="none" stroke="#fbbf24" strokeWidth="2" />
                      </svg>
                   </div>
                </div>

                 <div className="flex justify-between px-4 mt-2">
                    <p className="text-white text-base font-poiret font-bold">
                       {practiceData.goldPrice?.toFixed(2)} $
                    </p>
                     <p className={`text-base font-poiret font-bold ${practiceData.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {practiceData.priceChange >= 0 ? "▲" : "▼"} {Math.abs(practiceData.priceChange || 0.8)}%
                     </p>
                 </div>
                 <div className="flex justify-between px-4 mt-2 mb-4">
                    <p className="text-white text-base font-poiret font-bold">
                      Balance: {practiceData.goldBalance?.toFixed(2)} $
                    </p>
                    <p className="text-white text-base font-poiret font-bold">
                       Profit: 0.00 $
                    </p>
                 </div>
              </div>

              <div className="pb-2">
                 <div className="flex justify-center items-center gap-2">
                   <input 
                    type="number" 
                    value={practiceAmount} 
                    onChange={(e) => setPracticeAmount(e.target.value)} 
                    className={InputStyle}
                    placeholder="Amount" 
                  />
                  <button onClick={() => handlePracticeTransaction('buy')} className={buttonStyle}>BUY</button>
                  <button onClick={() => handlePracticeTransaction('sell')} className={buttonStyle}>SELL</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center pb-8">
          <button
            onClick={handleCompleteTutorial}
            className={`${wideButtonStyle} h-12 text-lg`}
          >
            COMPLETE TUTORIAL
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER SELECTION MENU ---
  return (
    <div className="min-h-screen bg-[#011D10] text-white font-poiret p-6">
      <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-8 pb-2">
        <h1 className="text-5xl font-poiret font-bold text-[#B7FD5E] mx-8">Investment Tutorial</h1>
        <nav className="flex gap-10 text-3xl font-poiret mr-3">
          <button 
            onClick={() => navigate("/home")} 
            className="text-[#B7FD5E] hover:text-white transition font-bold"
          >
            Home
          </button>
          {allTutorialsCompleted && (
            <button 
              onClick={handleStartGame} 
              className="text-[#B7FD5E] hover:text-white transition font-bold"
            >
              Start Game
            </button>
          )}
        </nav>
      </header>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-poiret font-bold text-white mb-4">
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
                className={`relative p-6 text-center border-4 border-[#11942F] transition-all duration-300 bg-[#011D10] shadow-[0_0_15px_rgba(17,148,47,0.3)] flex flex-col items-center ${
                  isAvailable ? "opacity-100 cursor-pointer hover:scale-105 hover:shadow-[0_0_25px_rgba(17,148,47,0.6)]" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => isAvailable && handleTutorialSelect(type)}
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

                <h3 className="text-2xl font-poiret font-bold mb-4 text-[#B7FD5E] tracking-wide">{data.title}</h3>
                {data.icon && <div className="flex justify-center mb-4"><img src={data.icon} alt={data.title} className="w-20 h-20" /></div>}
                <p className="text-lg font-poiret font-bold text-white mb-6 min-h-[3rem]">{data.description}</p>

                <div className="mt-auto w-full flex justify-center">
                  {isCompleted ? (
                     <button className={wideButtonStyle}>RELEARN</button>
                  ) : isAvailable ? (
                    <button className={wideButtonStyle}>START TUTORIAL</button>
                  ) : (
                    <div className="inline-flex h-10 px-6 items-center justify-center rounded-sm border-2 border-gray-600 bg-transparent font-poiret font-bold text-sm tracking-wide text-gray-400">LOCKED</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TUTORIAL POPUP */}
      {activeTutorial && !showPracticeMode && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#011D10] border-4 border-[#11942F] rounded-sm p-8 max-w-2xl mx-4 shadow-[0_0_30px_rgba(17,148,47,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#11942F] pb-4">
              <h2 className="text-4xl font-poiret font-bold text-[#B7FD5E]">{TUTORIAL_DATA[activeTutorial].title}</h2>
              <button onClick={handleCloseTutorial} className="text-white text-2xl hover:text-[#B7FD5E] transition">✕</button>
            </div>
            <div className="mb-8 min-h-[150px]">
              <p className="text-xl font-poiret font-bold text-white leading-relaxed">{TUTORIAL_DATA[activeTutorial].content[currentStep]}</p>
            </div>
            <div className="flex justify-center gap-2 mb-8">
              {TUTORIAL_DATA[activeTutorial].content.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentStep ? "bg-[#B7FD5E] scale-125 shadow-[0_0_8px_#B7FD5E]" : "bg-gray-600"}`}></div>
              ))}
            </div>
            <div className="flex justify-between">
              <button 
                onClick={handlePrevious} 
                disabled={currentStep === 0} 
                className={`${wideButtonStyle} ${currentStep === 0 ? "opacity-50 cursor-not-allowed border-gray-600 text-gray-500 shadow-none hover:translate-y-0" : ""}`}
              >
                PREVIOUS
              </button>
              <button 
                onClick={handleNext} 
                className={wideButtonStyle}
              >
                {currentStep === TUTORIAL_DATA[activeTutorial].content.length - 1 ? "PRACTICE MODE" : "NEXT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}