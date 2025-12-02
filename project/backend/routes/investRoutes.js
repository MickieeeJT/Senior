import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js"; // Import Auth
import db from "../config/db.js"; // Import your DB connection

const router = express.Router();
const gameSessions = new Map();

// --- MATH HELPERS ---

// Calculate Total Return Percentage (Profit / Total Cash Put In)
const calculateTotalReturn = (totalInvested, finalValue) => {
  if (totalInvested <= 0) return 0;
  return (finalValue - totalInvested) / totalInvested;
};

// Calculate Standard Deviation (Volatility)
const calculateVolatility = (history) => {
  if (history.length < 2) return 0;

  // Calculate year-over-year returns
  const returns = [];
  for (let i = 1; i < history.length; i++) {
    const r = (history[i] - history[i - 1]) / history[i - 1];
    returns.push(r);
  }

  // Calculate Mean Return
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;

  // Calculate Variance
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
};

// Calculate Max Drawdown (Risk)
const calculateMaxDrawdown = (history) => {
  let peak = history[0];
  let maxDrawdown = 0;

  for (const value of history) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (value - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  return maxDrawdown;
};

// --- BOT SIMULATION ENGINE ---
const simulateBot = (indexPrices) => {
  // Bot Strategy: "The Disciplined DCA"
  let bondBalance = 0;
  let indexShares = 0;
  
  const monthlyBondRate = 0.07 / 12; // 7% Annual Return for Bot Bonds
  const initialCash = 4000;
  const income = 4000;

  // Month 0: Initial Investment
  const startPrice = indexPrices[0] || 100; // Fallback to 100 if missing
  bondBalance += initialCash * 0.5;
  indexShares += (initialCash * 0.5) / startPrice;

  // Simulation Loop (20 Years = 240 Months)
  const totalSteps = indexPrices.length; 
  let priceIndex = 1; // Start looking for Month 6 (index 1)

  for (let m = 1; m <= 240; m++) {
    // 1. Grow Bonds (Compound Interest)
    bondBalance *= (1 + monthlyBondRate);

    // 2. Income Event (Every 6 months)
    if (m % 6 === 0) {
      // Add Cash to Assets
      bondBalance += income * 0.5;

      // Buy Stocks if we have price data
      if (priceIndex < totalSteps) {
        const currentPrice = indexPrices[priceIndex];
        indexShares += (income * 0.5) / currentPrice;
        priceIndex++;
      }
    }
  }

  // Calculate Final Value
  const finalPrice = indexPrices[indexPrices.length - 1] || startPrice;
  const totalIndexValue = indexShares * finalPrice;
  
  return bondBalance + totalIndexValue;
};

// --- GAME ROUTES ---

// Initialize a new game session
router.post("/init", (req, res) => {
  const sessionId = Date.now().toString();

  // [FIXED] Bond Logic: Ensure longer duration always yields higher return
  // Base rate between 3% and 5%
  const baseRate = 0.03 + Math.random() * 0.02;
  
  const bondInterestRates = {
    "1 year": baseRate,
    "5 years": baseRate + 0.015 + (Math.random() * 0.01), // Adds 1.5% - 2.5% on top
    "10 years": baseRate + 0.03 + (Math.random() * 0.015), // Adds 3.0% - 4.5% on top
  };

  const initialCapital = 4000; // Define starting money

  const gameState = {
    sessionId,
    pocket: initialCapital,
    // Track total money put into the game (starts with initial)
    totalInvested: initialCapital,
    portfolioHistory: [initialCapital], // Store Year 0 value
    savingsBalance: 0,
    currentYear: 1,
    currentMonth: 0,
    fundBalance: 0,
    goldBalance: 0,
    indexShares: 0,
    goldShares: 0,
    indexAvgPrice: 0,
    goldAvgPrice: 0,
    profit: {
      savings: 0,
      bonds: 0,
      index: 0,
      gold: 0,
    },
    holdings: {
      bonds: 0,
      index: 0,
      gold: 0,
      stocks: {},
      currencies: {} 
    },
    bondInvestments: [],
    bondInterestRates,
    lastProcessedMonth: 0,
  };

  gameSessions.set(sessionId, gameState);

  res.json({
    sessionId,
    gameState,
  });
});

// Get current game state
router.get("/state/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(gameState);
});

