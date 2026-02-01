// --- CONFIGURATION ---
const SCALE = 4;
const GRAVITY_RATE = 1;

// --- ELEMENT IDS ---
const T = {
    EMPTY: 0, 
    // Nature / Sol
    SAND: 1, DIRT: 20, MUD: 21, SANDSTONE: 22,
    // Liquids
    WATER: 2, ACID: 5, OIL: 11, LAVA: 13, SLIME: 23, NITRO: 24, SALT_WATER: 25,
    // Solids
    STONE: 3, METAL: 7, GLASS: 16, BRICK: 26, CONCRETE: 27, WAX: 28,
    // Life
    WOOD: 8, PLANT: 9, FUSE: 15, VIRUS: 29, SPORE: 30,
    // Combustion
    FIRE: 4, SMOKE: 18, EMBER: 19, STEAM: 6, GUNPOWDER: 14, C4: 12, THERMITE: 31,
    // Cold
    ICE: 32, SNOW: 33,
    // Gases / Space
    GAS: 17, METHANE: 34, HELIUM: 35, ANTIMATTER: 36
};

// --- PROPERTIES ---
// state: 0=solid, 1=liquid, 2=gas
// density: High sinks, Low floats. (Solids > 0, Gases < 0)
const PROPS = {
    [T.EMPTY]: { density: 0, state: 2 },
    
    // SOLIDS (LOOSE)
    [T.SAND]: { density: 15, state: 0, loose: true, temp: 22 },
    [T.DIRT]: { density: 14, state: 0, loose: true, temp: 22 },
    [T.SNOW]: { density: 5, state: 0, loose: true, temp: 0, melt: 20, meltTo: T.WATER },
    [T.GUNPOWDER]: { density: 12, state: 0, loose: true, burn: 50, burnTo: T.FIRE },
    [T.EMBER]: { density: 1, state: 0, loose: true, temp: 600, life: 100 },
    [T.SPORE]: { density: 2, state: 0, loose: true, life: 500 }, // Grows plants

    // SOLIDS (STATIC)
    [T.STONE]: { density: 100, state: 0 },
    [T.METAL]: { density: 100, state: 0, conduct: true },
    [T.GLASS]: { density: 0, state: 0 }, // Transparent
    [T.BRICK]: { density: 0, state: 0 },
    [T.CONCRETE]: { density: 0, state: 0 },
    [T.WOOD]: { density: 0, state: 0, burn: 300, burnTo: T.FIRE },
    [T.PLANT]: { density: 0, state: 0, burn: 200, burnTo: T.FIRE },
    [T.FUSE]: { density: 0, state: 0, burn: 280, burnTo: T.FIRE },
    [T.ICE]: { density: 0, state: 0, temp: -10, melt: 10, meltTo: T.WATER },
    [T.WAX]: { density: 0, state: 0, melt: 60, meltTo: T.OIL }, // Meltable solid
    [T.C4]: { density: 0, state: 0, burn: 1, explosive: true },
    [T.THERMITE]: { density: 20, state: 0, burn: 100, burnTo: T.LAVA, temp: 2000 }, // Hot burn

    // LIQUIDS
    [T.WATER]: { density: 5, state: 1, flow: 1 },
    [T.SALT_WATER]: { density: 6, state: 1, flow: 1 },
    [T.ACID]: { density: 6, state: 1, flow: 0.5 },
    [T.OIL]: { density: 4, state: 1, burn: 250, burnTo: T.FIRE },
    [T.NITRO]: { density: 4, state: 1, burn: 1, explosive: true }, // Liquid explosive
    [T.LAVA]: { density: 50, state: 1, flow: 0.1, temp: 1000 },
    [T.MUD]: { density: 8, state: 1, flow: 0.2 }, // Slow liquid
    [T.SLIME]: { density: 6, state: 1, flow: 0.1, burn: 100, burnTo: T.ACID },
    [T.VIRUS]: { density: 2, state: 1, flow: 0.8 }, // Infects

    // GASES
    [T.STEAM]: { density: -2, state: 2, life: 300, temp: 150 },
    [T.SMOKE]: { density: -1, state: 2, life: 150 },
    [T.FIRE]: { density: -1, state: 2, life: 10, temp: 800 },
    [T.METHANE]: { density: -3, state: 2, burn: 20, burnTo: T.FIRE },
    [T.HELIUM]: { density: -5, state: 2 }, // Rises fast
    
    // SPECIAL
    [T.ANTIMATTER]: { density: 0, state: 0 }
};

// --- GLOBAL STATE ---
let width, height;
let cells, pixels, extra, temp;
let PALETTES = {};
let frameCount = 0;
let brushSize = 6;
let currentTool = T.SAND;
let canvas, ctx;