// --- BACKDOOR FOR CHEAT MENUS ---
window.MINT_READY = true;

// --- ASSETS (Expanded to 20 Tiers) ---
const upgrades = [
    { name: "Spare Change", baseCost: 15, baseRate: 1 },
    { name: "Piggy Bank", baseCost: 100, baseRate: 4 },
    { name: "Wallet", baseCost: 1100, baseRate: 16 },
    { name: "ATM", baseCost: 12000, baseRate: 64 },
    { name: "Vending Machine", baseCost: 130000, baseRate: 260 },
    { name: "Corner Store", baseCost: 1.4e6, baseRate: 1100 },
    { name: "Barber Shop", baseCost: 20e6, baseRate: 5400 },
    { name: "Restaurant", baseCost: 330e6, baseRate: 24000 },
    { name: "Supermarket", baseCost: 5e9, baseRate: 120000 },
    { name: "Hotel", baseCost: 75e9, baseRate: 750000 },
    { name: "Casino", baseCost: 1e12, baseRate: 5e6 },
    { name: "Stadium", baseCost: 14e12, baseRate: 35e6 },
    { name: "Oil Rig", baseCost: 200e12, baseRate: 280e6 },
    { name: "Airline", baseCost: 5e15, baseRate: 2.5e9 },
    { name: "Tech Firm", baseCost: 1e18, baseRate: 40e9 },
    { name: "Bank", baseCost: 1e21, baseRate: 800e9 },
    { name: "Hedge Fund", baseCost: 1e24, baseRate: 20e12 },
    { name: "Global Exchange", baseCost: 1e27, baseRate: 500e12 },
    { name: "Federal Reserve", baseCost: 1e30, baseRate: 15e15 },
    { name: "World Bank", baseCost: 1e33, baseRate: 800e15 }
];

// --- STAFF (Expanded to 10 Tiers) ---
const staffMembers = [
    { id: 0, name: "Janitor", cost: 500, desc: "Keeps the office clean. +1% Income.", type: "Support" },
    { id: 1, name: "Security Guard", cost: 5000, desc: "Protects assets. +2% Click Value.", type: "Support" },
    { id: 2, name: "Assistant", cost: 50000, desc: "Auto-collects bonuses.", type: "Utility" },
    { id: 3, name: "Accountant", cost: 500000, desc: "Reduces tax waste. +5% Income.", type: "Finance" },
    { id: 4, name: "Lawyer", cost: 5e6, desc: "+10% Critical Hit Chance.", type: "Legal" },
    { id: 5, name: "Trader", cost: 50e6, desc: "Market volatility expert. +10% Income.", type: "Finance" },
    { id: 6, name: "Banker", cost: 500e6, desc: "Investment pro. +20% Income.", type: "Finance" },
    { id: 7, name: "Director", cost: 5e9, desc: "+50% Influence Gain.", type: "Management" },
    { id: 8, name: "VP", cost: 50e9, desc: "Global Operations. 1.2x Multiplier.", type: "Executive" },
    { id: 9, name: "CEO", cost: 500e9, desc: "The Boss. 1.5x Global Multiplier.", type: "Leadership" }
];

// --- RANKS (Simple Business Titles) ---
const rankData = [
    { name: "Broke", req: 0 },
    { name: "Poor", req: 100 },
    { name: "Saver", req: 500 },
    { name: "Spender", req: 1000 },
    { name: "Earner", req: 5000 },
    { name: "Employee", req: 25000 },
    { name: "Manager", req: 100000 },
    { name: "Boss", req: 500000 },
    { name: "Executive", req: 2500000 },
    { name: "Director", req: 10000000 },
    { name: "VP", req: 50000000 },
    { name: "President", req: 250000000 },
    { name: "Millionaire", req: 1000000000 },
    { name: "Billionaire", req: 10000000000 },
    { name: "Tycoon", req: 100000000000 },
    { name: "Magnate", req: 1e15 },
    { name: "Oligarch", req: 1e18 },
    { name: "Titan", req: 1e21 },
    { name: "The 1%", req: 1e24 },
    { name: "World Owner", req: 1e30 }
];

