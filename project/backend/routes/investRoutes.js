import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { generateScenario } from "../utils/scenarioGenerator.js";
import db from "../config/db.js";

const router = express.Router();

// Memory Cache for storing data while players have the game open
const gameSessions = new Map();
const botSessions = new Map();

// --- HELPER: Save State to DB ---
const saveGameToDB = async (userId, sessionId, gameState, botState = null) => {
    const jsonState = JSON.stringify(gameState);
    const jsonBotState = botState ? JSON.stringify(botState) : JSON.stringify({});
    
    const sql = `
        INSERT INTO active_sessions (user_id, session_id, game_state, bot_state) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (user_id) DO UPDATE SET
        session_id = EXCLUDED.session_id, 
        game_state = EXCLUDED.game_state,
        bot_state = EXCLUDED.bot_state
    `;
    try {
        await db.query(sql, [userId, sessionId, jsonState, jsonBotState]);
    } catch (err) {
        console.error("Error saving game/bot state:", err);
    }
};

// --- HELPER: Delete State from DB ---
const deleteGameFromDB = async (userId) => {
    const sql = "DELETE FROM active_sessions WHERE user_id = $1";
    try {
        await db.query(sql, [userId]);
    } catch (err) {
        console.error("Error deleting game state:", err);
    }
};

// --- HELPERS (Math & Stats) ---
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

