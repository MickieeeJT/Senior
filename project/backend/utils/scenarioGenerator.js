import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES_FILE = path.join(__dirname, '../data/baseRules.json');
const EVENTS_FILE = path.join(__dirname, '../data/eventsTemplate.json');

// --- Fake Names for Game Assets ---
const FAKE_STOCKS = [
    "Quantum Tech", "Apex Dynamics", "Stellar Logistics", "Nova Healthcare", 
    "Horizon Finance", "Zenith Retail", "Cyberdyne Systems", "Wayne Enterprises", 
    "Stark Industries", "Massive Dynamic", "Acme Corp", "Globex Corporation"
];
const FAKE_CURRENCIES = ["Neo-Dollar (ND)", "Euro-Coin (EC)", "Yen-Prime (YP)", "Brit-Pound (BP)"];
const FAKE_INDEX = ["Global Top 50", "Market Vanguard", "Apex Index"];
const FAKE_GOLD = ["Gold"];

// --- Helper Math Functions for Simulation ---

// Original Function (Box-Muller transform)
function randomNormal(mean, stdDev) {
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

// Poisson Random Function to calculate the number of jumps
function randomPoisson(lambda) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

// --- Main Function for simulating returns using the Jump Diffusion Model ----
function calculateWeeklyReturn(mu, sigma, driftModifier = 0, eventSeverity = 0) {
    // Base values for normal market conditions
    let currentSigma = sigma;
    let jumpProbability = 0.03; // Normal probability: 3% per week
    let jumpMean = -0.05;       // Average jump effect (usually negative)
    let jumpVol = 0.08;

    // --- MECHANIC: When an Event Card is active, the market becomes highly volatile ---
    if (eventSeverity > 0) {
        // Increase overall market volatility (50% increase per severity level)
        currentSigma = sigma * (1 + (eventSeverity * 0.5)); 
        
        // Significantly increase the probability of a jump (sell-off/surge)
        jumpProbability = 0.03 + (eventSeverity * 0.04); 
        
        // Jump direction based on the Event (Good news = Upward Jump / Bad news = Downward Jump)
        if (driftModifier < 0) {
            jumpMean = -0.05 - (eventSeverity * 0.02); // Bad news = Deeper drop than normal
        } else if (driftModifier > 0) {
            jumpMean = 0.05 + (eventSeverity * 0.02);  // Good news = Stronger surge than normal
        }
        
        // Amplify the intensity of the swing during the jump
        jumpVol = 0.08 + (eventSeverity * 0.02);
    }

    // Normal Market Conditions (Geometric Brownian Motion)
    const totalMu = mu + driftModifier;
    const continuousDrift = totalMu - (0.5 * Math.pow(currentSigma, 2));
    const continuousShock = currentSigma * randomNormal(0, 1);
    let totalReturnLog = continuousDrift + continuousShock;

    // Extreme Events (Jump Process)
    const numJumps = randomPoisson(jumpProbability);
    for (let i = 0; i < numJumps; i++) {
        totalReturnLog += randomNormal(jumpMean, jumpVol);
    }

    return Math.exp(totalReturnLog) - 1;
}

export const generateScenario = (years) => {
    const weeks = years * 52;
    const startDate = new Date('2026-01-01');

    if (!fs.existsSync(RULES_FILE) || !fs.existsSync(EVENTS_FILE)) {
        throw new Error("Base rules or events template missing. Please check dataLearner.");
    }

    const baseRulesData = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
    const syntheticEvents = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
    
    const categories = { currencies: [], index_funds: [], stocks: [], gold: [], bonds: [] };
    Object.values(baseRulesData).forEach(rule => {
        const name = rule.asset.toUpperCase();
        if (name.endsWith('_THB') || ['USD', 'EUR', 'JPY'].includes(name)) categories.currencies.push(rule);
        else if (['SET', 'SET50', 'SET100'].includes(name) || name.includes('INDEX')) categories.index_funds.push(rule);
        else if (['GLD', 'GOLD'].includes(name) || name.includes('GOLD')) categories.gold.push(rule);
        else if (name.includes('BOND') || name.includes('TBILL')) categories.bonds.push(rule);
        else categories.stocks.push(rule);
    });

    const shuffle = (array) => array.sort(() => 0.5 - Math.random());
    let selectedRules = [
        ...shuffle(categories.currencies).slice(0, 3),
        ...shuffle(categories.index_funds).slice(0, 1),
        ...shuffle(categories.stocks).slice(0, 4),
        ...shuffle(categories.gold).slice(0, 1),
        ...shuffle(categories.bonds).slice(0, 3)
    ].filter(Boolean);

    // --- Map Real Asset Names to Fake Names ---
    const realToFakeMap = {};
    let stockIdx = 0, currIdx = 0, idxIdx = 0, goldIdx = 0;
    
    selectedRules.forEach(rule => {
        const name = rule.asset;
        if (categories.currencies.includes(rule)) {
            realToFakeMap[name] = FAKE_CURRENCIES[currIdx % FAKE_CURRENCIES.length];
            currIdx++;
        }
        else if (categories.index_funds.includes(rule)) {
            realToFakeMap[name] = FAKE_INDEX[idxIdx % FAKE_INDEX.length];
            idxIdx++;
        }
        else if (categories.gold.includes(rule)) {
            realToFakeMap[name] = FAKE_GOLD[goldIdx % FAKE_GOLD.length];
            goldIdx++;
        }
        else if (categories.bonds.includes(rule)) {
            realToFakeMap[name] = name; // Keep bond names unchanged (e.g., "Bond 1 Y")
        }
        else {
            realToFakeMap[name] = FAKE_STOCKS[stockIdx % FAKE_STOCKS.length];
            stockIdx++;
        }
    });

    const generatedEvents = [];
    
    // Only use generic synthetic categories (Ignore 'REAL_' prefixed events)
    const allowedEventTypes = Object.keys(syntheticEvents).filter(type => !type.startsWith('REAL_'));

    // Define the active event window: Starts at Year 2, Ends 3 years before the end
    const minStartWeek = 52; 
    const maxStartWeek = weeks - (52 * 3); 

    if (maxStartWeek > minStartWeek) {
        const activeYears = (maxStartWeek - minStartWeek) / 52;
        // Frequency: roughly 1 to 2 events per active year
        const numEvents = Math.floor(activeYears * (Math.random() * 0.8 + 0.8)); 

        for (let i = 0; i < numEvents; i++) {
            const type = allowedEventTypes[Math.floor(Math.random() * allowedEventTypes.length)];
            const templateList = syntheticEvents[type];
            if (!templateList || templateList.length === 0) continue;
            
            const template = templateList[Math.floor(Math.random() * templateList.length)];
            
            // Randomize start week and ensure events are spaced at least 12 weeks apart
            let startWeek = minStartWeek + Math.floor(Math.random() * (maxStartWeek - minStartWeek));
            let attempts = 0;
            while (generatedEvents.some(e => Math.abs(e.start_week - startWeek) < 12) && attempts < 10) {
                startWeek = minStartWeek + Math.floor(Math.random() * (maxStartWeek - minStartWeek));
                attempts++;
            }

            const duration = Math.floor(Math.random() * 8) + 4; // Event lasts between 4 to 11 weeks

            const affectedReal = selectedRules.map(r => r.asset).filter(() => Math.random() > 0.6);
            const affectedFake = affectedReal.map(realName => realToFakeMap[realName]);

            generatedEvents.push({
                event_id: `EVT_${i}`,
                type: type,
                title: template.title,
                source: "Global Finance News",
                start_week: startWeek,
                end_week: startWeek + duration,
                affected_assets_real: affectedReal, // Used for backend chart calculations
                affected_assets: affectedFake,      // Used for frontend display
                severity: Math.floor(Math.random() * 4) + 1,
                effect: { amount: Math.random() > 0.8 ? 2000 : 0 } // Small chance for a cash windfall
            });
        }
        
        // Sort events chronologically
        generatedEvents.sort((a, b) => a.start_week - b.start_week);
    }

    const assetData = {};
    selectedRules.forEach(rule => {
        const assetName = rule.asset;
        const fakeName = realToFakeMap[assetName]; // Use the fake name as the key
        
        let currentPrice = rule.startPrice;
        let category = "stocks";
        if (categories.currencies.includes(rule)) category = "currencies";
        else if (categories.index_funds.includes(rule)) category = "index";
        else if (categories.gold.includes(rule)) category = "gold";
        else if (categories.bonds.includes(rule)) category = "bonds";

        const timeline = [];

        for (let w = 0; w < weeks; w++) {
            let eventDrift = 0;
            let currentEventSeverity = 0; // Track the highest event severity active during this week

            generatedEvents.forEach(ev => {
                // Apply price impacts based on the REAL asset names
                if (w >= ev.start_week && w <= ev.end_week && ev.affected_assets_real.includes(assetName)) {
                    const impact = ev.severity * 0.001;
                    
                    // Keep the highest severity in case of overlapping events
                    currentEventSeverity = Math.max(currentEventSeverity, ev.severity); 

                    if (['CLIMATE_DISASTER', 'COMMODITY_SHOCK'].includes(ev.type)) eventDrift -= impact;
                    else if (['TECH_INNOVATION'].includes(ev.type)) eventDrift += impact;
                    else {
                        const hash = crypto.createHash('md5').update(ev.event_id + assetName).digest('hex');
                        eventDrift += (parseInt(hash[0], 16) % 2 === 0 ? -1 : 1) * impact * 0.5;
                    }
                }
            });

            // ----------------------------------------------------
            // Use Jump Diffusion Model to calculate weekly returns
            // ----------------------------------------------------
            const weeklyReturn = calculateWeeklyReturn(rule.baseReturn, rule.baseVolatility, eventDrift, currentEventSeverity);
            
            const oldPrice = currentPrice;
            currentPrice *= (1 + weeklyReturn);
            currentPrice = Math.max(rule.startPrice * 0.05, currentPrice); // Floor price at 5% of starting value

            const date = new Date(startDate);
            date.setDate(date.getDate() + (w * 7));

            timeline.push({
                week: date.toISOString(),
                close: parseFloat(currentPrice.toFixed(2)),
                change: parseFloat((((currentPrice - oldPrice) / oldPrice) * 100).toFixed(2))
            });
        }
        
        // Save using the fake name so the frontend only ever sees the masked name
        assetData[fakeName] = {
            name: fakeName,
            category: category,
            data: timeline
        };
    });

    return { 
        // Remove 'affected_assets_real' before sending to the client to ensure complete anonymity
        events: generatedEvents.map(({ affected_assets_real, ...rest }) => rest), 
        assets: assetData, 
        totalWeeks: weeks 
    };
};