// --- ASSET UPGRADES (Matches New Assets) ---
const marketUpgrades = [
    { id: 0, targetId: 0, name: "Coin Star", cost: 500, mult: 2, desc: "Spare Change x2" },
    { id: 1, targetId: 1, name: "Ceramic Pig", cost: 2500, mult: 2, desc: "Piggy Banks x2" },
    { id: 2, targetId: 2, name: "Leather Stitching", cost: 10000, mult: 2, desc: "Wallets x2" },
    { id: 3, targetId: 3, name: "Lower Fees", cost: 50000, mult: 2, desc: "ATMs x2" },
    { id: 4, targetId: 4, name: "New Coils", cost: 300000, mult: 2, desc: "Vending Machines x2" },
    { id: 5, targetId: 5, name: "Better Snacks", cost: 1e6, mult: 2, desc: "Corner Stores x2" },
    { id: 6, targetId: 6, name: "Sharp Scissors", cost: 5e6, mult: 2, desc: "Barber Shops x2" },
    { id: 7, targetId: 7, name: "Michelin Star", cost: 25e6, mult: 2, desc: "Restaurants x2" },
    { id: 8, targetId: 8, name: "Fresh Produce", cost: 100e6, mult: 2, desc: "Supermarkets x2" },
    { id: 9, targetId: 9, name: "Room Service", cost: 500e6, mult: 2, desc: "Hotels x2" },
    { id: 10, targetId: 10, name: "Loaded Dice", cost: 2.5e9, mult: 2, desc: "Casinos x2" },
    { id: 11, targetId: 11, name: "Luxury Suites", cost: 10e9, mult: 2, desc: "Stadiums x2" },
    { id: 12, targetId: 12, name: "Deep Drilling", cost: 50e12, mult: 2, desc: "Oil Rigs x2" },
    { id: 13, targetId: 13, name: "New Jets", cost: 250e12, mult: 2, desc: "Airlines x2" },
    { id: 14, targetId: 14, name: "IPO Launch", cost: 1e15, mult: 2, desc: "Tech Firms x2" },
    { id: 15, targetId: 15, name: "Gold Vaults", cost: 5e15, mult: 2, desc: "Banks x2" },
    { id: 16, targetId: 16, name: "High Freq Trading", cost: 25e18, mult: 2, desc: "Hedge Funds x2" },
    { id: 17, targetId: 17, name: "Fiber Optic Cables", cost: 100e21, mult: 2, desc: "Global Exchanges x2" },
    { id: 18, targetId: 18, name: "Money Printer", cost: 500e24, mult: 2, desc: "Federal Reserves x2" },
    { id: 19, targetId: 19, name: "Global Currency", cost: 1e30, mult: 2, desc: "World Banks x2" }
];