// --- THE OMNI-BOT ---
const calculateSmartBotState = (currentBotState, marketHistory, incomeAdded = 0, currentMonth = 0, currentYear = 0) => {
  // 1. Extract Current Prices (Default to 1 to prevent division by zero)
  const indexPrice = marketHistory?.index?.close || 1;
  const goldPrice = marketHistory?.gold?.close || 1;
  const stockPrices = marketHistory?.stocks || {};
  const currencyPrices = marketHistory?.currencies || {};

  // 2. Initialize Bot State Arrays/Objects if missing
  let indexShares = currentBotState?.indexShares || 0;
  let goldShares = currentBotState?.goldShares || 0;
  let stockShares = currentBotState?.stockShares || {};
  let currencyUnits = currentBotState?.currencyUnits || {};
  
  let updatedSavings = (currentBotState?.savingsBalance || 0) * (1 + (0.015 / 12));
  let updatedBonds = (currentBotState?.bondBalance || 0) * (1 + (0.04 / 12)); 

  // 3. Calculate Current Values of Variable Assets
  let updatedFund = indexShares * indexPrice;
  let updatedGold = goldShares * goldPrice;
  
  let updatedStocks = 0;
  for (const [symbol, shares] of Object.entries(stockShares)) {
      updatedStocks += shares * (stockPrices[symbol]?.close || 1);
  }

  let updatedCrypto = 0;
  for (const [symbol, units] of Object.entries(currencyUnits)) {
      updatedCrypto += units * (currencyPrices[symbol]?.close || 1);
  }

  // 4. Target Weights for the Omni-Portfolio
  const weights = { savings: 0.10, bonds: 0.15, fund: 0.35, gold: 0.10, stocks: 0.20, crypto: 0.10 };

  // 5. Apply Income using Target Weights
  if (incomeAdded > 0) {
      updatedSavings += incomeAdded * weights.savings;
      updatedBonds += incomeAdded * weights.bonds;
      
      indexShares += (incomeAdded * weights.fund) / indexPrice;
      updatedFund += incomeAdded * weights.fund;

      goldShares += (incomeAdded * weights.gold) / goldPrice;
      updatedGold += incomeAdded * weights.gold;

      const availableStocks = Object.keys(stockPrices);
      if (availableStocks.length > 0) {
          const moneyPerStock = (incomeAdded * weights.stocks) / availableStocks.length;
          availableStocks.forEach(symbol => {
              if (!stockShares[symbol]) stockShares[symbol] = 0;
              stockShares[symbol] += moneyPerStock / (stockPrices[symbol].close || 1);
              updatedStocks += moneyPerStock;
          });
      } else {
          // Store as cash if no stocks are available
          updatedSavings += incomeAdded * weights.stocks; 
      }

      const availableCrypto = Object.keys(currencyPrices);
      if (availableCrypto.length > 0) {
          const moneyPerCrypto = (incomeAdded * weights.crypto) / availableCrypto.length;
          availableCrypto.forEach(symbol => {
              if (!currencyUnits[symbol]) currencyUnits[symbol] = 0;
              currencyUnits[symbol] += moneyPerCrypto / (currencyPrices[symbol].close || 1);
              updatedCrypto += moneyPerCrypto;
          });
      } else {
          // Store as cash if no crypto is available
          updatedSavings += incomeAdded * weights.crypto; 
      }
  }

  const currentWealth = updatedSavings + updatedBonds + updatedFund + updatedGold + updatedStocks + updatedCrypto;

  // 6. Annual Rebalancing (December)
  if (currentMonth === 12) {
      updatedSavings = currentWealth * weights.savings;
      updatedBonds = currentWealth * weights.bonds;
      
      updatedFund = currentWealth * weights.fund;
      indexShares = updatedFund / indexPrice;
      
      updatedGold = currentWealth * weights.gold;
      goldShares = updatedGold / goldPrice;

      // Stocks
      const targetTotalStocks = currentWealth * weights.stocks;
      const availableStocks = Object.keys(stockPrices);
      if (availableStocks.length > 0) {
          const targetPerStock = targetTotalStocks / availableStocks.length;
          availableStocks.forEach(symbol => { 
              stockShares[symbol] = targetPerStock / (stockPrices[symbol].close || 1); 
          });
          updatedStocks = targetTotalStocks; 
      } else {
          // Fix: Return the 20% allocated for stocks back to savings
          updatedSavings += targetTotalStocks;
          updatedStocks = 0;
      }

      // Crypto/Currency
      const targetTotalCrypto = currentWealth * weights.crypto;
      const availableCrypto = Object.keys(currencyPrices);
      if (availableCrypto.length > 0) {
          const targetPerCrypto = targetTotalCrypto / availableCrypto.length;
          availableCrypto.forEach(symbol => { 
              currencyUnits[symbol] = targetPerCrypto / (currencyPrices[symbol].close || 1); 
          });
          updatedCrypto = targetTotalCrypto;
      } else {
           // Fix: Return the 10% allocated for crypto back to savings
          updatedSavings += targetTotalCrypto;
          updatedCrypto = 0;
      }
      
      console.log(`[OMNI-BOT: Year ${currentYear} Rebalance] Net Worth: $${currentWealth.toFixed(0)}`);
  }

  // Calculate final accurate wealth after rebalancing
  const finalWealth = updatedSavings + updatedBonds + updatedFund + updatedGold + updatedStocks + updatedCrypto;

  return {
      pocket: 0,
      savingsBalance: roundToTwo(updatedSavings),
      bondBalance: roundToTwo(updatedBonds),
      fundBalance: roundToTwo(updatedFund),
      goldBalance: roundToTwo(updatedGold),
      indexShares: indexShares,
      goldShares: goldShares,
      stockShares: stockShares,
      currencyUnits: currencyUnits,
      totalNetWorth: roundToTwo(finalWealth)
  };
};

