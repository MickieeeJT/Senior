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
    indexShares: 0,
    indexAvgPrice: 0,
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
  const { sessionId, action, amount, bondType, indexValue } = req.body;
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
      gameState.indexAvgPrice = (gameState.indexAvgPrice * (totalShares - sharesBought) + value) / totalShares;
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
    gameState.holdings.index = Math.max(0, gameState.holdings.index - costBasis);
    gameState.profit.index += profitAmount;
  }

  // GOLD BUY
  else if (action === "gold-buy") {
    if (value > gameState.pocket) {
      return res.status(400).json({ error: "Insufficient pocket money" });
    }
    gameState.pocket -= value;
    gameState.holdings.gold += value;
  }

  // GOLD SELL
  else if (action === "gold-sell") {
    if (value > gameState.holdings.gold) {
      return res.status(400).json({ error: "Insufficient gold holdings" });
    }
    gameState.holdings.gold -= value;
    gameState.pocket += value;
    const profitAmount = value * 0.015;
    gameState.profit.gold += profitAmount;
  }

  else {
    return res.status(400).json({ error: "Invalid action" });
  }

  gameSessions.set(sessionId, gameState);
  res.json({ success: true, gameState });
});

// Monthly update (called by frontend timer)
router.post("/monthly-update", (req, res) => {
  const { sessionId, month, indexData } = req.body;
  const gameState = gameSessions.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (month <= gameState.lastProcessedMonth) {
    return res.json({ success: true, message: "Already processed", gameState });
  }

  // Update savings interest (1.5% monthly)
  const monthlyRate = 0.015;
  const interest = gameState.savingsBalance * monthlyRate;
  gameState.savingsBalance += interest;
  gameState.profit.savings += interest;

  // Update index fund value
  if (indexData) {
    const changePercent = indexData.change / 100;
    gameState.fundBalance *= (1 + changePercent);
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

// Bond early sell (manual collect with 10% penalty)
router.post("/bond-sell", (req, res) => {
	const { sessionId, bondId } = req.body;
	const gameState = gameSessions.get(sessionId);

	if (!gameState) {
		return res.status(404).json({ error: "Session not found" });
	}

	const bondIndex = gameState.bondInvestments.findIndex((b) => b.id === bondId);
	if (bondIndex === -1) {
		return res.status(404).json({ error: "Bond not found" });
	}

	const bond = gameState.bondInvestments[bondIndex];

	// 💸 Apply 10% penalty
	const sellAmount = bond.amount * 0.9;

	// Add money to pocket
	gameState.pocket += sellAmount;

	// Adjust holdings
	gameState.holdings.bonds = Math.max(0, gameState.holdings.bonds - bond.amount);

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

// Delete session (cleanup)
router.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  gameSessions.delete(sessionId);
  res.json({ success: true, message: "Session deleted" });
});

export default router;