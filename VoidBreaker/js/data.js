window.WEAPONS = {
    // --- COMMON ---
    rifle: { name: 'Assault Rifle', damage: 20, cooldown: 12, speed: 14, spread: 0.1, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Standard issue automatic.', price: 0 },
    shotgun: { name: 'Scattergun', damage: 12, cooldown: 55, speed: 11, spread: 0.4, count: 6, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Close range burst.', price: 0 },
    smg: { name: 'Vector', damage: 8, cooldown: 5, speed: 13, spread: 0.25, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'High fire rate.', price: 0 },
    
    // --- RARE ---
    sniper: { name: 'Railgun', damage: 90, cooldown: 70, speed: 25, spread: 0.01, count: 1, pierce: 4, color: '#38bdf8', rarity: 'rare', desc: 'Pierces multiple targets.', price: 2000 },
    blaster: { name: 'Plasma Pistol', damage: 35, cooldown: 15, speed: 10, spread: 0.05, count: 1, pierce: 1, color: '#38bdf8', rarity: 'rare', desc: 'Energy rounds.', price: 2000 },
    flak: { name: 'Flak Cannon', damage: 25, cooldown: 40, speed: 12, spread: 0.2, count: 3, pierce: 1, color: '#38bdf8', rarity: 'rare', desc: 'Anti-air style spread.', price: 2000 },

    // --- EPIC ---
    minigun: { name: 'Vulcan', damage: 15, cooldown: 2, speed: 18, spread: 0.3, count: 1, pierce: 1, color: '#a855f7', rarity: 'epic', desc: 'Lead rain.', price: 5000 },
    laser: { name: 'Beam Rifle', damage: 15, cooldown: 1, speed: 30, spread: 0, count: 1, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Continuous laser stream.', price: 5000 },
    launcher: { name: 'Rocket Pod', damage: 100, cooldown: 90, speed: 8, spread: 0.1, count: 1, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Explosive rounds.', price: 5000 },

    // --- LEGENDARY ---
    hydra: { name: 'The Hydra', damage: 40, cooldown: 10, speed: 15, spread: 0.5, count: 5, pierce: 2, color: '#fbbf24', rarity: 'legendary', desc: 'Automatic shotgun chaos.', price: 10000 },
    void_cannon: { name: 'Void Cannon', damage: 500, cooldown: 120, speed: 5, spread: 0, count: 1, pierce: 99, color: '#fbbf24', rarity: 'legendary', desc: 'Erases everything in a line.', price: 10000 },
    arc_caster: { name: 'Tesla Prime', damage: 5, cooldown: 1, speed: 20, spread: 360, count: 8, pierce: 0, color: '#fbbf24', rarity: 'legendary', desc: 'Omni-directional lightning.', price: 10000 }
};

window.UPGRADES_DB = [
    // Stats
    { id: 'dmg_1', name: 'Hollow Points', desc: '+20% Damage', rarity: 'common', type: 'stat', stat: 'damage', val: 1.2 },
    { id: 'rate_1', name: 'Rapid Fire', desc: '+15% Fire Rate', rarity: 'common', type: 'stat', stat: 'cooldown', val: 0.85 },
    { id: 'speed_1', name: 'Stim Pack', desc: '+10% Move Speed', rarity: 'common', type: 'stat', stat: 'maxSpeed', val: 1.1 },
    { id: 'hp_1', name: 'Nano Armor', desc: '+50 Max HP', rarity: 'common', type: 'heal', val: 50 },
    
    // Rare
    { id: 'pierce_1', name: 'Tungsten Core', desc: '+1 Pierce', rarity: 'rare', type: 'add', stat: 'pierce', val: 1 },
    { id: 'multi_1', name: 'Split Chamber', desc: '+1 Projectile', rarity: 'rare', type: 'add', stat: 'count', val: 1 },
    { id: 'regen_1', name: 'Repair Bot', desc: '+2 HP Regen', rarity: 'rare', type: 'add', stat: 'regen', val: 2 },
    
    // Epic
    { id: 'bounce_1', name: 'Rubberized', desc: 'Bullets bounce off walls', rarity: 'epic', type: 'bool', stat: 'ricochet' },
    { id: 'homing_1', name: 'Smart AI', desc: 'Bullets seek enemies', rarity: 'epic', type: 'bool', stat: 'homing' },
    { id: 'explode_1', name: 'Nitro Tip', desc: 'Enemies explode on death', rarity: 'epic', type: 'bool', stat: 'explosive' },
    
    // Legendary
    { id: 'tesla', name: 'Tesla Coil', desc: 'Nearby enemies take damage', rarity: 'legendary', type: 'bool', stat: 'tesla' },
    { id: 'freeze', name: 'Cryo Rounds', desc: 'Slows enemies by 50%', rarity: 'legendary', type: 'bool', stat: 'freeze' },
    { id: 'god_mode', name: 'Titan Hull', desc: '+200 HP, +2 Pierce', rarity: 'legendary', type: 'complex', apply: (p) => { p.maxHp += 200; p.hp += 200; p.pierce += 2; } },
    { id: 'overdrive', name: 'Overdrive', desc: '2x Fire Rate, 2x Spread', rarity: 'legendary', type: 'complex', apply: (p) => { p.maxCooldown *= 0.5; p.spread *= 2; } }
];