// --- 5-DIMENSION METRICS LOGIC ---
const calculateMetrics = (finalState, startingMoney = 4000) => {
  if (!finalState) return { returnScore: 0, diversification: 0, riskTaking: 0, safety: 0, accuracy: 0 };

  const pocket = finalState.pocket || 0;
  const savings = finalState.savingsBalance || 0;
  const fund = finalState.fundBalance || 0;
  const gold = finalState.goldBalance || 0;
  
  // Handle Player vs Bot structure differences
  const bonds = finalState.holdings?.bonds || finalState.bondBalance || 0;
  
  let stocks = 0;
  if (finalState.holdings?.stocks) {
    Object.values(finalState.holdings.stocks).forEach(s => stocks += (s.shares * s.avgCost));
  } else if (finalState.botSimulatedStocksValue) {
    stocks = finalState.botSimulatedStocksValue;
  }
  
  let crypto = 0;
  if (finalState.holdings?.currencies) {
    Object.values(finalState.holdings.currencies).forEach(c => crypto += (c.units * c.avgCost));
  } else if (finalState.botSimulatedCryptoValue) {
    crypto = finalState.botSimulatedCryptoValue;
  }

  const totalNetWorth = finalState.totalNetWorth || (pocket + savings + fund + gold + bonds + stocks + crypto);
  const profit = totalNetWorth - startingMoney;

  const returnScore = Math.min(100, Math.max(0, (profit / startingMoney) * 100));

  const assets = [savings, fund, gold, bonds, stocks, crypto];
  const nonZeroAssets = assets.filter(a => a > 0).length;
  const divScore = Math.min(100, (nonZeroAssets / 4) * 100);

  const riskyAssets = fund + gold + stocks + crypto;
  const riskScore = totalNetWorth > 0 ? Math.min(100, (riskyAssets / totalNetWorth) * 100) : 0;

  const safetyAssets = pocket + savings + bonds;
  const safetyScore = totalNetWorth > 0 ? Math.min(100, (safetyAssets / totalNetWorth) * 100) : 0;

  const accuracyScore = Math.min(100, Math.random() * 40 + 60);

  return {
      returnScore: Math.round(returnScore),
      diversification: Math.round(divScore),
      riskTaking: Math.round(riskScore),
      safety: Math.round(safetyScore),
      accuracy: Math.round(accuracyScore)
  };
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

router.get("/check-session", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = "SELECT session_id, game_state, bot_state FROM active_sessions WHERE user_id = $1";
    const result = await db.query(sql, [userId]);

    if (result.rows.length > 0) {
      const savedSession = result.rows[0];
      let parsedState;
      try {
        parsedState = typeof savedSession.game_state === 'string' ? JSON.parse(savedSession.game_state) : savedSession.game_state;
      } catch (e) {
        console.error("Error parsing game state:", e);
        return res.json({ hasSession: false });
      }

      let totalAssets = (parsedState.pocket || 0) +
        (parsedState.savingsBalance || 0) +
        (parsedState.fundBalance || 0) +
        (parsedState.goldBalance || 0) +
        (parsedState.holdings?.bonds || 0);

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- INIT ROUTE: Segmented Category Saving (One Row, Multiple Columns) ---
router.post("/init", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { forceNew, duration, targetAmount } = req.body;

  const maxYears = duration ? parseInt(duration) : 40;
  const finalTargetAmount = targetAmount ? parseFloat(targetAmount) : 1000000;

  try {
      const checkResult = await db.query("SELECT session_id, game_state, bot_state FROM active_sessions WHERE user_id = $1", [userId]);

      // --- RESUME EXISTING GAME ---
      if (checkResult.rows.length > 0 && !forceNew) {
        const savedSession = checkResult.rows[0];
        const parsedState = typeof savedSession.game_state === 'string' ? JSON.parse(savedSession.game_state) : savedSession.game_state;
        const parsedBotState = savedSession.bot_state ? (typeof savedSession.bot_state === 'string' ? JSON.parse(savedSession.bot_state) : savedSession.bot_state) : {};

        // Fetch the single row of categorized scenario data
        const scenarioResult = await db.query("SELECT * FROM session_scenarios WHERE session_id = $1", [savedSession.session_id]);
        
        let parsedScenario = { events: [], assets: {}, totalWeeks: parsedState.maxYears * 52 };
        
        if (scenarioResult.rows.length > 0) {
            const scenarioData = scenarioResult.rows[0];
            
            // Reconstruct the events
            if (scenarioData.events_data) {
                parsedScenario.events = JSON.parse(scenarioData.events_data);
            }
            
            // Reconstruct all assets into the single 'assets' object
            const categories = ['stocks_data', 'currencies_data', 'index_data', 'gold_data', 'bonds_data'];
            categories.forEach(cat => {
                if (scenarioData[cat]) {
                    const catAssets = JSON.parse(scenarioData[cat]);
                    // catAssets is an object where keys are asset names and values are their data
                    Object.assign(parsedScenario.assets, catAssets);
                }
            });
        }

        gameSessions.set(savedSession.session_id, parsedState);
        botSessions.set(savedSession.session_id, parsedBotState);
        parsedState.userId = userId;

        return res.json({ 
          success: true, 
          message: "Game Resumed", 
          sessionId: savedSession.session_id, 
          gameState: parsedState,
          scenarioData: parsedScenario
        });
      }

      // --- START NEW GAME ---
      if (checkResult.rows.length > 0 && forceNew) {
           gameSessions.delete(checkResult.rows[0].session_id);
           botSessions.delete(checkResult.rows[0].session_id);
           await db.query("DELETE FROM active_sessions WHERE user_id = $1", [userId]);
           await db.query("DELETE FROM session_scenarios WHERE session_id = $1", [checkResult.rows[0].session_id]);
      }

      const sessionId = Date.now().toString();
      const baseRate = 0.03 + Math.random() * 0.02;

      const bondInterestRates = {
        "1 year": baseRate,
        "5 years": baseRate + 0.015 + (Math.random() * 0.01),
        "10 years": baseRate + 0.03 + (Math.random() * 0.015),
      };
      const initialCapital = 4000;
      
      // Generate full scenario Graph
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
        currentMonth: 1, 
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

      // Omni-Bot Initial State
      const initialBotState = {
        pocket: 0,
        savingsBalance: initialCapital * 0.10,
        bondBalance: initialCapital * 0.15,
        fundBalance: initialCapital * 0.35,
        goldBalance: initialCapital * 0.10,
        indexShares: 0,
        goldShares: 0,
        stockShares: {}, 
        currencyUnits: {}, 
        totalNetWorth: initialCapital
      };

      gameSessions.set(sessionId, gameState);
      botSessions.set(sessionId, initialBotState);
      
      const jsonState = JSON.stringify(gameState);
      const jsonBotState = JSON.stringify(initialBotState);

      // Save Primary Game State
      await db.query(
          "INSERT INTO active_sessions (user_id, session_id, game_state, bot_state) VALUES ($1, $2, $3, $4)",
          [userId, sessionId, jsonState, jsonBotState]
      );

      // Organize Scenario Data by Category
      const categorizedData = {
          stocks: {},
          currencies: {},
          index: {},
          gold: {},
          bonds: {}
      };

      Object.values(newScenario.assets).forEach(asset => {
          if (categorizedData[asset.category] !== undefined) {
              categorizedData[asset.category][asset.name] = asset;
          }
      });

      // Save Scenario Data in CHUNKS to bypass max_allowed_packet limit
      
      // Create an empty row first
      await db.query(
          "INSERT INTO session_scenarios (session_id) VALUES ($1)",
          [sessionId]
      );

      // Update one column at a time to distribute data size per query
      const updateQueries = [];
      
      const scenarioEventsJSON = JSON.stringify(newScenario.events);
      if (scenarioEventsJSON.length > 2) {
          updateQueries.push(db.query(
              "UPDATE session_scenarios SET events_data = $1 WHERE session_id = $2",
              [scenarioEventsJSON, sessionId]
          ));
      }

      const stocksJSON = JSON.stringify(categorizedData.stocks);
      if (stocksJSON.length > 2) {
          updateQueries.push(db.query(
              "UPDATE session_scenarios SET stocks_data = $1 WHERE session_id = $2",
              [stocksJSON, sessionId]
          ));
      }

      const currenciesJSON = JSON.stringify(categorizedData.currencies);
      if (currenciesJSON.length > 2) {
          updateQueries.push(db.query(
              "UPDATE session_scenarios SET currencies_data = $1 WHERE session_id = $2",
              [currenciesJSON, sessionId]
          ));
      }

      const indexJSON = JSON.stringify(categorizedData.index);
      if (indexJSON.length > 2) {
          updateQueries.push(db.query(
              "UPDATE session_scenarios SET index_data = $1 WHERE session_id = $2",
              [indexJSON, sessionId]
          ));
      }

      const goldJSON = JSON.stringify(categorizedData.gold);
      if (goldJSON.length > 2) {
          updateQueries.push(db.query(
              "UPDATE session_scenarios SET gold_data = $1 WHERE session_id = $2",
              [goldJSON, sessionId]
          ));
      }

      const bondsJSON = JSON.stringify(categorizedData.bonds);
      if (bondsJSON.length > 2) {
          updateQueries.push(db.query(
              "UPDATE session_scenarios SET bonds_data = $1 WHERE session_id = $2",
              [bondsJSON, sessionId]
          ));
      }

      // Wait for all sub-queries to finish
      await Promise.all(updateQueries);
          
      res.json({ 
          sessionId, 
          gameState, 
          scenarioData: newScenario,
          message: "New Game Started" 
      });

  } catch (error) {
      console.error("Error creating/resuming game:", error);
      res.status(500).json({ error: "Failed to process game session" });
  }
});

router.get("/state/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  res.json(gameState);
});

router.post("/transaction", async (req, res) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/monthly-update", async (req, res) => {
  const { sessionId, month, progress, indexData, goldData, stockData, currencyData } = req.body;
  const gameState = gameSessions.get(sessionId);
  let botState = botSessions.get(sessionId);
  
  if (!gameState) return res.status(404).json({ error: "Session not found" });
  
  if (month <= gameState.lastProcessedMonth) {
      return res.json({ success: true, message: "Already processed", gameState });
  }

  const interest = gameState.savingsBalance * 0.015;
  gameState.savingsBalance = roundToTwo(gameState.savingsBalance + interest);
  gameState.profit.savings = roundToTwo(gameState.profit.savings + interest);

  if (indexData && gameState.indexShares > 0) gameState.fundBalance = roundToTwo(gameState.fundBalance * (1 + indexData.change / 100));
  if (goldData && gameState.goldShares > 0) gameState.goldBalance = roundToTwo(gameState.goldBalance * (1 + goldData.change / 100));

  let incomeAdded = 0;
  if (month === 6 || month === 12) {
    gameState.pocket += 4000;
    gameState.totalInvested += 4000;
    incomeAdded = 4000;
  }

  // IMPORTANT: Save position for resume
  gameState.lastProcessedMonth = month;
  gameState.currentMonth = month;
  if (progress !== undefined) {
      gameState.currentProgress = progress;
  }
  
  if (!botState) botState = { pocket: 0, savingsBalance: 400, bondBalance: 600, fundBalance: 1400, goldBalance: 400, indexShares: 0, goldShares: 0, stockShares: {}, currencyUnits: {}, totalNetWorth: 4000 };
  
  const marketHistory = {
      index: indexData,
      gold: goldData,
      stocks: stockData || {},
      currencies: currencyData || {}
  };

  const nextBotState = calculateSmartBotState(botState, marketHistory, incomeAdded, month, gameState.currentYear);
  
  gameSessions.set(sessionId, gameState);
  botSessions.set(sessionId, nextBotState);
  
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, nextBotState);
  }

  res.json({ success: true, gameState, botState: nextBotState });
});

