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

  const returns = [];
  for (let i = 1; i < history.length; i++) {
    const r = (history[i] - history[i - 1]) / history[i - 1];
    returns.push(r);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
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
  let bondBalance = 0;
  let indexShares = 0;
  
  const monthlyBondRate = 0.07 / 12; // 7% Annual Return for Bot Bonds
  const initialCash = 4000;
  const income = 4000;

  // Month 0: Initial Investment
  const startPrice = indexPrices[0] || 100;
  bondBalance += initialCash * 0.5;
  indexShares += (initialCash * 0.5) / startPrice;

  // Simulation Loop
  const totalSteps = indexPrices.length; 
  let priceIndex = 1; 

  for (let m = 1; m <= 240; m++) {
    bondBalance *= (1 + monthlyBondRate);

    if (m % 6 === 0) {
      bondBalance += income * 0.5;
      if (priceIndex < totalSteps) {
        const currentPrice = indexPrices[priceIndex];
        indexShares += (income * 0.5) / currentPrice;
        priceIndex++;
      }
    }
  }

  const finalPrice = indexPrices[indexPrices.length - 1] || startPrice;
  const totalIndexValue = indexShares * finalPrice;
  
  return bondBalance + totalIndexValue;
};

// --- ACHIEVEMENT CHECKER ---
const checkAchievements = (gameState, finalValue, totalReturn, maxDD, stockValue, currencyValue, botScore, starCount) => {
  const unlocked = [];

  // 1. 5-Star General
  if (starCount === 5) unlocked.push('5_STAR');

  // 2. The Whale
  if (finalValue > 1000000) unlocked.push('WHALE');

  // 3. Bot Crusher (Beat bot by 20%)
  if (finalValue > botScore * 1.2) unlocked.push('BOT_CRUSHER');

  // 4. Inflation Buster (> 200% return)
  if (totalReturn > 2.0) unlocked.push('INFLATION_BUSTER');

  // 5. The Turtle (0% in Stocks/Crypto, but profitable)
  const riskyAssets = stockValue + currencyValue + gameState.fundBalance;
  if (riskyAssets === 0 && totalReturn > 0) unlocked.push('TURTLE');

  // 6. YOLO Trader (>90% in Stocks/Crypto, profitable)
  if (finalValue > 0 && (riskyAssets / finalValue) > 0.90 && totalReturn > 0) unlocked.push('YOLO');

  // 7. Iron Hands (survived -40% crash but ended profitable)
  if (maxDD < -0.40 && totalReturn > 0) unlocked.push('IRON_HANDS');

  // 8. The Hoarder
  if (gameState.savingsBalance > 100000) unlocked.push('HOARDER');

  // 9. Goldfinger
  const goldProfit = gameState.profit.gold || 0;
  
  // Sum up other profits
  let stockProfit = 0;
  if (gameState.profit.stocks) Object.values(gameState.profit.stocks).forEach(p => stockProfit += p);
  let cryptoProfit = 0;
  if (gameState.profit.currencies) Object.values(gameState.profit.currencies).forEach(p => cryptoProfit += p);
  
  const otherProfit = stockProfit + (gameState.profit.bonds || 0) + (gameState.profit.index || 0) + cryptoProfit;
  
  if (goldProfit > otherProfit && goldProfit > 0) unlocked.push('GOLDFINGER');

  // 10. Coupon Clipper
  if ((gameState.profit.bonds || 0) > 20000) unlocked.push('COUPON_CLIPPER');

  // 11. Rekt
  if (totalReturn < 0) unlocked.push('REKT');

  // 12. Lost Decade
  if (finalValue < botScore) unlocked.push('LOST_DECADE');

  return unlocked;
};

// --- GAME STATE ROUTES ---