// Handle investment transactions
router.post("/transaction", (req, res) => {
  const { sessionId, action, amount, bondType, indexValue, goldValue } =
    req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // SAVINGS DEPOSIT
  if (action === "savings-deposit") {
    if (value > gameState.pocket) {
      return res.status(400).json({ error: "Insufficient pocket money" });
    }
    gameState.pocket -= value;
    gameState.savingsBalance += value;
  }

  // SAVINGS WITHDRAW
  else if (action === "savings-withdraw") {
    if (value > gameState.savingsBalance) {
      return res.status(400).json({ error: "Insufficient savings balance" });
    }
    gameState.savingsBalance -= value;
    gameState.pocket += value;
  }

  // BOND PURCHASE
  else if (action === "bond-buy") {
    if (!bondType) {
      return res.status(400).json({ error: "Bond type required" });
    }
    if (value > gameState.pocket) {
      return res.status(400).json({ error: "Insufficient pocket money" });
    }

    const bondDurationYears = {
      "1 year": 1,
      "5 years": 5,
      "10 years": 10,
    };

    const durationYears = bondDurationYears[bondType];
    const newBondInvestment = {
      id: Date.now(),
      duration: durationYears,
      amount: value,
      remaining: durationYears,
      bondType,
    };

    gameState.pocket -= value;
    gameState.bondInvestments.push(newBondInvestment);
    gameState.holdings.bonds += value;
  }

  // INDEX FUND BUY
  else if (action === "index-buy") {
    if (!indexValue) {
      return res.status(400).json({ error: "Index value required" });
    }
    if (value > gameState.pocket) {
      return res.status(400).json({ error: "Insufficient pocket money" });
    }

    const sharesBought = value / indexValue;
    gameState.pocket -= value;
    gameState.fundBalance += value;
    gameState.indexShares += sharesBought;

    // Update average purchase price
    const totalShares = gameState.indexShares;
    if (totalShares > 0) {
      gameState.indexAvgPrice =
        (gameState.indexAvgPrice * (totalShares - sharesBought) + value) /
        totalShares;
    } else {
      gameState.indexAvgPrice = indexValue;
    }

    gameState.holdings.index += value;
  }

  // INDEX FUND SELL
  else if (action === "index-sell") {
    if (!indexValue) {
      return res.status(400).json({ error: "Index value required" });
    }
    if (value > gameState.fundBalance) {
      return res.status(400).json({ error: "Insufficient fund balance" });
    }

    const sharesToSell = value / indexValue;
    const costBasis = sharesToSell * gameState.indexAvgPrice;
    const profitAmount = value - costBasis;

    gameState.indexShares = Math.max(0, gameState.indexShares - sharesToSell);
    gameState.fundBalance -= value;
    gameState.pocket += value;
    gameState.holdings.index = Math.max(
      0,
      gameState.holdings.index - costBasis
    );
    gameState.profit.index += profitAmount;
  }

  // GOLD BUY
  else if (action === "gold-buy") {
    if (!goldValue) {
      return res.status(400).json({ error: "Gold value required" });
    }
    if (value > gameState.pocket) {
      return res.status(400).json({ error: "Insufficient pocket money" });
    }

    const gramsBought = value / goldValue;
    gameState.pocket -= value;
    gameState.goldBalance += value;
    gameState.goldShares += gramsBought;

    // Update average purchase price
    const totalGrams = gameState.goldShares;
    if (totalGrams > 0) {
      gameState.goldAvgPrice =
        (gameState.goldAvgPrice * (totalGrams - gramsBought) + value) /
        totalGrams;
    } else {
      gameState.goldAvgPrice = goldValue;
    }

    gameState.holdings.gold += value;
  }

  // GOLD SELL
  else if (action === "gold-sell") {
    if (!goldValue) {
      return res.status(400).json({ error: "Gold value required" });
    }
    if (value > gameState.goldBalance) {
      return res.status(400).json({ error: "Insufficient gold balance" });
    }

    const gramsToSell = value / goldValue;
    const costBasis = gramsToSell * gameState.goldAvgPrice;
    const profitAmount = value - costBasis;

    gameState.goldShares = Math.max(0, gameState.goldShares - gramsToSell);
    gameState.goldBalance -= value;
    gameState.pocket += value;
    gameState.holdings.gold = Math.max(0, gameState.holdings.gold - costBasis);
    gameState.profit.gold += profitAmount;
  }

  gameSessions.set(sessionId, gameState);
  res.json({ success: true, gameState });
});