router.post("/bond-update", async (req, res) => {
  const { sessionId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const maturedBonds = [];
  if (gameState.bondInvestments) {
      gameState.bondInvestments.forEach((inv) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, gameState, maturedBonds });
});

router.post("/gold-update", async (req, res) => {
  const { sessionId, goldData } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  if (goldData && gameState.goldShares > 0) {
      const currentValue = gameState.goldShares * goldData.close;
      gameState.goldBalance = roundToTwo(currentValue);
  }
  
  gameSessions.set(sessionId, gameState);
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/bond-sell", async (req, res) => {
  const { sessionId, bondId } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  const bondIndex = gameState.bondInvestments.findIndex((b) => b.id === bondId);
  if (bondIndex === -1) return res.status(404).json({ error: "Bond not found" });

  const bond = gameState.bondInvestments[bondIndex];

  let sellAmount = 0;
  let message = "";

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
  
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, sellAmount, gameState, message });
});

router.post("/stock-buy", async (req, res) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/stock-sell", async (req, res) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/currency-buy", async (req, res) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/currency-sell", async (req, res) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, updatedGameState: gameState });
});

router.post("/year-increment", async (req, res) => {
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
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  res.json({ success: true, gameState });
});

router.post("/apply-event", async (req, res) => {
  const { sessionId, effect } = req.body;
  const gameState = gameSessions.get(sessionId);
  if (!gameState) return res.status(400).json({ error: "Invalid session" });

  const amount = effect.amount || 0;
  gameState.pocket += amount;
  if (gameState.pocket < 0) gameState.pocket = 0;

  gameSessions.set(sessionId, gameState);
  if (gameState.userId) {
      await saveGameToDB(gameState.userId, sessionId, gameState, botSessions.get(sessionId));
  }
  return res.json({ message: "Event applied", gameState });
});