router.post("/init", (req, res) => {
  const sessionId = Date.now().toString();
  // Bond Logic: Ensure longer duration yields higher return
  const baseRate = 0.03 + Math.random() * 0.02; 
  const bondInterestRates = {
    "1 year": baseRate,
    "5 years": baseRate + 0.015 + (Math.random() * 0.01),
    "10 years": baseRate + 0.03 + (Math.random() * 0.015),
  };
  const initialCapital = 4000;
  const gameState = {
    sessionId,
    pocket: initialCapital,
    totalInvested: initialCapital,
    portfolioHistory: [initialCapital],
    savingsBalance: 0,
    currentYear: 1,
    currentMonth: 0,
    fundBalance: 0,
    goldBalance: 0,
    indexShares: 0,
    goldShares: 0,
    indexAvgPrice: 0,
    goldAvgPrice: 0,
    profit: { savings: 0, bonds: 0, index: 0, gold: 0 },
    holdings: { bonds: 0, index: 0, gold: 0, stocks: {}, currencies: {} },
    bondInvestments: [],
    bondInterestRates,
    lastProcessedMonth: 0,
  };
  gameSessions.set(sessionId, gameState);
  res.json({ sessionId, gameState });
});

router.get("/state/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  res.json(gameState);
});

router.post("/transaction", (req, res) => {
  const { sessionId, action, amount, bondType, indexValue, goldValue } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) return res.status(400).json({ error: "Invalid amount" });

  // SAVINGS
  if (action === "savings-deposit") {
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    gameState.pocket -= value;
    gameState.savingsBalance += value;
  } else if (action === "savings-withdraw") {
    if (value > gameState.savingsBalance) return res.status(400).json({ error: "Insufficient savings balance" });
    gameState.savingsBalance -= value;
    gameState.pocket += value;
  }
  // BOND
  else if (action === "bond-buy") {
    if (!bondType) return res.status(400).json({ error: "Bond type required" });
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    const durationYears = { "1 year": 1, "5 years": 5, "10 years": 10 }[bondType];
    gameState.pocket -= value;
    gameState.bondInvestments.push({
      id: Date.now(),
      duration: durationYears,
      amount: value,
      remaining: durationYears,
      bondType,
    });
    gameState.holdings.bonds += value;
  }
  // INDEX FUND
  else if (action === "index-buy") {
    if (!indexValue) return res.status(400).json({ error: "Index value required" });
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    const sharesBought = value / indexValue;
    gameState.pocket -= value;
    gameState.fundBalance += value;
    gameState.indexShares += sharesBought;
    const totalShares = gameState.indexShares;
    gameState.indexAvgPrice = totalShares > 0 ? 
      (gameState.indexAvgPrice * (totalShares - sharesBought) + value) / totalShares : indexValue;
    gameState.holdings.index += value;
  } else if (action === "index-sell") {
    if (!indexValue) return res.status(400).json({ error: "Index value required" });
    if (value > gameState.fundBalance) return res.status(400).json({ error: "Insufficient fund balance" });
    const sharesToSell = value / indexValue;
    const costBasis = sharesToSell * gameState.indexAvgPrice;
    const profitAmount = value - costBasis;
    gameState.indexShares = Math.max(0, gameState.indexShares - sharesToSell);
    gameState.fundBalance -= value;
    gameState.pocket += value;
    gameState.holdings.index = Math.max(0, gameState.holdings.index - costBasis);
    gameState.profit.index += profitAmount;
  }
  // GOLD
  else if (action === "gold-buy") {
    if (!goldValue) return res.status(400).json({ error: "Gold value required" });
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    const gramsBought = value / goldValue;
    gameState.pocket -= value;
    gameState.goldBalance += value;
    gameState.goldShares += gramsBought;
    const totalGrams = gameState.goldShares;
    gameState.goldAvgPrice = totalGrams > 0 ? 
      (gameState.goldAvgPrice * (totalGrams - gramsBought) + value) / totalGrams : goldValue;
    gameState.holdings.gold += value;
  } else if (action === "gold-sell") {
    if (!goldValue) return res.status(400).json({ error: "Gold value required" });
    if (value > gameState.goldBalance) return res.status(400).json({ error: "Insufficient gold balance" });
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

router.post("/monthly-update", (req, res) => {
  const { sessionId, month, indexData, goldData } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  if (month <= gameState.lastProcessedMonth) return res.json({ success: true, message: "Already processed", gameState });

  // Savings Interest
  const interest = gameState.savingsBalance * 0.015;
  gameState.savingsBalance += interest;
  gameState.profit.savings += interest;

  // Asset Updates
  if (indexData && gameState.indexShares > 0) gameState.fundBalance *= (1 + indexData.change / 100);
  if (goldData && gameState.goldShares > 0) gameState.goldBalance *= (1 + goldData.change / 100);

  // Income Injection
  if (month === 6 || month === 12) {
    gameState.pocket += 4000;
    gameState.totalInvested += 4000; 
  }

  gameState.lastProcessedMonth = month;
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, gameState });
});

