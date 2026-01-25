// --- UPGRADES DATA ---
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

// --- RANK SYSTEM (Tiered Milestones) ---
const rankData = [
    { name: "Intern", req: 0 },
    { name: "Freelancer", req: 10 },
    { name: "Trader", req: 25 },
    { name: "Broker", req: 50 },
    { name: "Manager", req: 100 },
    { name: "Executive", req: 250 },
    { name: "Director", req: 500 },
    { name: "VP", req: 1000 },
    { name: "President", req: 2500 },
    { name: "CEO", req: 5000 },
    { name: "Chairman", req: 10000 },
    { name: "Tycoon", req: 25000 },
    { name: "Oligarch", req: 50000 },
    { name: "World Banker", req: 100000 },
    { name: "Illuminati", req: 1000000 }
];

// --- GAME STATE ---
window.game = { 
    money: 0, 
    lifetimeEarnings: 0, 
    influence: 0, 
    counts: Array(upgrades.length).fill(0), 
    startTime: Date.now() 
};

// Global Configs
window.buyMode = 1;
window.hype = 0;
window.maniaMode = false;
window.maniaTimer = 0;
window.goldenBillTimer = 2000;
window.autoSaveTimer = 0;
window.tickerTimer = 15;

// Headlines
const newsHeadlines = [
    "Market rallying to new heights...", "Tech stocks surging...",
    "Crypto regulation talks stall...", "Global merger announced...",
    "Interest rates holding steady...", "Bulls taking over the market...",
    "Secure terminal connection established...", "Assets liquidating smoothly..."
];

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

async function checkSecureCode(input) { return false; }

window.game_heartbeat = true;