// Monthly update (called by frontend timer)
router.post("/monthly-update", (req, res) => {
  const { sessionId, month, indexData, goldData } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (month <= gameState.lastProcessedMonth) {
    return res.json({
      success: true,
      message: "Already processed",
      gameState,
    });
  }

  // Update savings interest (1.5% monthly)
  const monthlyRate = 0.015;
  const interest = gameState.savingsBalance * monthlyRate;
  gameState.savingsBalance += interest;
  gameState.profit.savings += interest;

  // Update index fund value
  if (indexData && gameState.indexShares > 0) {
    const changePercent = indexData.change / 100;
    gameState.fundBalance *= 1 + changePercent;
  }

  // Update gold value
  if (goldData && gameState.goldShares > 0) {
    const changePercent = goldData.change / 100;
    gameState.goldBalance *= 1 + changePercent;
  }

  // Half-year income
  if (month === 6 || month === 12) {
    gameState.pocket += 4000;
    // Increment totalInvested to accurately track how much cash entered the game
    gameState.totalInvested += 4000; 
  }

  gameState.lastProcessedMonth = month;
  gameSessions.set(sessionId, gameState);

  res.json({ success: true, gameState });
});

// Bond monthly update (triggered once per in-game month)
router.post("/bond-update", (req, res) => {
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const maturedBonds = [];

  gameState.bondInvestments = gameState.bondInvestments
    .map((inv) => {
      if (inv.remaining > 0) {
        const interestRate = gameState.bondInterestRates[inv.bondType];

        // 1 year = 12 months → convert yearly rate to monthly
        const monthlyRate = interestRate / 12;

        // Apply compound interest for one month
        const interest = inv.amount * monthlyRate;
        inv.amount += interest;
        gameState.profit.bonds += interest;

        // Decrease remaining time by 1 month (1/12 year)
        inv.remaining = Math.max(0, inv.remaining - 1 / 12);
      }

      // If bond matured → return to pocket
      if (inv.remaining <= 0) {
        const totalReturn = inv.amount;
        gameState.pocket += totalReturn;
        gameState.holdings.bonds = Math.max(
          0,
          gameState.holdings.bonds - inv.amount
        );

        maturedBonds.push({
          amount: totalReturn,
          duration: inv.duration,
          bondType: inv.bondType,
        });

        return null; // remove matured bond
      }

      return inv;
    })
    .filter(Boolean);

  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    gameState,
    maturedBonds,
  });
});

// Gold monthly update (triggered once per in-game month)
router.post("/gold-update", (req, res) => {
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Calculate gold profit based on current gold value vs purchase value
  if (gameState.goldShares > 0 && gameState.goldBalance > 0) {
    const goldProfit = gameState.goldBalance - gameState.holdings.gold;
    gameState.profit.gold = goldProfit;
  }

  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    gameState,
  });
});

