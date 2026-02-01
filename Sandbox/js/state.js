// --- CONFIGURATION ---
const SCALE = 4;
const GRAVITY_RATE = 1;

// --- ELEMENT IDS ---
const T = {
    EMPTY: 0, SAND: 1, WATER: 2, STONE: 3, FIRE: 4, ACID: 5, STEAM: 6,
    METAL: 7, WOOD: 8, PLANT: 9, BATTERY: 10, OIL: 11, C4: 12, LAVA: 13,
    GUNPOWDER: 14, FUSE: 15, GLASS: 16, GAS: 17, SMOKE: 18, EMBER: 19
};

// --- PROPERTIES ---
const PROPS = {
    [T.EMPTY]: { density: 0, state: 2 },
    [T.SAND]: { density: 15, state: 0, loose: true },
    [T.WATER]: { density: 5, state: 1, flow: 1 },
    [T.STONE]: { density: 100, state: 0 },
    [T.FIRE]: { density: -1, state: 2, life: 10, temp: 800 },
    [T.ACID]: { density: 6, state: 1, flow: 0.5 },
    [T.STEAM]: { density: -2, state: 2, life: 300, temp: 150 },
    [T.METAL]: { density: 100, state: 0 },
    // Density 0 means it won't fall (Static)
    [T.WOOD]: { density: 0, state: 0, burn: 300, burnTo: T.FIRE },
    [T.PLANT]: { density: 0, state: 0, burn: 200, burnTo: T.FIRE },
    [T.BATTERY]: { density: 0, state: 0 }, 
    [T.OIL]: { density: 4, state: 1, burn: 250, burnTo: T.FIRE },
    [T.C4]: { density: 0, state: 0, burn: 1, explosive: true }, // C4 should stick too
    [T.LAVA]: { density: 50, state: 1, flow: 0.1, temp: 1000 },
    [T.GUNPOWDER]: { density: 12, state: 0, loose: true, burn: 50, burnTo: T.FIRE },
    [T.FUSE]: { density: 0, state: 0, burn: 280, burnTo: T.FIRE },
    [T.GLASS]: { density: 0, state: 0 }, // Glass usually shouldn't fall either
    [T.GAS]: { density: -1, state: 2, burn: 50, burnTo: T.FIRE },
    [T.SMOKE]: { density: -1, state: 2, life: 150 },
    [T.EMBER]: { density: 1, state: 0, loose: true, temp: 600, life: 100 }
};
// --- GLOBAL STATE ---
let width, height;
let cells, pixels, extra, temp;
let PALETTES = {};
let frameCount = 0;
let brushSize = 6;
let currentTool = T.SAND;
// Define global canvas and context variables here
let canvas;
let ctx;