// --- R&D TECH TREE (Vertical Core Layout) ---
// Panel Width ~440px. Center X = 220.
const techTree = [
    // --- ROOT ---
    { id: 0, name: "Neural Link", cost: 15, desc: "Auto-clicker active (1%).", x: 220, y: 50, parents: [] },

    // --- TIER 1 (Split) ---
    { id: 1, name: "Data Siphon", cost: 40, desc: "+10% Click value.", x: 120, y: 140, parents: [0] },
    { id: 23, name: "Tax Loophole", cost: 200, desc: "Assets 2% Cheaper", x: 185, y: 140, parents: [0] },
    { id: 14, name: "Server Cooling", cost: 150, desc: "+5% Passive Income", x: 255, y: 140, parents: [0] },
    { id: 2, name: "Market Pulse", cost: 60, desc: "Hype decays 50% slower.", x: 320, y: 140, parents: [0] },

    // --- BRANCH A: CLICKING (Left - x80) ---
    { id: 5, name: "Click Cache", cost: 100, desc: "+5% Click Value", x: 80, y: 220, parents: [1], effect: { type: 'click_mult', val: 0.05 } },
    { id: 6, name: "Tactical Mouse", cost: 250, desc: "+1% Crit Chance", x: 50, y: 300, parents: [5], effect: { type: 'crit_chance', val: 0.01 } },
    { id: 7, name: "Double Tap", cost: 500, desc: "+10% Click Value", x: 110, y: 300, parents: [5], effect: { type: 'click_mult', val: 0.10 } },
    { id: 8, name: "Macro Script", cost: 1000, desc: "+15% Click Value", x: 80, y: 380, parents: [6, 7], effect: { type: 'click_mult', val: 0.15 } },
    { id: 11, name: "Neuro-Click", cost: 15000, desc: "+25% Click Value", x: 80, y: 460, parents: [8], effect: { type: 'click_mult', val: 0.25 } },
    { id: 13, name: "Zero Latency", cost: 200000, desc: "+50% Click Value", x: 80, y: 540, parents: [11], effect: { type: 'click_mult', val: 0.50 } },

    // --- BRANCH B: ECONOMY (Mid-Left - x170) ---
    { id: 24, name: "Offshore Shell", cost: 600, desc: "Assets 3% Cheaper", x: 170, y: 220, parents: [23], effect: { type: 'cost_discount', val: 0.03 } },
    { id: 25, name: "Lobbying Firm", cost: 1500, desc: "Assets 5% Cheaper", x: 170, y: 300, parents: [24], effect: { type: 'cost_discount', val: 0.05 } },
    { id: 26, name: "Regulation Cut", cost: 5000, desc: "Assets 5% Cheaper", x: 170, y: 380, parents: [25], effect: { type: 'cost_discount', val: 0.05 } },
    { id: 27, name: "Govt Contract", cost: 20000, desc: "Assets 10% Cheaper", x: 170, y: 460, parents: [26], effect: { type: 'cost_discount', val: 0.10 } },

    // --- BRANCH C: PASSIVE (Mid-Right - x270) ---
    { id: 15, name: "Fiber Optic", cost: 400, desc: "+5% Passive Income", x: 270, y: 220, parents: [14], effect: { type: 'global_mult', val: 0.05 } },
    { id: 17, name: "Blockchain", cost: 2500, desc: "+15% Passive Income", x: 270, y: 300, parents: [15], effect: { type: 'global_mult', val: 0.15 } },
    { id: 19, name: "Deep Learning", cost: 15000, desc: "+25% Passive Income", x: 270, y: 380, parents: [17], effect: { type: 'global_mult', val: 0.25 } },
    { id: 21, name: "Sentient AI", cost: 100000, desc: "+40% Passive Income", x: 270, y: 460, parents: [19], effect: { type: 'global_mult', val: 0.40 } },
    { id: 22, name: "Digital God", cost: 500000, desc: "x2 Passive Income", x: 270, y: 540, parents: [21], effect: { type: 'global_mult', val: 1.0 } },

    // --- BRANCH D: MANIA (Right - x360) ---
    { id: 3, name: "Dark Pool", cost: 150, desc: "Mania is now 3x multiplier.", x: 360, y: 220, parents: [2] },
    { id: 28, name: "Hype Bot", cost: 500, desc: "Hype decays 10% slower", x: 360, y: 300, parents: [3], effect: { type: 'hype_decay', val: 0.9 } },
    { id: 30, name: "Media Empire", cost: 5000, desc: "Mania lasts 5s longer", x: 360, y: 380, parents: [28], effect: { type: 'mania_time', val: 5 } },
    { id: 31, name: "Mind Control", cost: 25000, desc: "Mania lasts 10s longer", x: 360, y: 460, parents: [30], effect: { type: 'mania_time', val: 10 } },

    // --- TIER 4: CONVERGENCE (Bottom Center) ---
    { id: 32, name: "Fusion Power", cost: 1e6, desc: "+50% Global Income", x: 220, y: 620, parents: [27, 31], effect: { type: 'global_mult', val: 0.5 } },
    { id: 4, name: "Singularity", cost: 5e6, desc: "All yield x2.", x: 220, y: 700, parents: [32, 13, 22] },
    { id: 33, name: "Dyson Link", cost: 10e6, desc: "All yield x2", x: 220, y: 780, parents: [4], effect: { type: 'global_mult', val: 1.0 } },
    
    // --- TIER 5: THE VOID (Endgame) ---
    { id: 37, name: "Void Energy", cost: 1e8, desc: "Income x5", x: 140, y: 900, parents: [33], effect: { type: 'global_mult', val: 4.0 } },
    { id: 38, name: "Omega Point", cost: 1e9, desc: "Income x10", x: 300, y: 900, parents: [33], effect: { type: 'global_mult', val: 9.0 } },
    { id: 39, name: "THE END", cost: 1e12, desc: "Income x100", x: 220, y: 1050, parents: [37, 38], effect: { type: 'global_mult', val: 99.0 } }
];

