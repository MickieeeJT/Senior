import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { generateScenario } from "../utils/scenarioGenerator.js";
import db from "../config/db.js";

const router = express.Router();
const gameSessions = new Map();

// --- HELPER: Save State to DB ---
const saveGameToDB = (userId, sessionId, gameState) => {
    const jsonState = JSON.stringify(gameState);
    const sql = `
        INSERT INTO active_sessions (user_id, session_id, game_state) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        session_id = VALUES(session_id), 
        game_state = VALUES(game_state)
    `;
    db.query(sql, [userId, sessionId, jsonState], (err) => {
        if (err) console.error("Error saving game state:", err);
    });
};

// --- HELPER: Delete State from DB ---
const deleteGameFromDB = (userId) => {
    const sql = "DELETE FROM active_sessions WHERE user_id = ?";
    db.query(sql, [userId], (err) => {
        if (err) console.error("Error deleting game state:", err);
    });
};

// --- HELPERS ---

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Calculate Total Return
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
    if (value > peak) peak = value;
    const drawdown = (value - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
};

// --- BOT SIMULATION ---
const simulateBot = (indexPrices) => {
  let bondBalance = 0;
  let indexShares = 0;
  const monthlyBondRate = 0.07 / 12;
  const initialCash = 4000;
  const income = 4000;

  const startPrice = indexPrices[0] || 100;
  bondBalance += initialCash * 0.5;
  indexShares += (initialCash * 0.5) / startPrice;

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

  if (starCount === 5) unlocked.push('5_STAR');
  if (finalValue > 1000000) unlocked.push('WHALE');
  if (finalValue > botScore * 1.2) unlocked.push('BOT_CRUSHER');
  if (totalReturn > 2.0) unlocked.push('INFLATION_BUSTER');

  const riskyAssets = stockValue + currencyValue + gameState.fundBalance;
  if (riskyAssets === 0 && totalReturn > 0) unlocked.push('TURTLE');
  if (finalValue > 0 && (riskyAssets / finalValue) > 0.90 && totalReturn > 0) unlocked.push('YOLO');
  if (maxDD < -0.40 && totalReturn > 0) unlocked.push('IRON_HANDS');
  if (gameState.savingsBalance > 100000) unlocked.push('HOARDER');

  const goldProfit = gameState.profit.gold || 0;
  let stockProfit = 0;
  if (gameState.profit.stocks) Object.values(gameState.profit.stocks).forEach(p => stockProfit += p);
  let cryptoProfit = 0;
  if (gameState.profit.currencies) Object.values(gameState.profit.currencies).forEach(p => cryptoProfit += p);

  const otherProfit = stockProfit + (gameState.profit.bonds || 0) + (gameState.profit.index || 0) + cryptoProfit;

  if (goldProfit > otherProfit && goldProfit > 0) unlocked.push('GOLDFINGER');
  if ((gameState.profit.bonds || 0) > 20000) unlocked.push('COUPON_CLIPPER');
  if (totalReturn < 0) unlocked.push('REKT');
  if (finalValue < botScore) unlocked.push('LOST_DECADE');

  return unlocked;
};

// --- ROUTES ---


router.get("/check-session", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT session_id, game_state FROM active_sessions WHERE user_id = ?";
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (rows.length > 0) {
      const savedSession = rows[0];
      let parsedState;
      try {
        parsedState = typeof savedSession.game_state === 'string'
          ? JSON.parse(savedSession.game_state)
          : savedSession.game_state;
      } catch (e) {
        console.error("Error parsing game state:", e);
        return res.json({ hasSession: false });
      }

      // Calculate total assets for preview
      let totalAssets = (parsedState.pocket || 0) +
        (parsedState.savingsBalance || 0) +
        (parsedState.fundBalance || 0) +
        (parsedState.goldBalance || 0) +
        (parsedState.holdings?.bonds || 0);

      // Add stocks value estimation if possible, simplified for preview
      // We might skip complex calculation as we don't have current market data easily here without fetching it
      // So just showing liquid assets + purchase value might be safer or just what we have

      return res.json({
        hasSession: true,
        sessionId: savedSession.session_id,
        preview: {
          currentYear: parsedState.currentYear,
          currentMonth: parsedState.currentMonth,
          pocket: parsedState.pocket,
          totalAssets: totalAssets
        }
      });
    }

    res.json({ hasSession: false });
  });
});