router.post("/bond-update", (req, res) => {
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const maturedBonds = [];
  gameState.bondInvestments = gameState.bondInvestments.map((inv) => {
    if (inv.remaining > 0) {
      const monthlyRate = gameState.bondInterestRates[inv.bondType] / 12;
      const interest = inv.amount * monthlyRate;
      inv.amount += interest;
      gameState.profit.bonds += interest;
      inv.remaining = Math.max(0, inv.remaining - 1 / 12);
    }
    if (inv.remaining <= 0) {
      gameState.pocket += inv.amount;
      gameState.holdings.bonds = Math.max(0, gameState.holdings.bonds - inv.amount);
      maturedBonds.push({ amount: inv.amount, duration: inv.duration, bondType: inv.bondType });
      return null;
    }
    return inv;
  }).filter(Boolean);

  gameSessions.set(sessionId, gameState);
  res.json({ success: true, gameState, maturedBonds });
});

router.post("/gold-update", (req, res) => {
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  if (gameState.goldShares > 0 && gameState.goldBalance > 0) {
    gameState.profit.gold = gameState.goldBalance - gameState.holdings.gold;
  }
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, gameState });
});

router.post("/bond-sell", (req, res) => {
  const { sessionId, bondId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  const bondIndex = gameState.bondInvestments.findIndex((b) => b.id === bondId);
  if (bondIndex === -1) return res.status(404).json({ error: "Bond not found" });
  const bond = gameState.bondInvestments[bondIndex];
  const sellAmount = bond.amount * 0.9;
  gameState.pocket += sellAmount;
  gameState.holdings.bonds = Math.max(0, gameState.holdings.bonds - bond.amount);
  gameState.bondInvestments.splice(bondIndex, 1);
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, sellAmount, gameState, message: `Bond sold early for ${sellAmount.toFixed(2)}$` });
});

