const upgrades = [
    { name: "Local Node", baseCost: 15, baseRate: 1 },
    { name: "Web Crawler", baseCost: 100, baseRate: 4 },
    { name: "Crypto Miner", baseCost: 1100, baseRate: 16 },
    { name: "Server Farm", baseCost: 12000, baseRate: 64 },
    { name: "Data Center", baseCost: 130000, baseRate: 260 },
    { name: "Quantum Rig", baseCost: 1.4e6, baseRate: 1100 },
    { name: "AI Trader", baseCost: 20e6, baseRate: 5400 },
    { name: "Global Network", baseCost: 330e6, baseRate: 24000 },
    { name: "Orbital Relay", baseCost: 5e9, baseRate: 120000 },
    { name: "Lunar Base", baseCost: 75e9, baseRate: 750000 },
    { name: "Dyson Swarm", baseCost: 1e12, baseRate: 5e6 },
    { name: "Reality Engine", baseCost: 14e12, baseRate: 35e6 },
    { name: "Time Mint", baseCost: 200e12, baseRate: 280e6 },
    { name: "Universal Core", baseCost: 5e15, baseRate: 2.5e9 },
    { name: "Entropy Reverse", baseCost: 1e18, baseRate: 40e9 },
    { name: "The Architect", baseCost: 1e21, baseRate: 800e9 }
];

const ranks = [
    "User", "Admin", "Developer", "Founder", "Angel Investor", 
    "Venture Capitalist", "Whale", "Market Maker", "Economy Lord", "Technocrat", 
    "World Eaters", "System Architect", "Reality Bender", "Omniscient"
];

const newsHeadlines = [
    "Neural Networks optimizing cash flow...", "Quantum encryption secure...",
    "Local Node efficiency up 200%...", "Crypto markets stabilizing...",
    "AI Trader predicts massive gains...", "Server Farm cooling systems active...",
    "The Mint protocol initialized...", "Global economy shifting to digital..."
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

function saveLocal() { localStorage.setItem('mintV6_save', JSON.stringify(game)); }

function loadLocal() {
    let s = localStorage.getItem('mintV6_save');
    if(s) {
        try {
            let d = JSON.parse(s);
            game = { ...game, ...d };
            while(game.counts.length < upgrades.length) game.counts.push(0);
        } catch(e) { console.error(e); }
    }
}

async function checkSecureCode(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('') === "f53b692694b914856f68c347942186716054f0a99676e1919830500858888063";
}