router.post("/init", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { forceNew, duration, targetAmount } = req.body;

  const maxYears = duration ? parseInt(duration) : 40;
  const finalTargetAmount = targetAmount ? parseFloat(targetAmount) : 1000000;

  const checkSql = "SELECT session_id, game_state, scenario_data FROM active_sessions WHERE user_id = ?";
  db.query(checkSql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });

    // RESUME EXISTING GAME
    if (rows.length > 0 && !forceNew) {
      const savedSession = rows[0];
      const parsedState = typeof savedSession.game_state === 'string' ? JSON.parse(savedSession.game_state) : savedSession.game_state;
      const parsedScenario = typeof savedSession.scenario_data === 'string' ? JSON.parse(savedSession.scenario_data) : savedSession.scenario_data;

      gameSessions.set(savedSession.session_id, parsedState);
      parsedState.userId = userId;

      return res.json({ 
        success: true, 
        message: "Game Resumed", 
        sessionId: savedSession.session_id, 
        gameState: parsedState,
        scenarioData: parsedScenario,
        // targetAmount: parsedState.targetAmount || null
      });
    }

    // START NEW GAME
    if (rows.length > 0 && forceNew) {
         gameSessions.delete(rows[0].session_id);
         deleteGameFromDB(userId);
    }

    const sessionId = Date.now().toString();
    const baseRate = 0.03 + Math.random() * 0.02;

    const bondInterestRates = {
      "1 year": baseRate,
      "5 years": baseRate + 0.015 + (Math.random() * 0.01),
      "10 years": baseRate + 0.03 + (Math.random() * 0.015),
    };
    const initialCapital = 4000;
    
    // --- Generate Scenario Graph (e.g., 40 Years) ---
    const newScenario = generateScenario(maxYears);
    
    const gameState = {
      userId,
      sessionId,
      maxYears,
      targetAmount: finalTargetAmount,
      pocket: initialCapital,
      totalInvested: initialCapital,
      portfolioHistory: [initialCapital],
      savingsBalance: 0,
      currentYear: 1,
      currentMonth: 1, // Start at month 1
      fundBalance: 0,
      goldBalance: 0,
      indexShares: 0,
      goldShares: 0,
      indexAvgPrice: 0,
      goldAvgPrice: 0,
      profit: { savings: 0, bonds: 0, index: 0, gold: 0, stocks: {}, currencies: {} },
      holdings: { bonds: 0, index: 0, gold: 0, stocks: {}, currencies: {} },
      bondInvestments: [],
      bondInterestRates,
      lastProcessedMonth: 0,
    };

    // Save to Memory
    gameSessions.set(sessionId, gameState);
    
    // Save to DB
    const jsonState = JSON.stringify(gameState);
    const jsonScenario = JSON.stringify(newScenario);
    const sqlInsert = `
        INSERT INTO active_sessions (user_id, session_id, game_state, scenario_data) 
        VALUES (?, ?, ?, ?)
    `;
    db.query(sqlInsert, [userId, sessionId, jsonState, jsonScenario], (insertErr) => {
        if (insertErr) console.error("Error creating new game:", insertErr);
        
        res.json({ 
            sessionId, 
            gameState, 
            scenarioData: newScenario,
            message: "New Game Started" 
        });
    });
  });
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

  if (action === "savings-deposit") {
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    gameState.pocket = roundToTwo(gameState.pocket - value);
    gameState.savingsBalance = roundToTwo(gameState.savingsBalance + value);
  }
  else if (action === "savings-withdraw") {
    if (value > gameState.savingsBalance) return res.status(400).json({ error: "Insufficient savings balance" });
    gameState.savingsBalance = roundToTwo(gameState.savingsBalance - value);
    gameState.pocket = roundToTwo(gameState.pocket + value);
  }
  else if (action === "bond-buy") {
    if (!bondType) return res.status(400).json({ error: "Bond type required" });
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    const durationYears = { "1 year": 1, "5 years": 5, "10 years": 10 }[bondType];

    gameState.pocket = roundToTwo(gameState.pocket - value);
    gameState.bondInvestments.push({
      id: Date.now(),
      duration: durationYears,
      amount: value,
      remaining: durationYears,
      bondType,
      originalAmount: value
    });
    gameState.holdings.bonds = roundToTwo((gameState.holdings.bonds || 0) + value);
  }
  else if (action === "index-buy") {
    if (!indexValue) return res.status(400).json({ error: "Index value required" });
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    const sharesBought = value / indexValue;
    gameState.pocket = roundToTwo(gameState.pocket - value);
    gameState.fundBalance = roundToTwo(gameState.fundBalance + value);
    gameState.indexShares += sharesBought;

    const totalShares = gameState.indexShares;
    gameState.indexAvgPrice = totalShares > 0 ?
      (gameState.indexAvgPrice * (totalShares - sharesBought) + value) / totalShares : indexValue;

    gameState.holdings.index = roundToTwo(gameState.holdings.index + value);
  }
  else if (action === "index-sell") {
    if (!indexValue) return res.status(400).json({ error: "Index value required" });
    if (value > gameState.fundBalance) return res.status(400).json({ error: "Insufficient fund balance" });
    const sharesToSell = value / indexValue;
    const costBasis = sharesToSell * gameState.indexAvgPrice;
    const profitAmount = value - costBasis;

    gameState.indexShares = Math.max(0, gameState.indexShares - sharesToSell);
    gameState.fundBalance = roundToTwo(gameState.fundBalance - value);
    gameState.pocket = roundToTwo(gameState.pocket + value);
    gameState.holdings.index = Math.max(0, roundToTwo(gameState.holdings.index - costBasis));
    gameState.profit.index = roundToTwo(gameState.profit.index + profitAmount);
  }
  else if (action === "gold-buy") {
    if (!goldValue) return res.status(400).json({ error: "Gold value required" });
    if (value > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket money" });
    const gramsBought = value / goldValue;
    gameState.pocket = roundToTwo(gameState.pocket - value);
    gameState.goldBalance = roundToTwo(gameState.goldBalance + value);
    gameState.goldShares += gramsBought;
    const totalGrams = gameState.goldShares;
    gameState.goldAvgPrice = totalGrams > 0 ?
      (gameState.goldAvgPrice * (totalGrams - gramsBought) + value) / totalGrams : goldValue;
    gameState.holdings.gold = roundToTwo(gameState.holdings.gold + value);
  }
  else if (action === "gold-sell") {
    if (!goldValue) return res.status(400).json({ error: "Gold value required" });
    if (value > gameState.goldBalance) return res.status(400).json({ error: "Insufficient gold balance" });
    const gramsToSell = value / goldValue;
    const costBasis = gramsToSell * gameState.goldAvgPrice;
    const profitAmount = value - costBasis;
    gameState.goldShares = Math.max(0, gameState.goldShares - gramsToSell);
    gameState.goldBalance = roundToTwo(gameState.goldBalance - value);
    gameState.pocket = roundToTwo(gameState.pocket + value);
    gameState.holdings.gold = Math.max(0, roundToTwo(gameState.holdings.gold - costBasis));
    gameState.profit.gold = roundToTwo(gameState.profit.gold + profitAmount);
  }

  gameSessions.set(sessionId, gameState);
  
  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, updatedGameState: gameState });
});

