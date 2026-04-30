import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, '../data/rawsData');
const RULES_FILE = path.join(__dirname, '../data/baseRules.json');
const EVENTS_FILE = path.join(__dirname, '../data/eventsTemplate.json');

// --- Helper: Process News Content (Anonymize & Translate) ---
async function processNewsContent(text) {
    if (!text) return "";

    let processedText = text;

    // 1. Anonymize Names: Find Thai name prefixes and replace them with English generic terms
    const namePattern = /(นาย|นางสาว|นาง|ท่าน|คุณ)\s?([ก-๙]+)\s?([ก-๙]+)?/g;
    processedText = processedText.replace(namePattern, (match) => {
        const keywords = ["A key official", "A business leader", "A government representative", "A prominent individual"];
        return keywords[Math.floor(Math.random() * keywords.length)];
    });

    // 2. Translate Thai to English (if Thai characters are detected)
    const isThai = /[ก-๙]/.test(processedText);
    if (isThai) {
        try {
            console.log(`[Data Learner] Translating Thai text: "${processedText.substring(0, 30)}..."`);
            // Note: In a real environment, you would use an API like google-translate-api-next here
            // e.g., const res = await translate(processedText, { to: 'en' });
            // For now, we simulate the translation so it doesn't break the system
            processedText = `[Translated News] ${processedText}`; 
        } catch (err) {
            console.error("[Data Learner] Translation Error:", err.message);
        }
    }

    return processedText;
}

function calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}

function formatGDELTDate(dateString, addDays = 0) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + addDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

async function fetchNews(dateString, assetName) {
    try {
        const queryDate = formatGDELTDate(dateString);
        if (!queryDate) return [];
        
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${assetName} economy&mode=artlist&format=json&startdatetime=${queryDate}000000&enddatetime=${queryDate}235959`;
        
        const response = await axios.get(url);
        const articles = response.data.articles || [];

        const cleanedArticles = [];
        // Limit to 2 articles per anomaly to keep processing fast
        for (const art of articles.slice(0, 2)) {
            const translatedTitle = await processNewsContent(art.title);
            cleanedArticles.push({
                title: translatedTitle,
                source: art.sourcecountry || "International Media",
                url: art.url
            });
        }
        return cleanedArticles;
    } catch (error) {
        return [];
    }
}

export async function learnFromCSV() {
    console.log("[Data Learner] Starting to read CSV files...");

    if (!fs.existsSync(CSV_DIR)) {
        console.log(`[Data Learner] Directory not found: ${CSV_DIR}`);
        return;
    }

    let baseRules = {};
    if (fs.existsSync(RULES_FILE)) {
        baseRules = JSON.parse(fs.readFileSync(RULES_FILE, 'utf-8'));
    }

    let eventsTemplate = { REAL_POSITIVE: [], REAL_NEGATIVE: [], REAL_NORMAL: [] };
    if (fs.existsSync(EVENTS_FILE)) {
        eventsTemplate = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
    }

    const files = fs.readdirSync(CSV_DIR).filter(file => file.endsWith('.csv'));
    let updatedRulesCount = 0;
    let newNewsCount = 0;

    for (const file of files) {
        const assetName = file.replace('.csv', '');
        
        // Skip if already learned. Comment this out if you want to force relearn everything.
        if (baseRules[assetName]) continue;

        console.log(`[Data Learner] Processing asset: ${assetName}...`);
        
        const filePath = path.join(CSV_DIR, file);
        const returnsData = [];
        let previousPrice = null;

        await new Promise((resolve) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    const currentPrice = parseFloat(data.Close || data.close || data.Price || data.price);
                    if (!isNaN(currentPrice)) {
                        if (previousPrice !== null && previousPrice > 0) {
                            returnsData.push({
                                date: data.Date || data.date,
                                return: (currentPrice - previousPrice) / previousPrice,
                                price: currentPrice
                            });
                        }
                        previousPrice = currentPrice;
                    }
                })
                .on('end', async () => {
                    if (returnsData.length > 0) {
                        const allReturns = returnsData.map(r => r.return);
                        const meanReturn = allReturns.reduce((a, b) => a + b, 0) / allReturns.length;
                        const volatility = calculateStandardDeviation(allReturns);

                        baseRules[assetName] = {
                            asset: assetName,
                            baseReturn: meanReturn,
                            baseVolatility: volatility,
                            startPrice: previousPrice
                        };
                        updatedRulesCount++;

                        const threshold = volatility * 2;
                        const anomalies = returnsData.filter(r => Math.abs(r.return) > threshold);
                        const sampleAnomalies = anomalies.sort(() => 0.5 - Math.random()).slice(0, 3);
                        
                        for (const anomaly of sampleAnomalies) {
                            const newsList = await fetchNews(anomaly.date, assetName);
                            newsList.forEach(news => {
                                if (anomaly.return > 0.05) eventsTemplate.REAL_POSITIVE.push(news);
                                else if (anomaly.return < -0.05) eventsTemplate.REAL_NEGATIVE.push(news);
                                else eventsTemplate.REAL_NORMAL.push(news);
                                newNewsCount++;
                            });
                        }
                    }
                    resolve();
                });
        });
    }

    if (updatedRulesCount > 0) {
        fs.writeFileSync(RULES_FILE, JSON.stringify(baseRules, null, 2));
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsTemplate, null, 2));
        console.log(`[Data Learner] Update successful! Learned ${updatedRulesCount} new assets and fetched ${newNewsCount} news events.`);
    } else {
        console.log(`[Data Learner] Database is up to date. No new raw CSV data to learn.`);
    }
}