// Bond early sell (manual collect with 10% penalty)
router.post("/bond-sell", (req, res) => {
  const { sessionId, bondId } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const bondIndex = gameState.bondInvestments.findIndex(
    (b) => b.id === bondId
  );
  if (bondIndex === -1) {
    return res.status(404).json({ error: "Bond not found" });
  }

  const bond = gameState.bondInvestments[bondIndex];

  // 💸 Apply 10% penalty
  const sellAmount = bond.amount * 0.9;

  // Add money to pocket
  gameState.pocket += sellAmount;

  // Adjust holdings
  gameState.holdings.bonds = Math.max(
    0,
    gameState.holdings.bonds - bond.amount
  );

  // Remove bond from active investments
  gameState.bondInvestments.splice(bondIndex, 1);

  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    sellAmount,
    gameState,
    message: `Bond sold early for ${sellAmount.toFixed(2)}$ (10% penalty applied)`,
  });
});

// STOCK BUY
router.post("/stock-buy", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const shares = parseInt(amount);
  const stockPrice = parseFloat(price);

  if (isNaN(shares) || shares <= 0) {
    return res.status(400).json({ error: "Invalid share amount" });
  }
  if (isNaN(stockPrice) || stockPrice <= 0) {
    return res.status(400).json({ error: "Invalid stock price" });
  }

  const totalCost = shares * stockPrice;
  if (totalCost > gameState.pocket) {
    return res.status(400).json({ error: "Insufficient pocket balance" });
  }

  // Deduct from pocket
  gameState.pocket -= totalCost;

  // Initialize holdings if not exist
  if (!gameState.holdings.stocks) gameState.holdings.stocks = {};
  if (!gameState.holdings.stocks[symbol]) {
    gameState.holdings.stocks[symbol] = {
      shares: 0,
      avgCost: 0,
    };
  }

  const holding = gameState.holdings.stocks[symbol];

  // Update average cost
  const totalShares = holding.shares + shares;
  holding.avgCost =
    totalShares === 0
      ? 0
      : (holding.shares * holding.avgCost + shares * stockPrice) / totalShares;

  holding.shares = totalShares;

  // Save updated game state
  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    message: `Bought ${shares} shares of ${symbol} at ${stockPrice.toFixed(2)}$`,
    updatedGameState: gameState,
  });
});

// STOCK SELL
router.post("/stock-sell", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const shares = parseInt(amount);
  const stockPrice = parseFloat(price);

  if (isNaN(shares) || shares <= 0) {
    return res.status(400).json({ error: "Invalid share amount" });
  }
  if (isNaN(stockPrice) || stockPrice <= 0) {
    return res.status(400).json({ error: "Invalid stock price" });
  }

  if (!gameState.holdings.stocks || !gameState.holdings.stocks[symbol]) {
    return res.status(400).json({ error: "You don't own this stock" });
  }

  const holding = gameState.holdings.stocks[symbol];

  if (shares > holding.shares) {
    return res.status(400).json({ error: "Not enough shares to sell" });
  }

  const totalSellValue = shares * stockPrice;
  const costBasis = shares * holding.avgCost;
  const profitAmount = totalSellValue - costBasis;

  // Update profit
  if (!gameState.profit.stocks) gameState.profit.stocks = {};
  if (!gameState.profit.stocks[symbol]) gameState.profit.stocks[symbol] = 0;
  gameState.profit.stocks[symbol] += profitAmount;

  // Add cash to pocket
  gameState.pocket += totalSellValue;

  // Reduce holdings
  holding.shares -= shares;

  // Remove stock if no shares left
  if (holding.shares <= 0) {
    delete gameState.holdings.stocks[symbol];
  }

  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    message: `Sold ${shares} shares of ${symbol} at ${stockPrice.toFixed(2)}$ (Profit: ${profitAmount.toFixed(2)}$)`,
    updatedGameState: gameState,
  });
});