// --- END-GAME: Summarize and Send Bot Data for Pie Chart ---
router.post("/end-game", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { sessionId, finalStockPrices, finalCurrencyPrices, finalBotState } = req.body;

  const gameState = gameSessions.get(sessionId);
  let botState = finalBotState || botSessions.get(sessionId);
  
  if (!botState || !botState.totalNetWorth) {
    botState = {
      pocket: 0, savingsBalance: 400, bondBalance: 600, fundBalance: 1400, goldBalance: 400, indexShares: 0, goldShares: 0, stockShares: {}, currencyUnits: {}, totalNetWorth: 4000
    };
  }
  
  if (!gameState) return res.status(404).json({ error: "Session not found" });

  try {
    let stockValue = 0;
    if (gameState.holdings?.stocks) {
      for (const [symbol, holding] of Object.entries(gameState.holdings.stocks)) {
        const currentPrice = finalStockPrices?.[symbol] || 0;
        stockValue += currentPrice * holding.shares;
      }
    }

    let currencyValue = 0;
    if (gameState.holdings?.currencies) {
      for (const [symbol, holding] of Object.entries(gameState.holdings.currencies)) {
        const currentPrice = finalCurrencyPrices?.[symbol] || 0;
        currencyValue += currentPrice * holding.units;
      }
    }

    const finalValue = roundToTwo(
      gameState.pocket +
      gameState.savingsBalance +
      gameState.fundBalance +
      gameState.goldBalance +
      (gameState.holdings?.bonds || 0) +
      stockValue +
      currencyValue
    );

    if (!gameState.portfolioHistory) gameState.portfolioHistory = [];
    gameState.portfolioHistory.push(finalValue);
    
    const botScore = botState.totalNetWorth;
    const assessment = { stars: 0, details: [] };

    const inflationTarget = (gameState.totalInvested || 4000) * 1.3;
    if (finalValue > inflationTarget) {
      assessment.stars++;
      assessment.details.push({ id: "wealth", passed: true, msg: "Beat Inflation" });
    } else {
      assessment.details.push({ id: "wealth", passed: false, msg: "Lost purchasing power" });
    }

    const totalReturn = calculateTotalReturn(gameState.totalInvested || 4000, finalValue);
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
      bonds: gameState.holdings?.bonds || 0,
      funds: gameState.fundBalance,
      stocks: stockValue,
      gold: gameState.goldBalance,
      crypto: currencyValue
    };
    
    // Prepare bot data payload for Donut Chart covering all assets
    let botStocksValue = 0;
    if (botState.stockShares) {
        for (const [symbol, shares] of Object.entries(botState.stockShares)) {
            botStocksValue += shares * (finalStockPrices?.[symbol] || 1);
        }
    }
    
    let botCurrencyValue = 0;
    if (botState.currencyUnits) {
        for (const [symbol, units] of Object.entries(botState.currencyUnits)) {
            botCurrencyValue += units * (finalCurrencyPrices?.[symbol] || 1);
        }
    }

    // Create Pie Chart data
    const botAssetBreakdown = [
      { name: "Cash", value: botState.savingsBalance || 0, color: "#33ff33" },
      { name: "Bonds", value: botState.bondBalance || 0, color: "#11942F" },
      { name: "Index Fund", value: botState.fundBalance || 0, color: "#5EBD50" },
      { name: "Gold", value: botState.goldBalance || 0, color: "#B7FD5E" }
    ];
    
    // Separate Stocks display
    if (botStocksValue > 0) {
        botAssetBreakdown.push({ name: "Stocks", value: botStocksValue, color: "#ffffff" }); 
    }
    // Separate Currencies display (Renamed from Crypto)
    if (botCurrencyValue > 0) {
        botAssetBreakdown.push({ name: "Currencies", value: botCurrencyValue, color: "#00ffff" }); 
    }
    
    // Pass to Metrics calculation
    botState.botSimulatedStocksValue = botStocksValue;
    botState.botSimulatedCryptoValue = botCurrencyValue; 
    
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

    const unlockedCodes = checkAchievements(gameState, finalValue, totalReturn, maxDD, stockValue, currencyValue, botScore, assessment.stars);
    const roundedScore = Math.round(finalValue);
    
    const playerMetrics = calculateMetrics(gameState);
    const botMetrics = calculateMetrics(botState);

    console.log("---------------------------------------------------");
    console.log(`[GAME END] Match Summary`);
    console.log(`Player Score: $${finalValue.toLocaleString()}`);
    console.log(`AI Bot Score: $${botScore.toLocaleString()}`);
    console.log("---------------------------------------------------");

    try {
      const scoreSql = `INSERT INTO score_history (user_id, score, star, played_at) VALUES ($1, $2, $3, NOW())`;
      const scoreResult = await db.query(scoreSql, [userId, roundedScore, assessment.stars]);
      
      // Get the ID of the inserted score (this varies depending on your implementation)
      // For now, we'll use the current timestamp as a unique identifier
      const scoreId = Date.now();

      if (unlockedCodes.length > 0) {
        const codesPlaceholders = unlockedCodes.map((_, i) => `$${i + 1}`).join(",");
        const findSql = `SELECT id, code FROM achievements WHERE code IN (${codesPlaceholders})`;

        const achievementsResult = await db.query(findSql, unlockedCodes);
        
        if (achievementsResult.rows.length > 0) {
          for (const row of achievementsResult.rows) {
            const insertSql = `INSERT INTO user_achievements (user_id, achievement_id, score_id) 
                               VALUES ($1, $2, $3) 
                               ON CONFLICT DO NOTHING`;
            await db.query(insertSql, [userId, row.id, scoreId]);
          }
        }
      }

      gameSessions.delete(sessionId);
      botSessions.delete(sessionId);
      await deleteGameFromDB(userId);
      
      // CLEANUP: Delete associated scenario data to keep the database clean
      await db.query("DELETE FROM session_scenarios WHERE session_id = $1", [sessionId]);

      res.json({
        success: true,
        score: roundedScore,
        botFinalValue: Math.round(botScore),
        botScore: Math.round(botScore),
        star: assessment.stars,
        details: assessment.details,
        playerMetrics: playerMetrics,  
        botMetrics: botMetrics,        
        botAssetBreakdown: botAssetBreakdown, 
        metrics: { roi: totalReturn, volatility: maxDD, maxDrawdown: maxDD },
        newAchievements: unlockedCodes
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      res.status(500).json({ success: false, message: "Failed to save score" });
    }

  } catch (error) {
    console.error("Calculation error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/tutorial-progress", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = `SELECT MAX(tutorial_level) as max_level FROM tutorial_progress WHERE user_id = $1`;
    const result = await db.query(sql, [userId]);

    let tutorialLevel = result.rows.length > 0 && result.rows[0].max_level !== null ? result.rows[0].max_level : 0;
    const unlockedSections = [];
    if (tutorialLevel >= 1) unlockedSections.push('savings');
    if (tutorialLevel >= 2) unlockedSections.push('bonds');
    if (tutorialLevel >= 3) unlockedSections.push('index');
    if (tutorialLevel >= 4) unlockedSections.push('stocks');
    if (tutorialLevel >= 5) unlockedSections.push('gold');
    if (tutorialLevel >= 6) unlockedSections.push('currency');

    res.json({ success: true, tutorialLevel, unlockedSections });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch tutorial progress" });
  }
});

router.delete("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  gameSessions.delete(sessionId);
  botSessions.delete(sessionId);
  
  try {
    // CLEANUP: Delete associated scenario data when a session is manually deleted
    await db.query("DELETE FROM session_scenarios WHERE session_id = $1", [sessionId]);
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ success: false, error: "Failed to delete session" });
  }
});

export default router;