const shadowAssets = [
    { id: 0, name: "Shell Company", cost: 5e6, rate: 50000, heat: 0.5, desc: "High yield, low risk." },
    { id: 1, name: "Data Broker", cost: 100e6, rate: 1.5e6, heat: 1.2, desc: "Sells user data. Moderate risk." },
    { id: 2, name: "Arms Dealer", cost: 5e9, rate: 80e6, heat: 3.5, desc: "Extremely illegal. High risk." },
    { id: 3, name: "Shadow Gov", cost: 100e12, rate: 5e12, heat: 10.0, desc: "Run the world. Extreme heat." }
];

const loanOptions = [
    { id: 0, name: "Starter Credit", amount: 1e6, payback: 1.2e6, desc: "Fast $1M. 15% income tax." },
    { id: 1, name: "Venture Debt", amount: 1e9, payback: 1.4e9, desc: "Fast $1B. 15% income tax." }
];

// --- PARTICLE SKINS (Expanded) ---
const particleSkins = [
    { id: 'default', name: "USD", color: "#22c55e", char: "+$" },
    { id: 'gold', name: "Gold", color: "#eab308", char: "●" },
    { id: 'btc', name: "Bitcoin", color: "#f7931a", char: "₿" },
    { id: 'eth', name: "Ether", color: "#627eea", char: "Ξ" },
    { id: 'euro', name: "Euro", color: "#3b82f6", char: "€" },
    { id: 'yen', name: "Yen", color: "#ec4899", char: "¥" },
    { id: 'diamond', name: "Gem", color: "#06b6d4", char: "💎" },
    { id: 'fire', name: "Heat", color: "#f43f5e", char: "🔥" },
    { id: 'ice', name: "Frost", color: "#a5f3fc", char: "❄" },
    { id: 'bolt', name: "Flash", color: "#fbbf24", char: "⚡" },
    { id: 'heart', name: "Love", color: "#f472b6", char: "❤" },
    { id: 'skull', name: "Death", color: "#9ca3af", char: "💀" },
    { id: 'ghost', name: "Spirit", color: "#e5e7eb", char: "👻" },
    { id: 'alien', name: "UFO", color: "#84cc16", char: "👽" },
    { id: 'robot', name: "Bot", color: "#64748b", char: "🤖" },
    { id: 'rocket', name: "Moon", color: "#f59e0b", char: "🚀" },
    { id: 'chart', name: "Stonks", color: "#22c55e", char: "📈" },
    { id: 'bag', name: "Bag", color: "#15803d", char: "💰" },
    { id: 'binary', name: "Code", color: "#22c55e", char: "01" },
    { id: 'hack', name: "Error", color: "#ef4444", char: "⚠" },
    { id: 'void', name: "Void", color: "#a855f7", char: "🌀" },
    { id: 'crown', name: "King", color: "#fbbf24", char: "👑" },
    { id: 'nuclear', name: "Nuke", color: "#39ff14", char: "☢" },
    { id: 'bio', name: "Bio", color: "#ffff00", char: "☣" }
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
    startTime: Date.now(),
    shadowCounts: [0, 0, 0, 0], 
    heat: 0           
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
    "Bulls taking over the market...", "Secure terminal connection established...",
    "R&D Breakthroughs reported in sector 7...", "Recruitment drive in progress..."
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