// CURRENCY BUY
router.post("/currency-buy", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const units = parseInt(amount);
  const currencyPrice = parseFloat(price);

  if (isNaN(units) || units <= 0) {
    return res.status(400).json({ error: "Invalid currency amount" });
  }
  if (isNaN(currencyPrice) || currencyPrice <= 0) {
    return res.status(400).json({ error: "Invalid currency price" });
  }

  const totalCost = units * currencyPrice;
  if (totalCost > gameState.pocket) {
    return res.status(400).json({ error: "Insufficient pocket balance" });
  }

  // Deduct from pocket
  gameState.pocket -= totalCost;

  // Initialize holdings if not exist
  if (!gameState.holdings.currencies) gameState.holdings.currencies = {};
  if (!gameState.holdings.currencies[symbol]) {
    gameState.holdings.currencies[symbol] = {
      units: 0,
      avgCost: 0,
    };
  }

  const holding = gameState.holdings.currencies[symbol];

  // Update average cost
  const totalUnits = holding.units + units;
  holding.avgCost =
    totalUnits === 0
      ? 0
      : (holding.units * holding.avgCost + units * currencyPrice) / totalUnits;

  holding.units = totalUnits;

  // Save updated game state
  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    message: `Bought ${units} units of ${symbol} at ${currencyPrice.toFixed(2)}$`,
    updatedGameState: gameState,
  });
});

// CURRENCY SELL
router.post("/currency-sell", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  const units = parseInt(amount);
  const currencyPrice = parseFloat(price);

  if (isNaN(units) || units <= 0) {
    return res.status(400).json({ error: "Invalid currency amount" });
  }
  if (isNaN(currencyPrice) || currencyPrice <= 0) {
    return res.status(400).json({ error: "Invalid currency price" });
  }

  if (!gameState.holdings.currencies || !gameState.holdings.currencies[symbol]) {
    return res.status(400).json({ error: "You don't own this currency" });
  }

  const holding = gameState.holdings.currencies[symbol];

  if (units > holding.units) {
    return res.status(400).json({ error: "Not enough units to sell" });
  }

  const totalSellValue = units * currencyPrice;
  const costBasis = units * holding.avgCost;
  const profitAmount = totalSellValue - costBasis;

  // Update profit
  if (!gameState.profit.currencies) gameState.profit.currencies = {};
  if (!gameState.profit.currencies[symbol]) gameState.profit.currencies[symbol] = 0;
  gameState.profit.currencies[symbol] += profitAmount;

  // Add cash to pocket
  gameState.pocket += totalSellValue;

  // Reduce holdings
  holding.units -= units;

  // Remove currency if no units left
  if (holding.units <= 0) {
    delete gameState.holdings.currencies[symbol];
  }

  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    message: `Sold ${units} units of ${symbol} at ${currencyPrice.toFixed(2)}$ (Profit: ${profitAmount.toFixed(2)}$)`,
    updatedGameState: gameState,
  });
});

// Year increment
router.post("/year-increment", (req, res) => {
  const { sessionId, currentNetWorth } = req.body; // Frontend MUST send total value
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Record history for Volatility/Drawdown calculation
  // If frontend didn't send net worth, fallback to pocket (not ideal, but prevents crash)
  const val = currentNetWorth ? parseFloat(currentNetWorth) : gameState.pocket; 
  gameState.portfolioHistory.push(val);

  if (gameState.currentYear >= 20) {
    return res.json({
      success: true,
      gameComplete: true,
      gameState,
    });
  }

  gameState.currentYear += 1;
  gameState.lastProcessedMonth = 0;

  // [NEW] Decrease Bond Yields each year to encourage diversification
  // Rates drop by ~5% relative each year (e.g. 5.0% -> 4.75%)
  // We keep a floor of 0.5% so it doesn't hit zero.
  for (const key in gameState.bondInterestRates) {
    gameState.bondInterestRates[key] = Math.max(0.005, gameState.bondInterestRates[key] * 0.95);
  }

  gameSessions.set(sessionId, gameState);

  res.json({
    success: true,
    gameState,
  });
});

router.post("/apply-event", (req, res) => {
  const { sessionId, effect } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(400).json({ error: "Invalid session" });
  }

  const amount = effect.amount || 0;

  gameState.pocket += amount;
  if (gameState.pocket < 0) gameState.pocket = 0;

  gameSessions.set(sessionId, gameState);

  return res.json({
    message: "Event applied",
    gameState: gameState,
  });
});

