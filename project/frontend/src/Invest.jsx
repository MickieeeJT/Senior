import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import saving from "./assets/Saving.png";
import index from "./assets/Index.png";
import gold from "./assets/Gold.png";

export default function Invest() {
  const [balance, setBalance] = useState(1234567.8);
  const [currentYear, setCurrentYear] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const [showExitModal, setShowExitModal] = useState(false);

  const [activeInput, setActiveInput] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedBond, setSelectedBond] = useState("");
  const [selectedOption, setSelectedOption] = useState({});

  // Dynamic stocks and currency data
  const [stocks, setStocks] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Dynamic profit state
  const [profit, setProfit] = useState({
    savings: 0,
    bonds: 0,
    index: 0,
    stocks: {},
    gold: 0,
    currency: {},
  });

  // Holdings state
  const [holdings, setHoldings] = useState({
    stocks: {},
    currency: {},
  });

  const navigate = useNavigate();
  const options = ["1", "10", "25", "MAX"];

  // Fetch stocks data from backend
  useEffect(() => {
    fetchStocks();
    fetchCurrencies();
  }, []);

  const fetchStocks = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch("/api/stocks");
      const data = await response.json();
      setStocks(data);

      // Initialize profit and holdings for stocks
      const stockProfit = {};
      const stockHoldings = {};
      data.forEach((stock) => {
        stockProfit[stock.id] = 0;
        stockHoldings[stock.id] = { shares: 0, avgPrice: 0 };
      });
      setProfit((prev) => ({ ...prev, stocks: stockProfit }));
      setHoldings((prev) => ({ ...prev, stocks: stockHoldings }));
    } catch (error) {
      console.error("Error fetching stocks:", error);
      // Fallback dummy data if API fails
      const dummyStocks = [
        {
          id: "STOCK1",
          symbol: "AAPL",
          price: 175.5,
          change: 2.25,
          changePercent: 1.3,
        },
        {
          id: "STOCK2",
          symbol: "GOOGL",
          price: 142.3,
          change: -1.5,
          changePercent: -1.04,
        },
        {
          id: "STOCK3",
          symbol: "MSFT",
          price: 378.9,
          change: 5.75,
          changePercent: 1.54,
        },
        {
          id: "STOCK4",
          symbol: "TSLA",
          price: 242.15,
          change: 8.4,
          changePercent: 3.59,
        },
      ];
      setStocks(dummyStocks);

      const stockProfit = {};
      const stockHoldings = {};
      dummyStocks.forEach((stock) => {
        stockProfit[stock.id] = 0;
        stockHoldings[stock.id] = { shares: 0, avgPrice: 0 };
      });
      setProfit((prev) => ({ ...prev, stocks: stockProfit }));
      setHoldings((prev) => ({ ...prev, stocks: stockHoldings }));
    }
  };

  const fetchCurrencies = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch("/api/currencies");
      const data = await response.json();
      setCurrencies(data);

      // Initialize profit and holdings for currencies
      const currencyProfit = {};
      const currencyHoldings = {};
      data.forEach((currency) => {
        currencyProfit[currency.code] = 0;
        currencyHoldings[currency.code] = { amount: 0, avgRate: 0 };
      });
      setProfit((prev) => ({ ...prev, currency: currencyProfit }));
      setHoldings((prev) => ({ ...prev, currency: currencyHoldings }));
    } catch (error) {
      console.error("Error fetching currencies:", error);
      // Fallback dummy data if API fails
      const dummyCurrencies = [
        {
          code: "USD",
          rate: 1.0,
          change: 0.0,
          changePercent: 0.0,
        },
        {
          code: "EUR",
          rate: 0.92,
          change: -0.01,
          changePercent: -1.08,
        },
        {
          code: "JPY",
          rate: 149.85,
          change: 1.25,
          changePercent: 0.84,
        },
      ];
      setCurrencies(dummyCurrencies);

      const currencyProfit = {};
      const currencyHoldings = {};
      dummyCurrencies.forEach((currency) => {
        currencyProfit[currency.code] = 0;
        currencyHoldings[currency.code] = { amount: 0, avgRate: 0 };
      });
      setProfit((prev) => ({ ...prev, currency: currencyProfit }));
      setHoldings((prev) => ({ ...prev, currency: currencyHoldings }));
    }
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigate(-1);
  };

  const toggleInput = (type) => {
    setActiveInput((prev) => (prev === type ? null : type));
    setSelectedBond("");
    setAmount("");
  };

  const calculateAmount = (optionType, price, itemId) => {
    if (optionType === "MAX") {
      return balance;
    }
    const percentage = parseInt(optionType);
    return (balance * percentage) / 100;
  };

  const handleStockTransaction = async (stockId, action) => {
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) return;

    const selectedOpt = selectedOption[stockId];
    let transactionAmount = parseFloat(amount);

    if (selectedOpt && selectedOpt !== "custom") {
      transactionAmount = calculateAmount(selectedOpt, stock.price, stockId);
    }

    if (!transactionAmount || transactionAmount <= 0) return;

    const shares = Math.floor(transactionAmount / stock.price);
    const totalCost = shares * stock.price;

    if (action === "buy") {
      if (totalCost > balance) {
        alert("Insufficient balance!");
        return;
      }

      try {
        // Send transaction to backend
        await fetch("/api/stocks/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stockId: stock.id,
            shares,
            price: stock.price,
            totalCost,
          }),
        });

        setBalance((prev) => prev - totalCost);
        setHoldings((prev) => ({
          ...prev,
          stocks: {
            ...prev.stocks,
            [stockId]: {
              shares: prev.stocks[stockId].shares + shares,
              avgPrice:
                (prev.stocks[stockId].shares * prev.stocks[stockId].avgPrice +
                  totalCost) /
                (prev.stocks[stockId].shares + shares),
            },
          },
        }));
      } catch (error) {
        console.error("Error buying stock:", error);
      }
    } else if (action === "sell") {
      const ownedShares = holdings.stocks[stockId]?.shares || 0;
      const sharesToSell = Math.min(shares, ownedShares);

      if (sharesToSell <= 0) {
        alert("You don't own any shares!");
        return;
      }

      const saleAmount = sharesToSell * stock.price;

      try {
        // Send transaction to backend
        await fetch("/api/stocks/sell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stockId: stock.id,
            shares: sharesToSell,
            price: stock.price,
            saleAmount,
          }),
        });

        setBalance((prev) => prev + saleAmount);
        setHoldings((prev) => ({
          ...prev,
          stocks: {
            ...prev.stocks,
            [stockId]: {
              ...prev.stocks[stockId],
              shares: prev.stocks[stockId].shares - sharesToSell,
            },
          },
        }));

        // Calculate profit
        const profitAmount =
          saleAmount - sharesToSell * holdings.stocks[stockId].avgPrice;
        setProfit((prev) => ({
          ...prev,
          stocks: {
            ...prev.stocks,
            [stockId]: prev.stocks[stockId] + profitAmount,
          },
        }));
      } catch (error) {
        console.error("Error selling stock:", error);
      }
    }

    setAmount("");
    setSelectedOption((prev) => ({ ...prev, [stockId]: null }));
  };

  const handleCurrencyTransaction = async (currencyCode, action) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    if (!currency) return;

    const selectedOpt = selectedOption[currencyCode];
    let transactionAmount = parseFloat(amount);

    if (selectedOpt && selectedOpt !== "custom") {
      transactionAmount = calculateAmount(
        selectedOpt,
        currency.rate,
        currencyCode
      );
    }

    if (!transactionAmount || transactionAmount <= 0) return;

    if (action === "buy") {
      if (transactionAmount > balance) {
        alert("Insufficient balance!");
        return;
      }

      const currencyAmount = transactionAmount / currency.rate;

      try {
        // Send transaction to backend
        await fetch("/api/currency/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currencyCode: currency.code,
            amount: currencyAmount,
            rate: currency.rate,
            totalCost: transactionAmount,
          }),
        });

        setBalance((prev) => prev - transactionAmount);
        setHoldings((prev) => ({
          ...prev,
          currency: {
            ...prev.currency,
            [currencyCode]: {
              amount: prev.currency[currencyCode].amount + currencyAmount,
              avgRate:
                (prev.currency[currencyCode].amount *
                  prev.currency[currencyCode].avgRate +
                  transactionAmount) /
                (prev.currency[currencyCode].amount + currencyAmount),
            },
          },
        }));
      } catch (error) {
        console.error("Error buying currency:", error);
      }
    } else if (action === "sell") {
      const ownedAmount = holdings.currency[currencyCode]?.amount || 0;
      const amountToSell = Math.min(
        transactionAmount / currency.rate,
        ownedAmount
      );

      if (amountToSell <= 0) {
        alert("You don't own this currency!");
        return;
      }

      const saleAmount = amountToSell * currency.rate;

      try {
        // Send transaction to backend
        await fetch("/api/currency/sell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currencyCode: currency.code,
            amount: amountToSell,
            rate: currency.rate,
            saleAmount,
          }),
        });

        setBalance((prev) => prev + saleAmount);
        setHoldings((prev) => ({
          ...prev,
          currency: {
            ...prev.currency,
            [currencyCode]: {
              ...prev.currency[currencyCode],
              amount: prev.currency[currencyCode].amount - amountToSell,
            },
          },
        }));

        // Calculate profit
        const profitAmount =
          saleAmount - amountToSell * holdings.currency[currencyCode].avgRate;
        setProfit((prev) => ({
          ...prev,
          currency: {
            ...prev.currency,
            [currencyCode]: prev.currency[currencyCode] + profitAmount,
          },
        }));
      } catch (error) {
        console.error("Error selling currency:", error);
      }
    }

    setAmount("");
    setSelectedOption((prev) => ({ ...prev, [currencyCode]: null }));
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

  const timerRef = useRef(null);

  useEffect(() => {
  if (!isRunning) return;
  if (timerRef.current) return; // prevent duplicate intervals

  const duration = 60000; // 60 seconds per year
  const steps = 100;
  const interval = duration / steps;

  timerRef.current = setInterval(() => {
    setProgress((prev) => {
      if (prev >= 100) {
        setProgress(0);
        setCurrentMonth(0);

        setCurrentYear((y) => {
          if (y >= 20) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsRunning(false);
            return y;
          }
          return y + 1;
        });

        return 0;
      }

      const newProgress = prev + 1;
      setCurrentMonth(newProgress / 8.33);
      return newProgress;
    });
  }, interval);

  // Cleanup
  return () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };
}, [isRunning]);



  return (
    <div className="min-h-screen bg-[#011D10] text-[#494a48] font-mono flex flex-col p-6">
      {/* Header */}
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

      {/* Portfolio Overview */}
      <div className="flex mx-10 justify-between items-center mt-1">
        <div className="flex text-center">
          <h2 className="text-4xl font-jersey text-white mb-1">
            PORTFOLIO OVERVIEW :
          </h2>
          <p className="text-4xl font-jersey text-[#B7FD5E] px-8">
            {balance.toLocaleString()} $
          </p>
        </div>

        <div className="self-center mb-3 pt-1 w-1/4">
          <p className="text-3xl font-jersey text-white mb-1 text-center">
            YEAR {currentYear} OF 20
          </p>

          <div className="relative h-4 w-full bg-white border border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F] overflow-hidden">
            <div
              className="h-full bg-[#85ba3f] transition-all duration-500"
              style={{ width: `${progress}%` }}
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
              className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
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

        {/* Stocks */}
        <div className="col-span-3 bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-center text-3xl font-jersey mb-1 text-white">
            INDIVIDUAL STOCKS
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="border-2 border-dashed border-white p-4 text-center rounded"
              >
                <p className="text-white text-2xl font-jersey">
                  {stock.symbol}
                </p>
                <div className="flex justify-between px-5">
                  <p className="text-white text-xl font-jersey">
                    {stock.price.toFixed(2)} $
                  </p>
                  <p
                    className={`text-xl font-jersey ${
                      stock.changePercent >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stock.changePercent >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(stock.changePercent).toFixed(2)}%
                  </p>
                </div>
                <p className="text-white text-xl font-jersey">
                  Profit: {(profit.stocks[stock.id] || 0).toLocaleString()} $
                </p>
                <p className="text-white text-xl font-jersey">
                  Shares: {holdings.stocks[stock.id]?.shares || 0}
                </p>
                <div className="flex justify-center gap-4 mt-2">
                  <button
                    onClick={() => handleStockTransaction(stock.id, "sell")}
                    className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                  >
                    SELL
                  </button>
                  <button
                    onClick={() => handleStockTransaction(stock.id, "buy")}
                    className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                  >
                    BUY
                  </button>
                </div>
                <div className="px-8 mt-1 flex justify-between">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setSelectedOption((prev) => ({
                          ...prev,
                          [stock.id]: option,
                        }))
                      }
                      className={`text-xl font-jersey transition-all duration-200 ${
                        selectedOption[stock.id] === option
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
          <h3 className="text-3xl font-jersey mb-1 text-white">GOLD</h3>
          <div className="flex justify-center">
            <img src={gold} alt="gold icon" className="w-[90px] h-[90px]" />
          </div>
          <p className="text-white text-2xl font-jersey">
            Profit: {profit.gold.toLocaleString()} $
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
                  {activeInput.includes("buy") ? "BUY" : "SELL"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Currency */}
        <div className="col-span-2 bg-[#001a0a] p-1 text-center border-t-[4px] border-t-[#5EBD50] border-l-[4px] border-l-[#5EBD50] border-b-[4px] border-b-[#11942F] border-r-[4px] border-r-[#11942F]">
          <h3 className="text-3xl font-jersey mb-1 text-white">
            CURRENCY EXCHANGE
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {currencies.map((currency) => (
              <div
                key={currency.code}
                className="border-2 border-dashed border-white p-3 rounded"
              >
                <p className="text-white text-2xl font-jersey">
                  {currency.code}
                </p>
                <div className="flex justify-between px-5">
                  <p className="text-white text-xl font-jersey">
                    {currency.rate.toFixed(2)} $
                  </p>
                  <p
                    className={`text-xl font-jersey ${
                      currency.changePercent >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {currency.changePercent >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(currency.changePercent).toFixed(2)}%
                  </p>
                </div>
                <p className="text-white text-xl font-jersey">
                  Profit:{" "}
                  {(profit.currency[currency.code] || 0).toLocaleString()} $
                </p>
                <p className="text-white text-xl font-jersey">
                  Amount:{" "}
                  {(holdings.currency[currency.code]?.amount || 0).toFixed(2)}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      handleCurrencyTransaction(currency.code, "sell")
                    }
                    className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                  >
                    SELL
                  </button>
                  <button
                    onClick={() =>
                      handleCurrencyTransaction(currency.code, "buy")
                    }
                    className="bg-[#11942F] text-white text-xl font-jersey px-4 py-2 rounded hover:bg-[#B7FD5E]"
                  >
                    BUY
                  </button>
                </div>
                <div className="px-8 mt-1 flex justify-between">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setSelectedOption((prev) => ({
                          ...prev,
                          [currency.code]: option,
                        }))
                      }
                      className={`text-xl font-jersey transition-all duration-200 ${
                        selectedOption[currency.code] === option
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
