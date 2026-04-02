import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES_FILE = path.join(__dirname, '../data/baseRules.json');
const EVENTS_FILE = path.join(__dirname, '../data/eventsTemplate.json');

function randomNormal(mean, stdDev) {
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
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

    const assetNames = selectedRules.map(r => r.asset);
    const generatedEvents = [];
    const eventTypes = Object.keys(syntheticEvents);

    const numEvents = Math.floor(weeks / 10);
    for (let i = 0; i < numEvents; i++) {
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const templateList = syntheticEvents[type];
        if(!templateList || templateList.length === 0) continue;
        const template = templateList[Math.floor(Math.random() * templateList.length)];
        
        const startWeek = Math.floor(Math.random() * (weeks - 24));
        const duration = Math.floor(Math.random() * 12) + 4;
        
        let title = template.title;
        assetNames.forEach(asset => {
            title = title.replace(new RegExp(`\\b${asset}\\b`, 'gi'), "The Market");
        });

        generatedEvents.push({
            event_id: `EVT_${i}`,
            type: type,
            title: title,
            source: template.source || "News",
            start_week: startWeek,
            end_week: startWeek + duration,
            affected_assets: assetNames.filter(() => Math.random() > 0.6),
            severity: Math.floor(Math.random() * 5) + 1
        });
    }

    const assetData = {};
    selectedRules.forEach(rule => {
        const assetName = rule.asset;
        assetData[assetName] = [];
        let currentPrice = rule.startPrice;

        let category = "stocks";
        if (categories.currencies.includes(rule)) category = "currencies";
        else if (categories.index_funds.includes(rule)) category = "index";
        else if (categories.gold.includes(rule)) category = "gold";
        else if (categories.bonds.includes(rule)) category = "bonds";

        const timeline = [];

        for (let w = 0; w < weeks; w++) {
            let eventDrift = 0;
            generatedEvents.forEach(ev => {
                if (w >= ev.start_week && w <= ev.end_week && ev.affected_assets.includes(assetName)) {
                    const impact = ev.severity * 0.001;
                    if (['CLIMATE_DISASTER', 'COMMODITY_SHOCK'].includes(ev.type)) eventDrift -= impact;
                    else if (['TECH_INNOVATION'].includes(ev.type)) eventDrift += impact;
                    else {
                        const hash = crypto.createHash('md5').update(ev.event_id + assetName).digest('hex');
                        eventDrift += (parseInt(hash[0], 16) % 2 === 0 ? -1 : 1) * impact * 0.5;
                    }
                }
            });

            const weeklyReturn = randomNormal(rule.baseReturn + eventDrift, rule.baseVolatility);
            const oldPrice = currentPrice;
            currentPrice *= (1 + weeklyReturn);
            currentPrice = Math.max(rule.startPrice * 0.05, currentPrice);

            const date = new Date(startDate);
            date.setDate(date.getDate() + (w * 7));

            timeline.push({
                week: date.toISOString(),
                close: parseFloat(currentPrice.toFixed(2)),
                change: parseFloat((((currentPrice - oldPrice) / oldPrice) * 100).toFixed(2))
            });
        }
        
        assetData[assetName] = {
            name: assetName,
            category: category,
            data: timeline
        };
    });

    return { events: generatedEvents, assets: assetData, totalWeeks: weeks };
};

// export { generateScenario };