router.post("/monthly-update", (req, res) => {
  const { sessionId, month, progress, indexData, goldData } = req.body;
  const gameState = gameSessions.get(sessionId);
  
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  
  // If already processed, just return state (but maybe update progress if needed)
  if (month <= gameState.lastProcessedMonth) {
      return res.json({ success: true, message: "Already processed", gameState });
  }

  const interest = gameState.savingsBalance * 0.015;
  gameState.savingsBalance = roundToTwo(gameState.savingsBalance + interest);
  gameState.profit.savings = roundToTwo(gameState.profit.savings + interest);

  if (indexData && gameState.indexShares > 0) gameState.fundBalance = roundToTwo(gameState.fundBalance * (1 + indexData.change / 100));
  if (goldData && gameState.goldShares > 0) gameState.goldBalance = roundToTwo(gameState.goldBalance * (1 + goldData.change / 100));

  if (month === 6 || month === 12) {
    gameState.pocket += 4000;
    gameState.totalInvested += 4000;
  }

  // IMPORTANT: Save position for resume
  gameState.lastProcessedMonth = month; // Used for calculation logic
  gameState.currentMonth = month;       // Used for UI resume
  
  if (progress !== undefined) {
      gameState.currentProgress = progress;
  }
  
  // Save to Memory
  gameSessions.set(sessionId, gameState);
  
  // Save to DB (This ensures persistence if user exits)
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, gameState });
});

