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
    return `${yyyy}${mm}${dd}000000`;
}

// Function to automatically fetch news from GDELT API
async function fetchNews(dateString, keyword) {
    try {
        const start = formatGDELTDate(dateString, -3);
        const end = formatGDELTDate(dateString, 3);
        if (!start || !end) return [];

        const query = `(${keyword} OR economy OR Thailand OR Thai)`;
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=2&format=json&startdatetime=${start}&enddatetime=${end}`;
        
        const response = await axios.get(url, { timeout: 8000 });
        if (response.data && response.data.articles) {
            return response.data.articles.map(a => ({
                title: a.title,
                source: a.sourceCountry || "News Media",
                url: a.url
            }));
        }
    } catch (error) { 
        return []; 
    }
    return [];
}

export async function learnFromCSV() {
    let baseRules = {};
    let eventsTemplate = { REAL_POSITIVE: [], REAL_NEGATIVE: [], REAL_NORMAL: [] };

    // Load existing data first (if available)
    if (fs.existsSync(RULES_FILE)) {
        try { baseRules = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8')); } catch(e) {}
    }
    if (fs.existsSync(EVENTS_FILE)) {
        try { eventsTemplate = { ...eventsTemplate, ...JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8')) }; } catch(e) {}
    }

    if (!fs.existsSync(CSV_DIR)) {
        fs.mkdirSync(CSV_DIR, { recursive: true });
        return;
    }

    const files = fs.readdirSync(CSV_DIR).filter(f => f.toLowerCase().endsWith('.csv'));
    let updatedRulesCount = 0;
    let newNewsCount = 0;

    for (const file of files) {
        const assetName = file.replace(/\.csv$/i, '');
        
        // If this asset is already learned, skip to the next file!
        if (baseRules[assetName]) continue; 

        console.log(`▶️ Processing new file: ${file} (Fetching news might take a moment...)`);
        const rows = [];
        await new Promise((resolve) => {
            fs.createReadStream(path.join(CSV_DIR, file))
                .pipe(csv({
                    // Remove invisible characters (BOM) to ensure headers are read correctly
                    mapHeaders: ({ header }) => header.replace(/^[\uFEFF\u200B-\u200D]+/g, '').trim().toLowerCase()
                }))
                .on('data', (data) => rows.push(data))
                .on('end', async () => {
                    if (rows.length > 1) {
                        const returnsData = [];
                        const lastRow = rows[rows.length - 1];
                        let startPrice = parseFloat(String(lastRow.close || lastRow.price || 100).replace(/,/g, ''));

                        // Calculate returns for each row
                        for (let i = 1; i < rows.length; i++) {
                            const date = rows[i].date || rows[i].month || rows[i].time;
                            const prevPrice = rows[i-1].close || rows[i-1].price;
                            const currPrice = rows[i].close || rows[i].price;

                            const prev = parseFloat(String(prevPrice).replace(/,/g, ''));
                            const curr = parseFloat(String(currPrice).replace(/,/g, ''));

                            if (!isNaN(prev) && !isNaN(curr) && date && prev !== 0) {
                                returnsData.push({ date, return: (curr - prev) / prev });
                            }
                        }

                        if (returnsData.length > 0) {
                            const rawReturns = returnsData.map(r => r.return);
                            const meanReturn = rawReturns.reduce((a, b) => a + b, 0) / rawReturns.length;
                            const volatility = calculateStandardDeviation(rawReturns);
                            
                            // Save calculated data to the base model
                            baseRules[assetName] = {
                                asset: assetName,
                                baseReturn: Math.max(Math.min(meanReturn, 0.005), -0.005),
                                baseVolatility: volatility,
                                startPrice: startPrice
                            };
                            updatedRulesCount++;

                            // Fetch news based on volatility anomalies (events exceeding 2x standard deviation)
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
                    }
                    resolve();
                });
        });
    }

    // Final execution summary
    if (updatedRulesCount > 0) {
        fs.writeFileSync(RULES_FILE, JSON.stringify(baseRules, null, 2));
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsTemplate, null, 2));
        console.log(`Update successful! Learned ${updatedRulesCount} new assets and fetched ${newNewsCount} news events.`);
    } else {
        console.log(`Database is up to date. No new raw CSV data to learn.`);
    }
}