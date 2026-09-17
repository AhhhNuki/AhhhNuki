/**
 * Automated Rate Scraper for Georgian Freight Forwarders
 * Fetches current parcel delivery rates from official sources
 * and updates data/forwarders.json if differences are detected.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'forwarders.json');
const MIN_REASONABLE_RATE = 5;
const MAX_REASONABLE_RATE = 25;
const MAX_AUTOMATIC_CHANGE_PERCENT = 35;

// Standard browser headers to avoid basic bot blocks
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Scrapes USA2GEORGIA current USA air freight rate per kg
 */
async function scrapeUSA2GEORGIA() {
    try {
        const pageRes = await fetch('https://www.usa2georgia.com/ka/tariffs', {
            headers: HEADERS,
            signal: AbortSignal.timeout(10000)
        });

        if (!pageRes.ok) throw new Error(`Status ${pageRes.status}`);
        const html = await pageRes.text();

        // Extract frontend bundle script
        const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
        if (!match) throw new Error('Could not find bundle script tag');

        const bundleUrl = `https://www.usa2georgia.com${match[1]}`;
        const bundleRes = await fetch(bundleUrl, {
            headers: HEADERS,
            signal: AbortSignal.timeout(10000)
        });

        if (!bundleRes.ok) throw new Error(`Bundle status ${bundleRes.status}`);
        const bundleCode = await bundleRes.text();

        // Match rate in USA shipping section: e.g. usa:{name:"USA",method:"Standard Shipping",...,rate:"$9.95/kg"}
        const rateMatch = bundleCode.match(/usa:\s*\{[^}]*rate:\s*"\$([0-9.]+)\/kg"/i) 
                       || bundleCode.match(/name:\s*"USA"[^}]*rate:\s*"\$([0-9.]+)\/kg"/i)
                       || bundleCode.match(/rate:\s*"\$([0-9.]+)\/kg"/i);

        if (rateMatch && rateMatch[1]) {
            const rate = parseFloat(rateMatch[1]);
            if (!isNaN(rate) && rate >= MIN_REASONABLE_RATE && rate <= MAX_REASONABLE_RATE) return rate;
        }

        throw new Error('Could not parse rate from bundle');
    } catch (err) {
        console.warn(`[USA2GEORGIA Scraper] Warning: ${err.message}`);
        return null;
    }
}

/**
 * Scrapes Inex Group current USA air freight rate per kg
 */
async function scrapeInex() {
    try {
        const pageRes = await fetch('https://inex.ge/', {
            headers: HEADERS,
            signal: AbortSignal.timeout(10000)
        });

        if (!pageRes.ok) throw new Error(`Status ${pageRes.status}`);
        const html = await pageRes.text();

        // Search for JS bundles in inex.ge
        const bundleMatches = html.match(/\/assets\/[a-zA-Z0-9_\-.]+\.js/g);
        if (bundleMatches && bundleMatches.length > 0) {
            // Check bundles for USA tariff
            for (const bundlePath of bundleMatches.slice(0, 5)) {
                try {
                    const bRes = await fetch(`https://inex.ge${bundlePath}`, {
                        headers: HEADERS,
                        signal: AbortSignal.timeout(10000)
                    });
                    if (bRes.ok) {
                        const js = await bRes.text();
                        // Look for USA tariff pattern: e.g. USA ... 9.7 or similar
                        const rateMatch = js.match(/USA[^\d]{1,50}(\d+\.\d{2})/i) 
                                       || js.match(/აშშ[^\d]{1,50}(\d+\.\d{2})/i);
                        if (rateMatch && rateMatch[1]) {
                            const parsed = parseFloat(rateMatch[1]);
                            if (parsed >= MIN_REASONABLE_RATE && parsed <= MAX_REASONABLE_RATE) return parsed;
                        }
                    }
                } catch (e) {
                    // ignore individual bundle errors
                }
            }
        }

        return null;
    } catch (err) {
        console.warn(`[Inex Scraper] Warning: ${err.message}`);
        return null;
    }
}

/**
 * Main Scraper execution
 */
async function run() {
    console.log('🔄 Checking freight forwarder rates...');
    
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`Error: ${DATA_FILE} not found.`);
        process.exit(1);
    }

    const forwarders = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const today = new Date().toISOString().split('T')[0];
    let changesMade = 0;

    // Define company scrapers
    const scrapers = {
        usa2georgia: scrapeUSA2GEORGIA,
        inex: scrapeInex
    };

    for (const [id, scraperFn] of Object.entries(scrapers)) {
        const company = forwarders.find(f => f.id === id);
        if (!company) continue;

        console.log(`📡 Fetching latest rate for ${company.name}...`);
        const latestRate = await scraperFn();

        if (latestRate != null && latestRate >= MIN_REASONABLE_RATE && latestRate <= MAX_REASONABLE_RATE) {
            const current = company.currentRate;
            if (latestRate !== current) {
                const diff = +(latestRate - current).toFixed(2);
                const changePercent = current > 0 ? Math.abs((diff / current) * 100) : 100;

                if (changePercent > MAX_AUTOMATIC_CHANGE_PERCENT) {
                    console.warn(
                        `⚠️ ${company.name}: rejected suspicious ${changePercent.toFixed(1)}% change ` +
                        `($${current.toFixed(2)} ➔ $${latestRate.toFixed(2)}). Manual verification required.`
                    );
                    continue;
                }

                console.log(`🚨 Price change detected for ${company.name}: $${current.toFixed(2)} ➔ $${latestRate.toFixed(2)} (${diff >= 0 ? '+' : ''}${diff.toFixed(2)})`);

                company.previousRate = current;
                company.currentRate = latestRate;
                company.lastUpdated = today;

                if (!company.history) company.history = [];
                company.history.unshift({
                    date: today,
                    rate: latestRate,
                    change: diff,
                    direction: diff > 0 ? 'up' : 'down',
                    note: diff > 0 
                        ? `ტარიფი გაიზარდა $${Math.abs(diff).toFixed(2)}-ით ($${current.toFixed(2)} ➔ $${latestRate.toFixed(2)})`
                        : `ტარიფი შემცირდა $${Math.abs(diff).toFixed(2)}-ით ($${current.toFixed(2)} ➔ $${latestRate.toFixed(2)})`
                });

                changesMade++;
            } else {
                console.log(`✔️ ${company.name}: $${latestRate.toFixed(2)}/kg (Up to date)`);
            }
        } else {
            console.log(`ℹ️ ${company.name}: Kept current rate $${company.currentRate.toFixed(2)}/kg (No change detected or scraper skipped)`);
        }
    }

    if (changesMade > 0) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(forwarders, null, 2), 'utf-8');
        console.log(`\n🎉 Successfully updated ${changesMade} company rate(s) in data/forwarders.json`);
        process.exit(0);
    } else {
        console.log('\n✅ All rates verified. No price changes detected.');
        process.exit(0);
    }
}

run().catch(err => {
    console.error('Fatal Scraper Error:', err);
    process.exit(1);
});