// --- UPDATED BOND UPDATE: Does NOT Remove Bond when done ---
router.post("/bond-update", (req, res) => {
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const maturedBonds = [];
  if (gameState.bondInvestments) {
      gameState.bondInvestments.forEach((inv) => {
        // Only process interest if still active
        if (inv.remaining > 0) {
          const monthlyRate = (gameState.bondInterestRates[inv.bondType] || 0.05) / 12;
          const interest = inv.amount * monthlyRate;
          inv.amount = roundToTwo(inv.amount + interest);
          
          if (!gameState.profit.bonds) gameState.profit.bonds = 0;
          gameState.profit.bonds = roundToTwo(gameState.profit.bonds + interest);
          inv.remaining = Math.max(0, inv.remaining - 1 / 12);
        }
      });
  }

  gameSessions.set(sessionId, gameState);

  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }
  
  res.json({ success: true, gameState, maturedBonds });
});

// --- GOLD UPDATE: Update gold value based on market ---
router.post("/gold-update", (req, res) => {
  const { sessionId, goldData } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  if (goldData && gameState.goldShares > 0) {
      // Current Value = Shares * Current Price
      const currentValue = gameState.goldShares * goldData.close;
      gameState.goldBalance = roundToTwo(currentValue);
  }
  
  gameSessions.set(sessionId, gameState);
  
  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, updatedGameState: gameState });
});

// --- UPDATED BOND SELL: Handles Early Sell (90%) AND Collect (100%) ---
router.post("/bond-sell", (req, res) => {
  const { sessionId, bondId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const bondIndex = gameState.bondInvestments.findIndex((b) => b.id === bondId);
  if (bondIndex === -1) return res.status(404).json({ error: "Bond not found" });

  const bond = gameState.bondInvestments[bondIndex];

  let sellAmount = 0;
  let message = "";

  // CHECK: Is the bond fully matured?
  if (bond.remaining <= 0) {
    // FULL PAYOUT (COLLECT)
    sellAmount = bond.amount;
    message = `Bond collected for ${sellAmount.toFixed(2)}$`;
  } else {
    // EARLY WITHDRAWAL PENALTY (90%)
    sellAmount = roundToTwo(bond.amount * 0.9);
    message = `Bond sold early for ${sellAmount.toFixed(2)}$`;
  }

  gameState.pocket = roundToTwo(gameState.pocket + sellAmount);
  gameState.holdings.bonds = Math.max(0, roundToTwo(gameState.holdings.bonds - bond.amount));

  gameState.bondInvestments.splice(bondIndex, 1);
  gameSessions.set(sessionId, gameState);
  
  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }
  
  res.json({ success: true, sellAmount, gameState, message });
});

router.post("/stock-buy", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const shares = parseInt(amount);
  const stockPrice = parseFloat(price);
  const totalCost = roundToTwo(shares * stockPrice);

  if (totalCost > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket" });

  gameState.pocket = roundToTwo(gameState.pocket - totalCost);

  if (!gameState.holdings.stocks) gameState.holdings.stocks = {};
  if (!gameState.holdings.stocks[symbol]) gameState.holdings.stocks[symbol] = { shares: 0, avgCost: 0 };

  const holding = gameState.holdings.stocks[symbol];
  const totalShares = holding.shares + shares;
  holding.avgCost = totalShares === 0 ? 0 : (holding.shares * holding.avgCost + totalCost) / totalShares;
  holding.shares = totalShares;

  gameSessions.set(sessionId, gameState);

  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, updatedGameState: gameState });
});

