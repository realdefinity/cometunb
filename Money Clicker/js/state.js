// --- ASSETS (Expanded to 26 Tiers) ---
const upgrades = [
    { name: "Piggy Bank", baseCost: 15, baseRate: 1 },
    { name: "Paper Route", baseCost: 100, baseRate: 4 },
    { name: "Lemonade Stand", baseCost: 500, baseRate: 10 },
    { name: "Vending Machine", baseCost: 1100, baseRate: 16 },
    { name: "Car Wash", baseCost: 5000, baseRate: 40 },
    { name: "Laundromat", baseCost: 12000, baseRate: 64 },
    { name: "Pizza Shop", baseCost: 50000, baseRate: 150 },
    { name: "Real Estate", baseCost: 130000, baseRate: 260 },
    { name: "Stock Portfolio", baseCost: 500000, baseRate: 600 },
    { name: "Tech Startup", baseCost: 1.4e6, baseRate: 1100 },
    { name: "Software Firm", baseCost: 8e6, baseRate: 3000 },
    { name: "Hedge Fund", baseCost: 20e6, baseRate: 5400 },
    { name: "Offshore Bank", baseCost: 100e6, baseRate: 12000 },
    { name: "Gold Reserve", baseCost: 330e6, baseRate: 24000 },
    { name: "Oil Company", baseCost: 1e9, baseRate: 60000 },
    { name: "Mining Corp", baseCost: 5e9, baseRate: 120000 },
    { name: "Investment Bank", baseCost: 25e9, baseRate: 350000 },
    { name: "Central Bank", baseCost: 75e9, baseRate: 750000 },
    { name: "Global Exchange", baseCost: 500e9, baseRate: 2.5e6 },
    { name: "Space Program", baseCost: 1e12, baseRate: 5e6 },
    { name: "Lunar Outpost", baseCost: 14e12, baseRate: 35e6 },
    { name: "Mars Colony", baseCost: 200e12, baseRate: 280e6 },
    { name: "Asteroid Belt", baseCost: 5e15, baseRate: 2.5e9 },
    { name: "Dyson Sphere", baseCost: 1e18, baseRate: 40e9 },
    { name: "Galactic Federation", baseCost: 1e21, baseRate: 800e9 },
    { name: "Universal Ledger", baseCost: 1e24, baseRate: 20e12 }
];

// --- STAFF (Specialists) ---
const staffMembers = [
    { id: 0, name: "Intern", cost: 2.5e6, desc: "Auto-collects bonuses.", type: "Utility" },
    { id: 1, name: "Analyst", cost: 75e6, desc: "+10% Critical Hit chance.", type: "Tactical" },
    { id: 2, name: "Lobbyist", cost: 2e9, desc: "+50% Influence gain.", type: "Strategic" },
    { id: 3, name: "CEO", cost: 500e12, desc: "1.5x Global Multiplier.", type: "Leadership" }
];

// --- RANKS (Progression Tiers) ---
const rankData = [
    { name: "Broke", req: 0 },
    { name: "Saver", req: 10 },
    { name: "Earner", req: 25 },
    { name: "Hustler", req: 50 },
    { name: "Trader", req: 100 },
    { name: "Manager", req: 250 },
    { name: "Founder", req: 500 },
    { name: "Investor", req: 1000 },
    { name: "Millionaire", req: 2500 },
    { name: "Multi-Millionaire", req: 5000 },
    { name: "Capitalist", req: 10000 },
    { name: "Tycoon", req: 25000 },
    { name: "Baron", req: 50000 },
    { name: "Oligarch", req: 100000 },
    { name: "Billionaire", req: 250000 },
    { name: "Trillionaire", req: 500000 },
    { name: "Magnate", req: 1000000 },
    { name: "Monarch", req: 2500000 },
    { name: "Emperor", req: 5000000 },
    { name: "World Owner", req: 10000000 },
    { name: "The Mint", req: 50000000 }
];

