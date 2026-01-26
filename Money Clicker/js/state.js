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

const staffMembers = [
    { id: 0, name: "Junior Intern", cost: 2.5e6, desc: "Automates Golden Bill collection.", type: "Utility" },
    { id: 1, name: "Quant Analyst", cost: 75e6, desc: "+10% Critical Hit chance.", type: "Tactical" },
    { id: 2, name: "High-Stakes Lobbyist", cost: 2e9, desc: "+50% Influence from Liquidation.", type: "Strategic" },
    { id: 3, name: "Executive CEO", cost: 500e12, desc: "Global 1.5x Profit Multiplier.", type: "Leadership" }
];

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
    levels: Array(upgrades.length).fill(1),
    staff: [], // Array of owned staff IDs
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

const newsHeadlines = [
    "Market rallying to new heights...", "Tech stocks surging...",
    "Asset optimization protocols online...", "Portfolio diversification recommended...",
    "Bulls taking over the market...", "Secure terminal connection established..."
];

function saveLocal() { localStorage.setItem('mintV7_money_save', JSON.stringify(game)); }

function loadLocal() {
    let s = localStorage.getItem('mintV7_money_save');
    if(s) {
        try {
            let d = JSON.parse(s);
            if (!d.levels) d.levels = Array(upgrades.length).fill(1);
            if (!d.staff) d.staff = [];
            game = { ...game, ...d };
            while(game.counts.length < upgrades.length) {
                game.counts.push(0);
                game.levels.push(1);
            }
        } catch(e) { console.error(e); }
    }
}