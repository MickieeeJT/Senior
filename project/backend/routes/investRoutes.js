import express from "express";
const router = express.Router();

// In-memory game state storage (use database in production)
const gameSessions = new Map();

// Initialize a new game session
router.post("/init", (req, res) => {
  const sessionId = Date.now().toString();

  // Generate random bond interest rates
  const bondInterestRates = {
    "1 year": 0.05 + Math.random() * 0.05,
    "5 years": 0.07 + Math.random() * 0.05,
    "10 years": 0.09 + Math.random() * 0.05,
  };

  const gameState = {
    sessionId,
    pocket: 4000,
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
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (gameState.currentYear >= 20) {
    return res.json({
      success: true,
      gameComplete: true,
      gameState,
    });
  }

  gameState.currentYear += 1;
  gameState.lastProcessedMonth = 0;
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

// Delete session (cleanup)
router.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  gameSessions.delete(sessionId);
  res.json({ success: true, message: "Session deleted" });
});

export default router;