router.post("/stock-sell", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const shares = parseInt(amount);
  const stockPrice = parseFloat(price);

  if (!gameState.holdings.stocks?.[symbol] || shares > gameState.holdings.stocks[symbol].shares) {
    return res.status(400).json({ error: "Invalid sell" });
  }

  const holding = gameState.holdings.stocks[symbol];
  const totalSellValue = roundToTwo(shares * stockPrice);
  const costBasis = shares * holding.avgCost;

  if (!gameState.profit.stocks) gameState.profit.stocks = {};
  if (!gameState.profit.stocks[symbol]) gameState.profit.stocks[symbol] = 0;

  gameState.profit.stocks[symbol] = roundToTwo(gameState.profit.stocks[symbol] + (totalSellValue - costBasis));
  gameState.pocket = roundToTwo(gameState.pocket + totalSellValue);

  holding.shares -= shares;
  if (holding.shares <= 0) delete gameState.holdings.stocks[symbol];

  gameSessions.set(sessionId, gameState);

  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, updatedGameState: gameState });
});

router.post("/currency-buy", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const units = parseInt(amount);
  const currencyPrice = parseFloat(price);
  const totalCost = roundToTwo(units * currencyPrice);

  if (totalCost > gameState.pocket) return res.status(400).json({ error: "Insufficient pocket" });

  gameState.pocket = roundToTwo(gameState.pocket - totalCost);

  if (!gameState.holdings.currencies) gameState.holdings.currencies = {};
  if (!gameState.holdings.currencies[symbol]) gameState.holdings.currencies[symbol] = { units: 0, avgCost: 0 };

  const holding = gameState.holdings.currencies[symbol];
  const totalUnits = holding.units + units;
  holding.avgCost = totalUnits === 0 ? 0 : (holding.units * holding.avgCost + totalCost) / totalUnits;
  holding.units = totalUnits;

  gameSessions.set(sessionId, gameState);

  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, updatedGameState: gameState });
});

router.post("/currency-sell", (req, res) => {
  const { sessionId, symbol, amount, price } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const units = parseInt(amount);
  const currencyPrice = parseFloat(price);

  if (!gameState.holdings.currencies?.[symbol] || units > gameState.holdings.currencies[symbol].units) {
    return res.status(400).json({ error: "Invalid sell" });
  }

  const holding = gameState.holdings.currencies[symbol];
  const totalSellValue = roundToTwo(units * currencyPrice);
  const costBasis = units * holding.avgCost;

  if (!gameState.profit.currencies) gameState.profit.currencies = {};
  if (!gameState.profit.currencies[symbol]) gameState.profit.currencies[symbol] = 0;

  gameState.profit.currencies[symbol] = roundToTwo(gameState.profit.currencies[symbol] + (totalSellValue - costBasis));
  gameState.pocket = roundToTwo(gameState.pocket + totalSellValue);

  holding.units -= units;
  if (holding.units <= 0) delete gameState.holdings.currencies[symbol];

  gameSessions.set(sessionId, gameState);
  
  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  res.json({ success: true, updatedGameState: gameState });
});

router.post("/year-increment", (req, res) => {
  const { sessionId, currentNetWorth } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const val = currentNetWorth ? parseFloat(currentNetWorth) : gameState.pocket;
  gameState.portfolioHistory.push(val);

  if (gameState.currentYear >= (gameState.maxYears || 20)) return res.json({ success: true, gameComplete: true, gameState });

  gameState.currentYear += 1;
  gameState.lastProcessedMonth = 0;
  gameState.currentProgress = 0;

  for (const key in gameState.bondInterestRates) {
    gameState.bondInterestRates[key] = Math.max(0.005, gameState.bondInterestRates[key] * 0.95);
  }

  gameSessions.set(sessionId, gameState);
  
  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

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
  
  // Save to DB
  if (gameState.userId) {
      saveGameToDB(gameState.userId, sessionId, gameState);
  }

  return res.json({ message: "Event applied", gameState });
});

