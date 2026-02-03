import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import index from "./assets/Index.png";
import gold from "./assets/Gold.png";

const TUTORIAL_TYPES = {
  SAVINGS: 'savings',
  BONDS: 'bonds',
  INDEX_FUND: 'indexFund',
  STOCKS: 'stocks',
  GOLD: 'gold',
  CURRENCY: 'currency'
};

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

// Mock data for tutorial demonstration
const MOCK_STOCKS = [
  { symbol: "AOT", price: 72.50, change: 2.8 },
  { symbol: "CPALL", price: 58.25, change: -1.2 },
  { symbol: "DELTA", price: 15.75, change: 4.5 },
  { symbol: "EGCO", price: 195.00, change: -0.8 }
];

const MOCK_CURRENCIES = [
  { symbol: "USD", price: 35.42, change: 0.15 },
  { symbol: "EUR", price: 38.76, change: -0.32 },
  { symbol: "JPY", price: 0.24, change: 1.25 }
];

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
  const [selectedStock, setSelectedStock] = useState("");

  // ฟังก์ชันดึงข้อมูล tutorial progress จาก API
  const fetchTutorialProgress = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/tutorial/progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompletedTutorials(new Set(data.completedTutorials));
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        console.error('Failed to fetch tutorial progress');
      }
    } catch (error) {
      console.error('Error fetching tutorial progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันบันทึกการเรียนจบ tutorial
  const markTutorialComplete = async (tutorialType) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8080/api/tutorial/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tutorialType })
      });

      if (response.ok) {
        // อัพเดท state ใน frontend
        const newCompleted = new Set(completedTutorials);
        newCompleted.add(tutorialType);
        setCompletedTutorials(newCompleted);
      } else {
        console.error('Failed to mark tutorial as complete');
      }
    } catch (error) {
      console.error('Error marking tutorial complete:', error);
    }
  };

  // ดึงข้อมูลผู้ใช้และ tutorial progress เมื่อ component โหลด
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // ดึงข้อมูลจาก JWT token
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

  const handleTutorialSelect = (type) => {
    if (!completedTutorials.has(type)) {
      setActiveTutorial(type);
      setCurrentStep(0);
      setShowGameInterface(true);
    } else {
      // If tutorial is completed, go directly to practice mode
      setActiveTutorial(type);
      initializePracticeMode(type);
      setShowPracticeMode(true);
    }
  };

  const handleNext = async () => {
    const tutorial = TUTORIAL_DATA[activeTutorial];
    if (currentStep < tutorial.content.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial completed - บันทึกลงฐานข้อมูลก่อน
      const success = await markTutorialComplete(activeTutorial);
      
      if (success) {
        // รอให้ state อัพเดทก่อนเปิด practice mode
        setTimeout(() => {
          initializePracticeMode(activeTutorial);
          setShowGameInterface(false);
          setShowPracticeMode(true);
        }, 100);
      } else {
        // ถ้าบันทึกไม่สำเร็จ แต่ก็ให้เข้า practice mode ได้
        initializePracticeMode(activeTutorial);
        setShowGameInterface(false);
        setShowPracticeMode(true);
      }
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
    setSelectedStock("");
  };

  const handleStartGame = () => {
    navigate("/invest");
  };

  // Practice mode functions
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
          } else {
            alert("Insufficient pocket money!");
          }
        } else if (action === 'withdraw') {
          if (amount <= practiceData.savingsBalance) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket + amount,
              savingsBalance: prev.savingsBalance - amount
            }));
          } else {
            alert("Insufficient savings balance!");
          }
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
          } else {
            alert("Insufficient pocket money!");
          }
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
          } else {
            alert("Insufficient pocket money!");
          }
        } else if (action === 'sell') {
          if (amount <= practiceData.fundBalance) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket + amount,
              fundBalance: prev.fundBalance - amount,
              shares: prev.shares - shares
            }));
          } else {
            alert("Insufficient fund balance!");
          }
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
          } else {
            alert("Insufficient pocket money!");
          }
        } else if (action === 'sell') {
          if (amount <= practiceData.goldBalance) {
            setPracticeData(prev => ({
              ...prev,
              pocket: prev.pocket + amount,
              goldBalance: prev.goldBalance - amount
            }));
          } else {
            alert("Insufficient gold balance!");
          }
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
      } else {
        alert("Insufficient pocket money!");
      }
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
      } else {
        alert("Insufficient shares!");
      }
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
      } else {
        alert("Insufficient pocket money!");
      }
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
      } else {
        alert("Insufficient units!");
      }
    }
  };

  const isInvestmentBeingTutored = (type) => {
    return activeTutorial === type;
  };

  const allTutorialsCompleted = completedTutorials.size === Object.keys(TUTORIAL_TYPES).length;

  // แสดง loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#011D10] text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-jersey text-[#B7FD5E] mb-4">Loading Tutorial...</div>
          <div className="animate-spin w-12 h-12 border-4 border-[#B7FD5E] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Render practice mode
  if (showPracticeMode) {
    const config = TUTORIAL_DATA[activeTutorial].practiceConfig;
    
    return (
      <div className="min-h-screen bg-[#011D10] text-white font-mono p-6">
        {/* Header */}
        <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-8">
          <h1 className="text-5xl font-jersey text-[#B7FD5E] mx-8">
            PRACTICE: {TUTORIAL_DATA[activeTutorial].title}
          </h1>
          <nav className="flex gap-10 text-3xl font-jersey mr-3">
            <button
              onClick={handleCloseTutorial}
              className="text-[#B7FD5E] hover:text-white transition"
            >
              Back to Tutorials
            </button>
          </nav>
        </header>

        {/* Practice Info */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-jersey text-white mb-4">
            Practice Mode - Try the buttons and see how it works!
          </h2>
          <p className="text-2xl font-jersey text-[#B7FD5E]">
            Pocket Money: {practiceData.pocket?.toFixed(2)} $
          </p>
        </div>

        {/* Practice Interface */}
        <div className="max-w-4xl mx-auto">
          {config.type === 'savings' && (
            <div className="border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">SAVINGS ACCOUNT PRACTICE</h3>
              <div className="flex justify-center mb-4">
                <img src={saving} alt="saving icon" className="w-[120px] h-[120px]" />
              </div>
              <p className="text-2xl font-jersey text-white mb-2">
                Savings Balance: {practiceData.savingsBalance?.toFixed(2)} $
              </p>
              <p className="text-lg font-jersey text-green-400 mb-6">
                Interest Rate: {((practiceData.interestRate || 0) * 100).toFixed(1)}% per month
              </p>
              
              <div className="flex justify-center items-center gap-4 mb-6">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={practiceAmount}
                  onChange={(e) => setPracticeAmount(e.target.value)}
                  className="px-4 py-2 rounded border text-black text-xl font-jersey w-48"
                />
              </div>
              
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => handlePracticeTransaction('deposit')}
                  className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                >
                  DEPOSIT
                </button>
                <button
                  onClick={() => handlePracticeTransaction('withdraw')}
                  className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                >
                  WITHDRAW
                </button>
              </div>
            </div>
          )}

          {config.type === 'bonds' && (
            <div className="border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">GOVERNMENT BONDS PRACTICE</h3>
              <p className="text-2xl font-jersey text-white mb-6">
                Active Bonds: {practiceData.bondInvestments?.length || 0}
              </p>
              
              {/* Bond Selection */}
              <div className="flex justify-center gap-4 mb-6">
                {Object.entries(practiceData.bondRates || {}).map(([duration, rate]) => (
                  <div
                    key={duration}
                    onClick={() => setSelectedBond(duration)}
                    className={`cursor-pointer p-4 rounded border-2 transition-colors ${
                      selectedBond === duration 
                        ? "border-[#B7FD5E] bg-[#B7FD5E] text-black" 
                        : "border-white text-white hover:border-[#B7FD5E]"
                    }`}
                  >
                    <div className="text-lg font-jersey">{duration}</div>
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
                  className="px-4 py-2 rounded border text-black text-xl font-jersey w-48"
                />
                <button
                  onClick={() => handlePracticeTransaction('buy')}
                  disabled={!selectedBond}
                  className={`text-xl font-jersey px-8 py-3 rounded transition-colors ${
                    selectedBond 
                      ? "bg-[#11942F] text-white hover:bg-[#B7FD5E] hover:text-black" 
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  BUY BOND
                </button>
              </div>
              
              {/* Show active bonds */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(practiceData.bondInvestments || []).map((bond) => (
                  <div key={bond.id} className="border border-white p-4 rounded">
                    <div className="text-lg font-jersey text-white">{bond.duration}</div>
                    <div className="text-sm text-[#B7FD5E]">${bond.amount.toFixed(2)}</div>
                    <div className="text-sm text-green-400">{(bond.rate * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.type === 'indexFund' && (
            <div className="border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">INDEX FUND PRACTICE</h3>
              <div className="flex justify-center mb-4">
                <img src={index} alt="index icon" className="w-[120px] h-[120px]" />
              </div>
              <div className="flex justify-center gap-8 mb-4">
                <p className="text-xl font-jersey text-white">
                  Price: {practiceData.price?.toFixed(2)}
                </p>
                <p className={`text-xl font-jersey ${practiceData.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {practiceData.priceChange >= 0 ? "▲" : "▼"} {Math.abs(practiceData.priceChange || 0).toFixed(1)}%
                </p>
              </div>
              <p className="text-2xl font-jersey text-white mb-2">
                Fund Balance: {practiceData.fundBalance?.toFixed(2)} $
              </p>
              <p className="text-lg font-jersey text-[#B7FD5E] mb-6">
                Shares: {practiceData.shares?.toFixed(4) || 0}
              </p>
              
              <div className="flex justify-center items-center gap-4 mb-6">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={practiceAmount}
                  onChange={(e) => setPracticeAmount(e.target.value)}
                  className="px-4 py-2 rounded border text-black text-xl font-jersey w-48"
                />
              </div>
              
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => handlePracticeTransaction('buy')}
                  className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                >
                  BUY
                </button>
                <button
                  onClick={() => handlePracticeTransaction('sell')}
                  className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                >
                  SELL
                </button>
              </div>
            </div>
          )}

          {config.type === 'stocks' && (
            <div className="border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">INDIVIDUAL STOCKS PRACTICE</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.mockStocks.map((stock) => (
                  <div key={stock.symbol} className="border border-white p-4 rounded">
                    <h4 className="text-2xl font-jersey text-white mb-2">{stock.symbol}</h4>
                    <div className="flex justify-between mb-2">
                      <span className="text-lg font-jersey text-white">${stock.price.toFixed(2)}</span>
                      <span className={`text-lg font-jersey ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.change).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-md font-jersey text-[#B7FD5E] mb-4">
                      Owned: {practiceData.stocks?.[stock.symbol]?.shares || 0} shares
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="number"
                        placeholder="Shares"
                        value={practiceAmount}
                        onChange={(e) => setPracticeAmount(e.target.value)}
                        className="px-2 py-1 rounded border text-black font-jersey w-20"
                      />
                      <span className="text-white font-jersey">shares</span>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => handleStockTransaction(stock.symbol, 'buy', stock.price)}
                        className="bg-[#11942F] text-white font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => handleStockTransaction(stock.symbol, 'sell', stock.price)}
                        className="bg-[#11942F] text-white font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.type === 'gold' && (
            <div className="border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">GOLD INVESTMENT PRACTICE</h3>
              <div className="flex justify-center mb-4">
                <img src={gold} alt="gold icon" className="w-[120px] h-[120px]" />
              </div>
              <div className="flex justify-center gap-8 mb-4">
                <p className="text-xl font-jersey text-white">
                  Price: ${practiceData.goldPrice?.toFixed(2)}
                </p>
                <p className={`text-xl font-jersey ${practiceData.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {practiceData.priceChange >= 0 ? "▲" : "▼"} {Math.abs(practiceData.priceChange || 0).toFixed(1)}%
                </p>
              </div>
              <p className="text-2xl font-jersey text-white mb-6">
                Gold Balance: {practiceData.goldBalance?.toFixed(2)} $
              </p>
              
              <div className="flex justify-center items-center gap-4 mb-6">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={practiceAmount}
                  onChange={(e) => setPracticeAmount(e.target.value)}
                  className="px-4 py-2 rounded border text-black text-xl font-jersey w-48"
                />
              </div>
              
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => handlePracticeTransaction('buy')}
                  className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                >
                  BUY
                </button>
                <button
                  onClick={() => handlePracticeTransaction('sell')}
                  className="bg-[#11942F] text-white text-xl font-jersey px-8 py-3 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                >
                  SELL
                </button>
              </div>
            </div>
          )}

          {config.type === 'currency' && (
            <div className="border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] p-8 text-center">
              <h3 className="text-3xl font-jersey mb-4 text-white">CURRENCY EXCHANGE PRACTICE</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.currencies.map((currency) => (
                  <div key={currency.symbol} className="border border-white p-4 rounded">
                    <h4 className="text-2xl font-jersey text-white mb-2">{currency.symbol}</h4>
                    <div className="flex justify-between mb-2">
                      <span className="text-lg font-jersey text-white">${currency.price.toFixed(2)}</span>
                      <span className={`text-lg font-jersey ${currency.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {currency.change >= 0 ? "▲" : "▼"} {Math.abs(currency.change).toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-md font-jersey text-[#B7FD5E] mb-4">
                      Owned: {practiceData.currencies?.[currency.symbol]?.units || 0} units
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="number"
                        placeholder="Units"
                        value={practiceAmount}
                        onChange={(e) => setPracticeAmount(e.target.value)}
                        className="px-2 py-1 rounded border text-black font-jersey w-20"
                      />
                      <span className="text-white font-jersey">units</span>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => handleCurrencyTransaction(currency.symbol, 'buy', currency.price)}
                        className="bg-[#11942F] text-white font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => handleCurrencyTransaction(currency.symbol, 'sell', currency.price)}
                        className="bg-[#11942F] text-white font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Practice Mode Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-[#001a0a] border-2 border-[#B7FD5E] rounded p-6 max-w-2xl mx-auto">
            <h4 className="text-[#B7FD5E] mb-4 text-xl font-jersey">📚 Practice Instructions</h4>
            <p className="text-white font-jersey">
              This is a safe practice environment! Try different amounts and see how the transactions work. 
              Your practice data won't affect the real game, so experiment freely!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#011D10] text-white font-mono p-6">
      {/* Header */}
      <header className="flex justify-between items-center border-b-4 border-[#ffffff] mb-8">
        <h1 className="text-5xl font-jersey text-[#B7FD5E] mx-8">
          INVESTMENT TUTORIAL
        </h1>
        <nav className="flex gap-10 text-3xl font-jersey mr-3">
          <button
            onClick={() => navigate("/")}
            className="text-[#B7FD5E] hover:text-white transition"
          >
            Home
          </button>
          {allTutorialsCompleted && (
            <button
              onClick={handleStartGame}
              className="text-[#B7FD5E] hover:text-white transition bg-[#11942F] px-4 py-2 rounded"
            >
              Start Game
            </button>
          )}
        </nav>
      </header>

      {/* Progress Indicator */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-jersey text-white mb-4">
          Progress: {completedTutorials.size} / {Object.keys(TUTORIAL_TYPES).length} Completed
        </h2>
        <div className="flex justify-center gap-2">
          {Object.keys(TUTORIAL_TYPES).map((_, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full border-2 ${
                index < completedTutorials.size
                  ? "bg-[#B7FD5E] border-[#B7FD5E]"
                  : "bg-transparent border-gray-500"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Tutorial Cards Grid */}
      {!activeTutorial && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {Object.entries(TUTORIAL_DATA).map(([type, data]) => {
            const isCompleted = completedTutorials.has(type);
            const isAvailable = completedTutorials.size === 0 || !isCompleted;

            return (
              <div
                key={type}
                className={`relative p-6 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] transition-all duration-300 ${
                  isCompleted 
                    ? "opacity-100 cursor-default" 
                    : isAvailable 
                      ? "opacity-100 cursor-pointer hover:scale-105" 
                      : "opacity-32 cursor-not-allowed"
                }`}
                onClick={() => isAvailable && !isCompleted && handleTutorialSelect(type)}
              >
                {/* Completed Checkmark */}
                {isCompleted && (
                  <div className="absolute top-2 right-2 w-8 h-8 bg-[#B7FD5E] rounded-full flex items-center justify-center">
                    <span className="text-black text-xl font-bold">✓</span>
                  </div>
                )}

                {/* Lock Icon for Unavailable */}
                {!isAvailable && !isCompleted && (
                  <div className="absolute top-2 right-2 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🔒</span>
                  </div>
                )}

                <h3 className="text-2xl font-jersey mb-4 text-[#B7FD5E]">
                  {data.title}
                </h3>

                {data.icon && (
                  <div className="flex justify-center mb-4">
                    <img src={data.icon} alt={data.title} className="w-20 h-20" />
                  </div>
                )}

                <p className="text-lg font-jersey text-white mb-4">
                  {data.description}
                </p>

                {isCompleted ? (
                  <div className="bg-[#11942F] text-[#B7FD5E] px-4 py-2 rounded font-jersey">
                    COMPLETED
                  </div>
                ) : isAvailable ? (
                  <div className="bg-[#11942F] text-white px-4 py-2 rounded font-jersey hover:bg-[#B7FD5E] hover:text-black transition-colors">
                    START TUTORIAL
                  </div>
                ) : (
                  <div className="bg-gray-600 text-gray-400 px-4 py-2 rounded font-jersey">
                    COMPLETE OTHER TUTORIALS FIRST
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Tutorial Modal */}
      {activeTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-[#001a0a] border-4 border-[#00FF00] rounded-lg p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-4xl font-jersey text-[#B7FD5E]">
                {TUTORIAL_DATA[activeTutorial].title}
              </h2>
              <button
                onClick={handleCloseTutorial}
                className="text-white text-2xl hover:text-red-400"
              >
                ✕
              </button>
            </div>

            {/* Tutorial Icon */}
            {TUTORIAL_DATA[activeTutorial].icon && (
              <div className="flex justify-center mb-6">
                <img 
                  src={TUTORIAL_DATA[activeTutorial].icon} 
                  alt={TUTORIAL_DATA[activeTutorial].title} 
                  className="w-24 h-24" 
                />
              </div>
            )}

            {/* Tutorial Content */}
            <div className="mb-8">
              <p className="text-xl font-jersey text-white leading-relaxed">
                {TUTORIAL_DATA[activeTutorial].content[currentStep]}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {TUTORIAL_DATA[activeTutorial].content.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep ? "bg-[#B7FD5E]" : "bg-gray-600"
                  }`}
                ></div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`text-xl font-jersey px-6 py-2 rounded transition-colors ${
                  currentStep === 0
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:text-[#B7FD5E]"
                }`}
              >
                ← Previous
              </button>

              <button
                onClick={handleNext}
                className="bg-[#11942F] text-white text-xl font-jersey px-6 py-2 rounded hover:bg-[#B7FD5E] hover:text-black transition-colors"
              >
                {currentStep === TUTORIAL_DATA[activeTutorial].content.length - 1 
                  ? "Complete Tutorial" 
                  : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Instructions */}
      {!activeTutorial && (
        <div className="mt-12 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl font-jersey text-[#B7FD5E] mb-4">
            How the Tutorial Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg font-jersey text-white">
            <div className="bg-[#001a0a] border-2 border-[#B7FD5E] rounded p-4">
              <h4 className="text-[#B7FD5E] mb-2">🎯 Choose Your Path</h4>
              <p>You can complete tutorials in any order you prefer. Each tutorial teaches a different investment strategy.</p>
            </div>
            <div className="bg-[#001a0a] border-2 border-[#B7FD5E] rounded p-4">
              <h4 className="text-[#B7FD5E] mb-2">📈 Learn & Practice</h4>
              <p>Each tutorial covers risk levels, expected returns, and best practices for that investment type.</p>
            </div>
            <div className="bg-[#001a0a] border-2 border-[#B7FD5E] rounded p-4">
              <h4 className="text-[#B7FD5E] mb-2">✅ Track Progress</h4>
              <p>Completed tutorials unlock full access to those investment options in the main game.</p>
            </div>
            <div className="bg-[#001a0a] border-2 border-[#B7FD5E] rounded p-4">
              <h4 className="text-[#B7FD5E] mb-2">🚀 Start Playing</h4>
              <p>Complete all 6 tutorials to unlock the full investment game experience!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