// --- UPGRADES (One-time Multipliers) ---
const marketUpgrades = [
    { id: 0, targetId: 0, name: "Ceramic Pig", cost: 500, mult: 2, desc: "Piggy Banks x2" },
    { id: 1, targetId: 1, name: "Electric Bike", cost: 2500, mult: 2, desc: "Paper Routes x2" },
    { id: 2, targetId: 2, name: "Fresh Lemons", cost: 10000, mult: 2, desc: "Lemonade Stands x2" },
    { id: 3, targetId: 3, name: "New Coils", cost: 25000, mult: 2, desc: "Vending Machines x2" },
    { id: 4, targetId: 4, name: "Premium Wax", cost: 100000, mult: 2, desc: "Car Washes x2" },
    { id: 5, targetId: 5, name: "New Machines", cost: 300000, mult: 2, desc: "Laundromats x2" },
    { id: 6, targetId: 6, name: "Secret Sauce", cost: 1e6, mult: 2, desc: "Pizza Shops x2" },
    { id: 7, targetId: 7, name: "Renovations", cost: 5e6, mult: 2, desc: "Real Estate x2" },
    { id: 8, targetId: 8, name: "Insider Info", cost: 20e6, mult: 2, desc: "Stock Portfolios x2" },
    { id: 9, targetId: 9, name: "Angel Investor", cost: 50e6, mult: 2, desc: "Tech Startups x2" },
    { id: 10, targetId: 10, name: "Cloud Servers", cost: 250e6, mult: 2, desc: "Software Firms x2" },
    { id: 11, targetId: 11, name: "AI Algorithms", cost: 1e9, mult: 2, desc: "Hedge Funds x2" },
    { id: 12, targetId: 12, name: "Tax Haven", cost: 5e9, mult: 2, desc: "Offshore Banks x2" },
    { id: 13, targetId: 13, name: "New Vaults", cost: 25e9, mult: 2, desc: "Gold Reserves x2" },
    { id: 14, targetId: 14, name: "Fracking", cost: 100e9, mult: 2, desc: "Oil Companies x2" },
    { id: 15, targetId: 15, name: "Heavy Machinery", cost: 500e9, mult: 2, desc: "Mining Corps x2" },
    { id: 16, targetId: 16, name: "Global Trading", cost: 2e12, mult: 2, desc: "Investment Banks x2" },
    { id: 17, targetId: 17, name: "Money Printer", cost: 10e12, mult: 2, desc: "Central Banks x2" },
    { id: 18, targetId: 18, name: "Fiber Cables", cost: 50e12, mult: 2, desc: "Global Exchanges x2" },
    { id: 19, targetId: 19, name: "Reusable Rockets", cost: 200e12, mult: 2, desc: "Space Programs x2" },
    { id: 20, targetId: 20, name: "Helium-3", cost: 1e15, mult: 2, desc: "Lunar Outposts x2" },
    { id: 21, targetId: 21, name: "Terraforming", cost: 10e15, mult: 2, desc: "Mars Colonies x2" },
    { id: 22, targetId: 22, name: "Drone Miners", cost: 100e15, mult: 2, desc: "Asteroid Belts x2" },
    { id: 23, targetId: 23, name: "Solar Panels", cost: 1e18, mult: 2, desc: "Dyson Spheres x2" },
    { id: 24, targetId: 24, name: "Universal Law", cost: 1e21, mult: 2, desc: "Galactic Federations x2" },
    { id: 25, targetId: 25, name: "Matter Code", cost: 1e24, mult: 2, desc: "Universal Ledgers x2" }
];

// --- R&D TECH TREE ---
const techTree = [
    { id: 0, name: "Neural Link", cost: 15, desc: "Auto-clicker active.", x: 220, y: 60, parents: [] },
    { id: 1, name: "Data Siphon", cost: 40, desc: "+10% Click value.", x: 100, y: 180, parents: [0] },
    { id: 2, name: "Market Pulse", cost: 60, desc: "Hype decays 50% slower.", x: 340, y: 180, parents: [0] },
    { id: 3, name: "Dark Pool", cost: 150, desc: "Mania is now 3x multiplier.", x: 220, y: 300, parents: [1, 2] },
    { id: 4, name: "Singularity", cost: 500, desc: "All yield x2.", x: 220, y: 420, parents: [3] }
];

// --- SKINS ---
const particleSkins = [
    { id: 'default', name: "Cash", color: "#22c55e", char: "+$" },
    { id: 'gold', name: "Gold", color: "#eab308", char: "●" },
    { id: 'fire', name: "Heat", color: "#f43f5e", char: "🔥" }
];


// --- GAME STATE ---
window.game = { 
    money: 0, 
    lifetimeEarnings: 0, 
    influence: 0, 
    counts: Array(upgrades.length).fill(0),
    levels: Array(upgrades.length).fill(1),
    staff: [],
    upgradesOwned: [],
    researchedTech: [], 
    debt: 0,            
    activeSkin: 'default', 
    startTime: Date.now() 
};

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
            // Default fallbacks for new features on old saves
            if (!d.levels) d.levels = Array(upgrades.length).fill(1);
            if (!d.staff) d.staff = [];
            if (!d.upgradesOwned) d.upgradesOwned = [];
            if (!d.researchedTech) d.researchedTech = [];
            if (!d.activeSkin) d.activeSkin = 'default';

            game = { ...game, ...d };
            
            // Ensure array lengths match in case of updates
            while(game.counts.length < upgrades.length) {
                game.counts.push(0);
                game.levels.push(1);
            }
        } catch(e) { console.error(e); }
    }
}