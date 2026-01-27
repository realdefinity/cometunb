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

const marketUpgrades = [
    { id: 0, targetId: 0, name: "Premium Feed", cost: 500, mult: 2, desc: "Piggy Banks produce 2x more income." },
    { id: 1, targetId: 1, name: "Better Springs", cost: 2500, mult: 2, desc: "Vending Machines produce 2x more income." },
    { id: 2, targetId: 2, name: "Industrial Detergent", cost: 15000, mult: 2, desc: "Laundromats produce 2x more income." },
    { id: 3, targetId: 3, name: "Smart Integration", cost: 150000, mult: 2, desc: "Real Estate produces 2x more income." },
    { id: 4, targetId: 4, name: "HFT Algorithms", cost: 1.5e6, mult: 2, desc: "Stock Portfolios produce 2x more income." },
    { id: 5, targetId: 5, name: "Series A Funding", cost: 20e6, mult: 2, desc: "Tech Startups produce 2x more income." },
    { id: 6, targetId: 6, name: "Quant Models", cost: 300e6, mult: 2, desc: "Hedge Funds produce 2x more income." },
    { id: 7, targetId: 7, name: "Shell Network", cost: 5e9, mult: 2, desc: "Offshore Banks produce 2x more income." },
    { id: 8, targetId: 8, name: "Deep Vaults", cost: 75e9, mult: 2, desc: "Gold Reserves produce 2x more income." },
    { id: 9, targetId: 9, name: "Fracking License", cost: 1e12, mult: 2, desc: "Oil Companies produce 2x more income." },
    { id: 10, targetId: 10, name: "Quantitative Easing", cost: 15e12, mult: 2, desc: "Central Banks produce 2x more income." },
    { id: 11, targetId: 11, name: "Reserve Status", cost: 250e12, mult: 2, desc: "Global Currencies produce 2x more income." },
    { id: 12, targetId: 12, name: "Ion Thrusters", cost: 6e15, mult: 2, desc: "Space Mining produces 2x more income." },
    { id: 13, targetId: 13, name: "Atomic Synthesis", cost: 1e18, mult: 2, desc: "Matter Replicators produce 2x more income." },
    { id: 14, targetId: 14, name: "Paradox Prevention", cost: 1e21, mult: 2, desc: "Time Monopolies produce 2x more income." },
    { id: 15, targetId: 15, name: "Reality Anchoring", cost: 1e24, mult: 2, desc: "Galactic Treasuries produce 2x more income." }
];


// --- GAME STATE ---
window.game = { 
    money: 0, 
    lifetimeEarnings: 0, 
    influence: 0, 
    counts: Array(upgrades.length).fill(0),
    levels: Array(upgrades.length).fill(1), // Level 1 is base
    staff: [],
    upgradesOwned: [],
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