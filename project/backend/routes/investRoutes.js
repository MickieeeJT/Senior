import express from "express";
const router = express.Router();

// POST /api/invest/calculate
router.post("/calculate", (req, res) => {
	const { action, amount, currentPocket, currentSavingsBalance, currentProfit, currentHoldings } = req.body;

	let newPocket = currentPocket;
	let newSavingsBalance = currentSavingsBalance;
	let newProfit = { ...currentProfit };
	let newHoldings = { ...currentHoldings };

	// 💰 Handle savings account transactions
	if (action === "savings-deposit") {
		if (amount > currentPocket) {
			return res.status(400).json({ error: "Insufficient pocket money" });
		}
		newPocket -= amount;
		newSavingsBalance += amount;
	}
	else if (action === "savings-withdraw") {
		if (amount > currentSavingsBalance) {
			return res.status(400).json({ error: "Insufficient savings balance" });
		}
		newSavingsBalance -= amount;
		newPocket += amount;
	}
	// 💰 Handle other investments (bonds, index, gold)
	else if (action.includes("buy")) {
		if (amount > currentPocket) {
			return res.status(400).json({ error: "Insufficient pocket money" });
		}
		newPocket -= amount;
		
		// Track holdings
		if (action.includes("bond")) {
			newHoldings.bonds = (newHoldings.bonds || 0) + amount;
		} else if (action.includes("index")) {
			newHoldings.index = (newHoldings.index || 0) + amount;
		} else if (action.includes("gold")) {
			newHoldings.gold = (newHoldings.gold || 0) + amount;
		}
	}
	else if (action.includes("sell")) {
		newPocket += amount;
		
		// Reduce holdings
		if (action.includes("bond")) {
			newHoldings.bonds = Math.max(0, (newHoldings.bonds || 0) - amount);
		} else if (action.includes("index")) {
			newHoldings.index = Math.max(0, (newHoldings.index || 0) - amount);
		} else if (action.includes("gold")) {
			newHoldings.gold = Math.max(0, (newHoldings.gold || 0) - amount);
		}
	}

	// 📈 Profit calculation (simplified - adjust rates as needed)
	if (action.includes("bond")) newProfit.bonds += amount * 0.02;
	else if (action.includes("index")) newProfit.index += amount * 0.03;
	else if (action.includes("gold")) newProfit.gold += amount * 0.015;

	res.json({
		newPocket,
		newSavingsBalance,
		newProfit,
		newHoldings,
	});
});

// Monthly interest update
router.post("/updateInterest", (req, res) => {
	const { currentSavingsBalance, currentProfit } = req.body;
	
	const monthlyRate = 0.01; // 1% interest per month
	const interest = currentSavingsBalance * monthlyRate;

	const newSavingsBalance = currentSavingsBalance + interest;
	const newProfit = {
		...currentProfit,
		savings: currentProfit.savings + interest
	};

	res.json({
		message: "Monthly savings interest added",
		newSavingsBalance,
		newProfit,
		interestGained: interest,
	});
});

export default router;