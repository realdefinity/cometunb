window.GAME_DATA = {
    multipliers: { xp: 1.0, gold: 1.0, damage: 1.0 },
    prestigeLevel: 0,
    skins: [
        { id: 'default', name: 'Standard', color: '#38bdf8', unlocked: true },
        { id: 'crimson', name: 'Crimson', color: '#ef4444', unlocked: false, rarity: 'rare' },
        { id: 'midas', name: 'Midas', color: '#fbbf24', unlocked: false, rarity: 'legendary' },
        { id: 'neon', name: 'Neon', color: '#00f3ff', unlocked: false, rarity: 'epic' },
        { id: 'void', name: 'Void', color: '#1e293b', unlocked: false, rarity: 'epic' }
    ],
    currentSkin: 'default'
};

window.WEAPONS = {
    rifle: { name: 'Assault Rifle', damage: 20, cooldown: 12, speed: 14, spread: 0.1, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Standard issue automatic.', price: 0 },
    shotgun: { name: 'Scattergun', damage: 12, cooldown: 55, speed: 11, spread: 0.4, count: 6, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Close range burst.', price: 0 },
    smg: { name: 'Vector', damage: 8, cooldown: 5, speed: 13, spread: 0.25, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'High fire rate.', price: 0 },
    sniper: { name: 'Railgun', damage: 90, cooldown: 70, speed: 25, spread: 0.01, count: 1, pierce: 4, color: '#38bdf8', rarity: 'rare', desc: 'Pierces multiple targets.', price: 2000 },
    blaster: { name: 'Plasma Pistol', damage: 35, cooldown: 15, speed: 10, spread: 0.05, count: 1, pierce: 1, color: '#38bdf8', rarity: 'rare', desc: 'Energy rounds.', price: 2000 },
    flak: { name: 'Flak Cannon', damage: 25, cooldown: 40, speed: 12, spread: 0.2, count: 3, pierce: 1, color: '#38bdf8', rarity: 'rare', desc: 'Anti-air style spread.', price: 2000 },
    minigun: { name: 'Vulcan', damage: 15, cooldown: 2, speed: 18, spread: 0.3, count: 1, pierce: 1, color: '#a855f7', rarity: 'epic', desc: 'Lead rain.', price: 5000 },
    laser: { name: 'Beam Rifle', damage: 15, cooldown: 1, speed: 30, spread: 0, count: 1, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Continuous laser stream.', price: 5000 },
    launcher: { name: 'Rocket Pod', damage: 100, cooldown: 90, speed: 8, spread: 0.1, count: 1, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Explosive rounds.', price: 5000 },
    hydra: { name: 'The Hydra', damage: 40, cooldown: 10, speed: 15, spread: 0.5, count: 5, pierce: 2, color: '#fbbf24', rarity: 'legendary', desc: 'Automatic shotgun chaos.', price: 10000 },
    void_cannon: { name: 'Void Cannon', damage: 500, cooldown: 120, speed: 5, spread: 0, count: 1, pierce: 99, color: '#fbbf24', rarity: 'legendary', desc: 'Erases everything in a line.', price: 10000 },
    arc_caster: { name: 'Tesla Prime', damage: 5, cooldown: 1, speed: 20, spread: 360, count: 8, pierce: 0, color: '#fbbf24', rarity: 'legendary', desc: 'Omni-directional lightning.', price: 10000 }
};

window.UPGRADES_DB = [
    // --- COMMON (Weight: 100) ---
    { id: 'dmg', name: 'Hollow Points', desc: '+15% Damage', rarity: 'common', weight: 100, max: 10, type: 'stat', stat: 'damage', val: 1.15 },
    { id: 'rate', name: 'Rapid Fire', desc: '+10% Fire Rate', rarity: 'common', weight: 100, max: 10, type: 'stat', stat: 'cooldown', val: 0.9 },
    { id: 'speed', name: 'Stim Pack', desc: '+8% Move Speed', rarity: 'common', weight: 100, max: 8, type: 'stat', stat: 'maxSpeed', val: 1.08 },
    { id: 'hp', name: 'Nano Armor', desc: '+25 Max HP', rarity: 'common', weight: 80, max: 10, type: 'heal', val: 25 },
    { id: 'mag', name: 'Magnet', desc: '+25% Pickup Range', rarity: 'common', weight: 80, max: 5, type: 'stat', stat: 'pickupRange', val: 1.25 },
    
    // --- RARE (Weight: 40, Min Wave: 2) ---
    { id: 'pierce', name: 'Tungsten Core', desc: '+1 Pierce', rarity: 'rare', weight: 40, minWave: 2, max: 3, type: 'add', stat: 'pierce', val: 1 },
    { id: 'multi', name: 'Split Chamber', desc: '+1 Projectile', rarity: 'rare', weight: 40, minWave: 3, max: 3, type: 'add', stat: 'count', val: 1 },
    { id: 'regen', name: 'Repair Bot', desc: '+1 HP Regen/sec', rarity: 'rare', weight: 30, minWave: 2, max: 5, type: 'add', stat: 'regen', val: 1 },
    { id: 'crit', name: 'Scope Lens', desc: '+10% Crit Chance', rarity: 'rare', weight: 30, minWave: 2, max: 5, type: 'add', stat: 'critChance', val: 0.1 },
    { id: 'backshot', name: 'Rear Guard', desc: 'Shoot 1 bullet backwards', rarity: 'rare', weight: 25, minWave: 4, max: 1, type: 'bool', stat: 'backshot' },

    // --- EPIC (Weight: 10, Min Wave: 5) ---
    { id: 'bounce', name: 'Ricochet', desc: 'Bullets bounce off walls', rarity: 'epic', weight: 10, minWave: 5, max: 1, type: 'bool', stat: 'ricochet' },
    { id: 'homing', name: 'Smart AI', desc: 'Bullets seek enemies', rarity: 'epic', weight: 10, minWave: 6, max: 1, type: 'bool', stat: 'homing' },
    { id: 'explode', name: 'Nitro Tip', desc: 'Enemies explode on death', rarity: 'epic', weight: 10, minWave: 5, max: 1, type: 'bool', stat: 'explosive' },
    { id: 'dash_nova', name: 'Dash Nova', desc: 'Dashing releases an explosion', rarity: 'epic', weight: 10, minWave: 4, max: 1, type: 'bool', stat: 'dashNova' },
    { id: 'vamp', name: 'Vampirism', desc: '5% Lifesteal on hit', rarity: 'epic', weight: 10, minWave: 5, max: 3, type: 'add', stat: 'lifesteal', val: 0.05 },

    // --- LEGENDARY (Weight: 2, Min Wave: 8) ---
    { id: 'tesla', name: 'Tesla Coil', desc: 'Zaps nearby enemies', rarity: 'legendary', weight: 2, minWave: 8, max: 1, type: 'bool', stat: 'tesla' },
    { id: 'freeze', name: 'Cryo Rounds', desc: 'Slows enemies by 50%', rarity: 'legendary', weight: 2, minWave: 8, max: 1, type: 'bool', stat: 'freeze' },
    { id: 'god_mode', name: 'Titan Hull', desc: '+200 HP, +2 Pierce', rarity: 'legendary', weight: 1, minWave: 10, max: 1, type: 'complex', apply: (p) => { p.maxHp += 200; p.hp += 200; p.pierce += 2; } },
    { id: 'black_hole', name: 'Singularity', desc: 'Chance to spawn Black Holes', rarity: 'legendary', weight: 1, minWave: 12, max: 1, type: 'bool', stat: 'blackHole' },

    // --- DYNAMIC (Requires Prerequisite) ---
    { id: 'chain_lightning', name: 'Chain Lightning', desc: 'Tesla arcs to more targets', rarity: 'legendary', weight: 5, req: 'tesla', max: 1, type: 'complex', apply: (p) => { p.teslaRange = 400; p.teslaCount = 3; } },
    { id: 'shatter', name: 'Shatter', desc: 'Frozen enemies explode into shards', rarity: 'legendary', weight: 5, req: 'freeze', max: 1, type: 'bool', stat: 'shatter' },
    { id: 'cluster', name: 'Cluster Bomb', desc: 'Explosions spawn mini-bombs', rarity: 'legendary', weight: 5, req: 'explode', max: 1, type: 'bool', stat: 'cluster' },
];