router.post("/stock-buy", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  const shares = parseInt(amount);
  const stockPrice = parseFloat(price);
  const totalCost = shares * stockPrice;
  if (totalCost > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket" });
  gameState.pocket -= totalCost;
  if (!gameState.holdings.stocks) gameState.holdings.stocks = {};
  if (!gameState.holdings.stocks[symbol]) gameState.holdings.stocks[symbol] = { shares: 0, avgCost: 0 };
  const holding = gameState.holdings.stocks[symbol];
  const totalShares = holding.shares + shares;
  holding.avgCost = totalShares === 0 ? 0 : (holding.shares * holding.avgCost + totalCost) / totalShares;
  holding.shares = totalShares;
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/stock-sell", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  const shares = parseInt(amount);
  const stockPrice = parseFloat(price);
  if (!gameState.holdings.stocks?.[symbol] || shares > gameState.holdings.stocks[symbol].shares) return res.status(400).json({ error: "Invalid sell" });
  const holding = gameState.holdings.stocks[symbol];
  const totalSellValue = shares * stockPrice;
  const costBasis = shares * holding.avgCost;
  if (!gameState.profit.stocks) gameState.profit.stocks = {};
  if (!gameState.profit.stocks[symbol]) gameState.profit.stocks[symbol] = 0;
  gameState.profit.stocks[symbol] += (totalSellValue - costBasis);
  gameState.pocket += totalSellValue;
  holding.shares -= shares;
  if (holding.shares <= 0) delete gameState.holdings.stocks[symbol];
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/currency-buy", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  const units = parseInt(amount);
  const currencyPrice = parseFloat(price);
  const totalCost = units * currencyPrice;
  if (totalCost > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket" });
  gameState.pocket -= totalCost;
  if (!gameState.holdings.currencies) gameState.holdings.currencies = {};
  if (!gameState.holdings.currencies[symbol]) gameState.holdings.currencies[symbol] = { units: 0, avgCost: 0 };
  const holding = gameState.holdings.currencies[symbol];
  const totalUnits = holding.units + units;
  holding.avgCost = totalUnits === 0 ? 0 : (holding.units * holding.avgCost + totalCost) / totalUnits;
  holding.units = totalUnits;
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/currency-sell", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  const units = parseInt(amount);
  const currencyPrice = parseFloat(price);
  if (!gameState.holdings.currencies?.[symbol] || units > gameState.holdings.currencies[symbol].units) return res.status(400).json({ error: "Invalid sell" });
  const holding = gameState.holdings.currencies[symbol];
  const totalSellValue = units * currencyPrice;
  const costBasis = units * holding.avgCost;
  if (!gameState.profit.currencies) gameState.profit.currencies = {};
  if (!gameState.profit.currencies[symbol]) gameState.profit.currencies[symbol] = 0;
  gameState.profit.currencies[symbol] += (totalSellValue - costBasis);
  gameState.pocket += totalSellValue;
  holding.units -= units;
  if (holding.units <= 0) delete gameState.holdings.currencies[symbol];
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/year-increment", (req, res) => {
  const { sessionId, currentNetWorth } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  const val = currentNetWorth ? parseFloat(currentNetWorth) : gameState.pocket; 
  gameState.portfolioHistory.push(val);
  if (gameState.currentYear >= 20) return res.json({ success: true, gameComplete: true, gameState });
  gameState.currentYear += 1;
  gameState.lastProcessedMonth = 0;
  // Decrease Bond Yields
  for (const key in gameState.bondInterestRates) {
    gameState.bondInterestRates[key] = Math.max(0.005, gameState.bondInterestRates[key] * 0.95);
  }
  gameSessions.set(sessionId, gameState);
  res.json({ success: true, gameState });
});

router.post("/apply-event", (req, res) => {
  const { sessionId, effect } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(400).json({ error: "Invalid session" });
  const amount = effect.amount || 0;
  gameState.pocket += amount;
  if (gameState.pocket < 0) gameState.pocket = 0;
  gameSessions.set(sessionId, gameState);
  return res.json({ message: "Event applied", gameState });
});

// --- END GAME ROUTE ---
// --- END GAME ROUTE ---
router.post("/end-game", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { sessionId, finalStockPrices, finalCurrencyPrices, botIndexHistory } = req.body;

  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  try {
    // 1. Calculate Final Net Worth
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
    
    gameState.portfolioHistory.push(finalValue);

    // 2. Run Bot Simulation
    let botScore = 0;
    if (botIndexHistory && Array.isArray(botIndexHistory)) {
      botScore = simulateBot(botIndexHistory);
    } else {
      botScore = gameState.totalInvested * 1.6;
    }

    // 3. Star Assessment
    const assessment = { stars: 0, details: [] };

    // Wealth Star
    const inflationTarget = gameState.totalInvested * 1.3;
    if (finalValue > inflationTarget) {
      assessment.stars++;
      assessment.details.push({ id: "wealth", passed: true, msg: "Beat Inflation" });
    } else {
      assessment.details.push({ id: "wealth", passed: false, msg: "Lost purchasing power" });
    }

    // ROI Star
    const totalReturn = calculateTotalReturn(gameState.totalInvested, finalValue);
    if (totalReturn > 0.50) {
      assessment.stars++;
      assessment.details.push({ id: "roi", passed: true, msg: `Strong Return (+${(totalReturn*100).toFixed(1)}%)` });
    } else {
      assessment.details.push({ id: "roi", passed: false, msg: `Low Return (+${(totalReturn*100).toFixed(1)}%)` });
    }

    // Volatility Star
    let volatilityThreshold = 0.25; 
    if (totalReturn > 1.0) volatilityThreshold = 0.50; 
    const volatility = calculateVolatility(gameState.portfolioHistory);
    if (volatility < volatilityThreshold) {
      assessment.stars++;
      assessment.details.push({ id: "volatility", passed: true, msg: "Stable Portfolio" });
    } else {
      assessment.details.push({ id: "volatility", passed: false, msg: "Too Volatile" });
    }

    // Diversification Star
    const assetBreakdown = {
      cash: gameState.pocket + gameState.savingsBalance,
      bonds: gameState.holdings.bonds || 0,
      funds: gameState.fundBalance,
      stocks: stockValue,
      gold: gameState.goldBalance,
      crypto: currencyValue
    };

    let activeCategories = 0;
    for (const value of Object.values(assetBreakdown)) {
      if ((value / finalValue) > 0.05) activeCategories++;
    }

    if (activeCategories >= 3 || totalReturn > 1.0) {
      assessment.stars++;
      assessment.details.push({ id: "diversification", passed: true, msg: "Balanced Asset Mix" });
    } else {
      assessment.details.push({ id: "diversification", passed: false, msg: "Unbalanced Strategy" });
    }

    // Risk Star
    const liquidityRatio = (gameState.pocket + gameState.savingsBalance) / finalValue;
    const maxDD = calculateMaxDrawdown(gameState.portfolioHistory);
    
    if (maxDD > -0.30 && liquidityRatio > 0.05) {
      assessment.stars++;
      assessment.details.push({ id: "risk", passed: true, msg: "Resilient & Liquid" });
    } else {
      if (liquidityRatio <= 0.05) assessment.details.push({ id: "risk", passed: false, msg: "No Emergency Fund" });
      else assessment.details.push({ id: "risk", passed: false, msg: `Big Crash (${(maxDD*100).toFixed(1)}%)` });
    }

    // 4. Achievement Check
    const unlockedCodes = checkAchievements(
      gameState, 
      finalValue, 
      totalReturn, 
      maxDD, 
      stockValue, 
      currencyValue, 
      botScore,
      assessment.stars
    );

    // 5. Save Score & Achievements
    const roundedScore = Math.round(finalValue);
    const scoreSql = `INSERT INTO score_history (user_id, score, star, played_at) VALUES (?, ?, ?, NOW())`;
    
    db.query(scoreSql, [userId, roundedScore, assessment.stars], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Failed to save score" });

      // --- FIXED ACHIEVEMENT SAVING LOGIC ---
      if (unlockedCodes.length > 0) {
        const codesString = unlockedCodes.map(c => `'${c}'`).join(",");
        const findSql = `SELECT id FROM achievements WHERE code IN (${codesString})`;
        
        db.query(findSql, [], (err, rows) => {
          if (!err && rows.length > 0) {
            // Correctly use the NEW score ID (result.insertId)
            const scoreId = result.insertId;
            const insertValues = rows.map(row => [userId, row.id, scoreId]);
            
            // Corrected SQL: uses score_id, not game_session_id
            const insertSql = `INSERT IGNORE INTO user_achievements (user_id, achievement_id, score_id) VALUES ?`;
            
            db.query(insertSql, [insertValues], (err) => {
                if (err) console.error("Achievement save error:", err);
            });
          }
        });
      }
      // --------------------------------------

      gameSessions.delete(sessionId);
      res.json({
        success: true,
        score: roundedScore,
        botScore: Math.round(botScore),
        star: assessment.stars,
        details: assessment.details,
        metrics: { roi: totalReturn, volatility: maxDD, maxDrawdown: maxDD },
        newAchievements: unlockedCodes
      });
    });

  } catch (error) {
    console.error("Calculation error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  gameSessions.delete(sessionId);
  res.json({ success: true, message: "Session deleted" });
});

export default router;