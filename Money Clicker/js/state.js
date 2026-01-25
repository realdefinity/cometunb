const upgrades = [
    { name: "Lemonade Stand", baseCost: 15, baseRate: 1 },
    { name: "Newspaper Route", baseCost: 100, baseRate: 4 },
    { name: "Car Wash", baseCost: 1100, baseRate: 16 },
    { name: "Pizza Franchise", baseCost: 12000, baseRate: 64 },
    { name: "Tech Startup", baseCost: 130000, baseRate: 260 },
    { name: "Crypto Farm", baseCost: 1.4e6, baseRate: 1100 },
    { name: "Bank Branch", baseCost: 20e6, baseRate: 5400 },
    { name: "Oil Platform", baseCost: 330e6, baseRate: 24000 },
    { name: "Hedge Fund", baseCost: 5e9, baseRate: 120000 },
    { name: "Space Station", baseCost: 75e9, baseRate: 750000 },
    { name: "Mars Colony", baseCost: 1e12, baseRate: 5e6 },
    { name: "Asteroid Mining", baseCost: 14e12, baseRate: 35e6 },
    { name: "Dyson Sphere", baseCost: 200e12, baseRate: 280e6 },
    { name: "Reality Engine", baseCost: 5e15, baseRate: 2.5e9 },
    { name: "Time Monopoly", baseCost: 1e18, baseRate: 40e9 },
    { name: "Galactic Senate", baseCost: 1e21, baseRate: 800e9 },
    { name: "Universal Core", baseCost: 1e24, baseRate: 20e12 }
];

const ranks = [
    "Street Rat", "Hustler", "Manager", "Executive", "Director", 
    "CEO", "Tycoon", "Baron", "Magnate", "Oligarch", 
    "World Leader", "System Lord", "Galactic Emperor", "Reality Bender", "The Architect", "Omnipotent"
];

const newsHeadlines = [
    "Market volatility increasing...", "Investors looking for new opportunities...",
    "Local lemonade stand acquires Google...", "Cryptocurrency crashes, then rallies...",
    "Mars Colony reports shortage of potatoes...", "Time Monopoly accused of insider trading...",
    "The Mint stock soars to new heights...", "Money printer goes BRRRRR..."
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
    if(!s) s = localStorage.getItem('mintV5_save');
    if(s) {
        try {
            let d = JSON.parse(s);
            game = { ...game, ...d };
            while(game.counts.length < upgrades.length) game.counts.push(0);
            if(!game.lifetimeEarnings || game.lifetimeEarnings < game.money) game.lifetimeEarnings = game.money;
        } catch(e) { console.error(e); }
    }
}

async function checkSecureCode(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === "f53b692694b914856f68c347942186716054f0a99676e1919830500858888063";
}