router.post("/end-game", authenticateToken, (req, res) => {
  const userId = req.user.id;
  // [NEW] Receive 'botIndexHistory' from frontend
  const { sessionId, finalStockPrices, finalCurrencyPrices, botIndexHistory } = req.body;

  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  try {
    // --- 1. Calculate Final Net Worth ---
    let stockValue = 0;
    if (gameState.holdings.stocks) {
      for (const [symbol, holding] of Object.entries(gameState.holdings.stocks)) {
        const currentPrice = finalStockPrices[symbol] || 0;
        stockValue += currentPrice * holding.shares;
      }
    }

    let currencyValue = 0;
    if (gameState.holdings.currencies) {
      for (const [symbol, holding] of Object.entries(gameState.holdings.currencies)) {
        const currentPrice = finalCurrencyPrices[symbol] || 0;
        currencyValue += currentPrice * holding.units;
      }
    }

    const finalValue =
      gameState.pocket +
      gameState.savingsBalance +
      gameState.fundBalance +
      gameState.goldBalance +
      (gameState.holdings.bonds || 0) +
      stockValue +
      currencyValue;
    
    // Add final year to history for accurate calculations
    gameState.portfolioHistory.push(finalValue);

    console.log("\n====== END GAME ASSESSMENT DEBUG LOG ======");
    console.log("Total Invested (Cumulative Salary):", gameState.totalInvested);
    console.log("Final Portfolio Value:", finalValue.toFixed(2));
    
    // --- 2. RUN BOT SIMULATION ---
    let botScore = 0;
    if (botIndexHistory && Array.isArray(botIndexHistory)) {
      console.log("Running Bot Simulation using index history...");
      botScore = simulateBot(botIndexHistory);
    } else {
      console.log("No Bot history received, using fallback.");
      botScore = gameState.totalInvested * 1.6;
    }
    console.log("Bot Score:", botScore.toFixed(2));

    // --- 3. THE 5-STAR ASSESSMENT LOGIC ---
    
    const assessment = {
      stars: 0,
      details: []
    };

    // A. WEALTH STAR (Inflation Check)
    const inflationTarget = gameState.totalInvested * 1.3;
    const wealthStar = finalValue > inflationTarget;
    
    console.log(`\n[WEALTH STAR]`);
    console.log(`Target: > ${inflationTarget.toFixed(2)}`);
    console.log(`Actual: ${finalValue.toFixed(2)}`);

    if (wealthStar) {
      assessment.stars++;
      assessment.details.push({ id: "wealth", passed: true, msg: "Beat Inflation" });
    } else {
      assessment.details.push({ id: "wealth", passed: false, msg: "Lost purchasing power" });
    }

    // B. ROI STAR (Total Return %)
    // Target: > 50% Total Return
    const totalReturn = calculateTotalReturn(gameState.totalInvested, finalValue);
    const roiStar = totalReturn > 0.50; 

    console.log(`\n[ROI STAR]`);
    console.log(`Target: > 50% (0.50)`);
    console.log(`Actual: ${(totalReturn * 100).toFixed(2)}%`);

    if (roiStar) {
      assessment.stars++;
      assessment.details.push({ id: "roi", passed: true, msg: `Strong Return (+${(totalReturn*100).toFixed(1)}%)` });
    } else {
      assessment.details.push({ id: "roi", passed: false, msg: `Low Return (+${(totalReturn*100).toFixed(1)}%)` });
    }

    // C. VOLATILITY STAR (Stability)
    // Relax volatility if user made huge profit (Suffering from Success fix)
    let volatilityThreshold = 0.25; 
    if (totalReturn > 1.0) {
      volatilityThreshold = 0.50; 
    }

    const volatility = calculateVolatility(gameState.portfolioHistory);
    const volStar = volatility < volatilityThreshold;

    console.log(`\n[VOLATILITY STAR]`);
    console.log(`Target: < ${volatilityThreshold}`);
    console.log(`Actual: ${(volatility * 100).toFixed(2)}%`);

    if (volStar) {
      assessment.stars++;
      assessment.details.push({ id: "volatility", passed: true, msg: "Stable Portfolio" });
    } else {
      assessment.details.push({ id: "volatility", passed: false, msg: "Too Volatile" });
    }

    // [UPDATED] D. DIVERSIFICATION STAR (Distinct Asset Category Count)
    // Categories: Cash/Savings, Bonds, Funds, Stocks, Gold, Crypto
    const assetBreakdown = {
      cash: gameState.pocket + gameState.savingsBalance,
      bonds: gameState.holdings.bonds || 0,
      funds: gameState.fundBalance,
      stocks: stockValue,
      gold: gameState.goldBalance,
      crypto: currencyValue
    };

    let activeCategories = 0;
    // Count how many categories have at least 5% allocation
    for (const value of Object.values(assetBreakdown)) {
      if ((value / finalValue) > 0.05) {
        activeCategories++;
      }
    }

    let divStar = false;
    // Condition: Must have at least 3 distinct active asset categories
    // OR be a "Lucky Winner" (ROI > 100%)
    if (activeCategories >= 3) {
      divStar = true;
    } else if (totalReturn > 1.0) {
      divStar = true;
    }

    console.log(`\n[DIVERSIFICATION STAR]`);
    console.log(`Active Categories (>5%): ${activeCategories} (Need 3)`);
    console.log(`Total Return: ${(totalReturn * 100).toFixed(2)}%`);
    console.log(`Pass: ${divStar}`);

    if (divStar) {
      assessment.stars++;
      assessment.details.push({ id: "diversification", passed: true, msg: "Balanced Asset Mix" });
    } else {
      assessment.details.push({ id: "diversification", passed: false, msg: "Unbalanced Strategy" });
    }

    // E. RISK STAR (Liquidity Check)
    const liquidityRatio = (gameState.pocket + gameState.savingsBalance) / finalValue;
    const hasEmergencyFund = liquidityRatio > 0.05;

    const maxDD = calculateMaxDrawdown(gameState.portfolioHistory);
    const noCrash = maxDD > -0.30; 
    
    const riskStar = noCrash && hasEmergencyFund;

    console.log(`\n[RISK STAR]`);
    console.log(`Liquidity Ratio: ${(liquidityRatio * 100).toFixed(2)}% (Target > 5%)`);
    console.log(`Max Drawdown: ${(maxDD * 100).toFixed(2)}% (Target > -30%)`);
    console.log(`Pass: ${riskStar}`);

    if (riskStar) {
      assessment.stars++;
      assessment.details.push({ id: "risk", passed: true, msg: "Resilient & Liquid" });
    } else {
      if (!hasEmergencyFund) {
        assessment.details.push({ id: "risk", passed: false, msg: "No Emergency Fund" });
      } else {
        assessment.details.push({ id: "risk", passed: false, msg: `Big Crash (${(maxDD*100).toFixed(1)}%)` });
      }
    }

    console.log(`\n[FINAL RESULT]`);
    console.log(`Total Stars Earned: ${assessment.stars}/5`);
    console.log("========================================\n");

    // --- 3. SAVE TO DB ---
    const roundedScore = Math.round(finalValue);
    
    const sql = `
      INSERT INTO score_history 
      (user_id, score, star, played_at) 
      VALUES (?, ?, ?, NOW())
    `;

    db.query(sql, [userId, roundedScore, assessment.stars], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Failed to save score" });
      }

      gameSessions.delete(sessionId);

      res.json({
        success: true,
        score: roundedScore,
        botScore: Math.round(botScore), // Send Bot Score
        star: assessment.stars,
        details: assessment.details,
        metrics: {
          roi: totalReturn,
          volatility: volatility,
          maxDrawdown: maxDD,
          inflationAdjusted: wealthStar
        }
      });
    });

  } catch (error) {
    console.error("Calculation error:", error);
    res.status(500).json({ success: false, error: "Server error calculating score" });
  }
});

// Delete session (cleanup)
router.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  gameSessions.delete(sessionId);
  res.json({ success: true, message: "Session deleted" });
});

export default router;