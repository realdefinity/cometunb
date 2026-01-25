const upgrades = [
    { name: "Piggy Bank", baseCost: 15, baseRate: 1 },
    { name: "Vending Machine", baseCost: 100, baseRate: 4 },
    { name: "Laundromat", baseCost: 1100, baseRate: 16 },
    { name: "Real Estate", baseCost: 12000, baseRate: 64 },
    { name: "Stock Portfolio", baseCost: 130000, baseRate: 260 },
    { name: "Tech Startup", baseCost: 1.4e6, baseRate: 1100 },
    { name: "Hedge Fund", baseCost: 20e6, baseRate: 5400 },
    { name: "Offshore Bank", baseCost: 330e6, baseRate: 24000 },
    { name: "Gold Reserve", baseCost: 5e9, baseRate: 120000 },
    { name: "Oil Company", baseCost: 75e9, baseRate: 750000 },
    { name: "Central Bank", baseCost: 1e12, baseRate: 5e6 },
    { name: "Global Currency", baseCost: 14e12, baseRate: 35e6 },
    { name: "Space Mining", baseCost: 200e12, baseRate: 280e6 },
    { name: "Matter Replicator", baseCost: 5e15, baseRate: 2.5e9 },
    { name: "Time Monopoly", baseCost: 1e18, baseRate: 40e9 },
    { name: "Galactic Treasury", baseCost: 1e21, baseRate: 800e9 }
];

const ranks = [
    "Broke", "Saver", "Investor", "Broker", "Banker", 
    "CEO", "Tycoon", "Magnate", "Oligarch", "Trillionaire", 
    "World Bank", "Economy Lord", "Master of Coin", "Infinite"
];

const newsHeadlines = [
    "Stocks hit all-time high...", "Inflation concerns rise...",
    "Local laundromat reports record profits...", "Gold prices stabilizing...",
    "Hedge Funds buying up everything...", "New currency announced...",
    "Market volatility decreasing...", "Money printer goes BRRRRR..."
];

// Global Game State
window.game = { money: 0, lifetimeEarnings: 0, influence: 0, counts: Array(upgrades.length).fill(0), startTime: Date.now() };
window.buyMode = 1;
window.hype = 0;
window.maniaMode = false;
window.maniaTimer = 0;
window.goldenBillTimer = 2000;
window.autoSaveTimer = 0;
window.tickerTimer = 15;

function saveLocal() { localStorage.setItem('mintV7_money_save', JSON.stringify(game)); }

function loadLocal() {
    let s = localStorage.getItem('mintV7_money_save');
    if(s) {
        try {
            let d = JSON.parse(s);
            game = { ...game, ...d };
            while(game.counts.length < upgrades.length) game.counts.push(0);
        } catch(e) { console.error(e); }
    }
}

async function checkSecureCode(input) {
    // Simple hash check for dev backdoor
    return false; 
}