router.post("/end-game", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { sessionId, finalStockPrices, finalCurrencyPrices, botIndexHistory } = req.body;

  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  try {
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

    const finalValue = roundToTwo(
      gameState.pocket +
      gameState.savingsBalance +
      gameState.fundBalance +
      gameState.goldBalance +
      (gameState.holdings.bonds || 0) +
      stockValue +
      currencyValue
    );

    gameState.portfolioHistory.push(finalValue);

    let botScore = 0;
    if (botIndexHistory && Array.isArray(botIndexHistory)) {
      botScore = simulateBot(botIndexHistory);
    } else {
      botScore = gameState.totalInvested * 1.6;
    }

    const assessment = { stars: 0, details: [] };

    const inflationTarget = gameState.totalInvested * 1.3;
    if (finalValue > inflationTarget) {
      assessment.stars++;
      assessment.details.push({ id: "wealth", passed: true, msg: "Beat Inflation" });
    } else {
      assessment.details.push({ id: "wealth", passed: false, msg: "Lost purchasing power" });
    }

    const totalReturn = calculateTotalReturn(gameState.totalInvested, finalValue);
    if (totalReturn > 0.50) {
      assessment.stars++;
      assessment.details.push({ id: "roi", passed: true, msg: `Strong Return (+${(totalReturn * 100).toFixed(1)}%)` });
    } else {
      assessment.details.push({ id: "roi", passed: false, msg: `Low Return (+${(totalReturn * 100).toFixed(1)}%)` });
    }

    let volatilityThreshold = 0.25;
    if (totalReturn > 1.0) volatilityThreshold = 0.50;
    const volatility = calculateVolatility(gameState.portfolioHistory);
    if (volatility < volatilityThreshold) {
      assessment.stars++;
      assessment.details.push({ id: "volatility", passed: true, msg: "Stable Portfolio" });
    } else {
      assessment.details.push({ id: "volatility", passed: false, msg: "Too Volatile" });
    }

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

    const liquidityRatio = (gameState.pocket + gameState.savingsBalance) / finalValue;
    const maxDD = calculateMaxDrawdown(gameState.portfolioHistory);

    if (maxDD > -0.30 && liquidityRatio > 0.05) {
      assessment.stars++;
      assessment.details.push({ id: "risk", passed: true, msg: "Resilient & Liquid" });
    } else {
      if (liquidityRatio <= 0.05) assessment.details.push({ id: "risk", passed: false, msg: "No Emergency Fund" });
      else assessment.details.push({ id: "risk", passed: false, msg: `Big Crash (${(maxDD * 100).toFixed(1)}%)` });
    }

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

    const roundedScore = Math.round(finalValue);
    const scoreSql = `INSERT INTO score_history (user_id, score, star, played_at) VALUES (?, ?, ?, NOW())`;

    db.query(scoreSql, [userId, roundedScore, assessment.stars], (err, result) => {
      if (err) {
        console.error("Score save error:", err);
        return res.status(500).json({ success: false, message: "Failed to save score" });
      }

      const scoreId = result.insertId;

      if (unlockedCodes.length > 0) {
        const codesString = unlockedCodes.map(c => `'${c}'`).join(",");
        const findSql = `SELECT id, code FROM achievements WHERE code IN (${codesString})`;

        db.query(findSql, [], (err, rows) => {
          if (err) {
            console.error("Achievement lookup error:", err);
          } else if (rows.length > 0) {
            const insertValues = rows.map(row => [userId, row.id, scoreId]);
            const insertSql = `INSERT IGNORE INTO user_achievements (user_id, achievement_id, score_id) VALUES ?`;

            db.query(insertSql, [insertValues], (err) => {
              if (err) console.error("Achievement insert error:", err);
            });
          }
        });
      }

      // Clear from Memory
      gameSessions.delete(sessionId);
      
      // Clear from DB
      deleteGameFromDB(userId);

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

router.get("/tutorial-progress", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `SELECT MAX(tutorial_level) as max_level FROM tutorial_progress WHERE user_id = ?`;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch tutorial progress" 
      });
    }

    let tutorialLevel = 0;
    if (results.length > 0 && results[0].max_level !== null) {
      tutorialLevel = results[0].max_level;
    }

    // Define section unlock mapping
    // Level 1: Savings
    // Level 2: Bonds
    // Level 3: Index
    // Level 4: Stocks
    // Level 5: Gold
    // Level 6: Currency
    const unlockedSections = [];
    
    if (tutorialLevel >= 1) unlockedSections.push('savings');
    if (tutorialLevel >= 2) unlockedSections.push('bonds');
    if (tutorialLevel >= 3) unlockedSections.push('index');
    if (tutorialLevel >= 4) unlockedSections.push('stocks');
    if (tutorialLevel >= 5) unlockedSections.push('gold');
    if (tutorialLevel >= 6) unlockedSections.push('currency');

    res.json({
      success: true,
      tutorialLevel,
      unlockedSections
    });
  });
});


router.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  gameSessions.delete(sessionId);
  res.json({ success: true, message: "Session deleted" });
});

export default router;