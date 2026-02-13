window.WEAPONS = {
    rifle: { name: 'Rifle', damage: 20, cooldown: 12, speed: 14, spread: 0.1, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Basic automatic fire.', price: 0 },
    shotgun: { name: 'Shotgun', damage: 12, cooldown: 55, speed: 11, spread: 0.4, count: 6, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Close range burst.', price: 0 },
    smg: { name: 'SMG', damage: 8, cooldown: 5, speed: 13, spread: 0.25, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Very fast fire rate.', price: 0 },
    pistol: { name: 'Pistol', damage: 25, cooldown: 20, speed: 16, spread: 0.05, count: 1, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Accurate and steady.', price: 0 },
    burst: { name: 'Burst Rifle', damage: 15, cooldown: 25, speed: 15, spread: 0.08, count: 3, pierce: 0, color: '#94a3b8', rarity: 'common', desc: 'Fires in bursts of three.', price: 0 },
    crossbow: { name: 'Crossbow', damage: 45, cooldown: 45, speed: 22, spread: 0.02, count: 1, pierce: 2, color: '#38bdf8', rarity: 'rare', desc: 'Strong bolts that go through enemies.', price: 2000 },
    sniper: { name: 'Sniper', damage: 90, cooldown: 70, speed: 25, spread: 0.01, count: 1, pierce: 4, color: '#38bdf8', rarity: 'rare', desc: 'Hits through multiple targets.', price: 2000 },
    blaster: { name: 'Blaster', damage: 35, cooldown: 15, speed: 10, spread: 0.05, count: 1, pierce: 1, color: '#38bdf8', rarity: 'rare', desc: 'Powerful energy shots.', price: 2000 },
    flak: { name: 'Flak Gun', damage: 25, cooldown: 40, speed: 12, spread: 0.2, count: 3, pierce: 1, color: '#38bdf8', rarity: 'rare', desc: 'Wide spread shots.', price: 2000 },
    grenade: { name: 'Grenade Launcher', damage: 60, cooldown: 50, speed: 10, spread: 0.1, count: 1, pierce: 0, color: '#38bdf8', rarity: 'rare', desc: 'Explosive rounds.', price: 2000 },
    minigun: { name: 'Minigun', damage: 15, cooldown: 2, speed: 18, spread: 0.3, count: 1, pierce: 1, color: '#a855f7', rarity: 'epic', desc: 'Sprays a ton of bullets.', price: 5000 },
    laser: { name: 'Laser', damage: 15, cooldown: 1, speed: 30, spread: 0, count: 1, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Non-stop beam of damage.', price: 5000 },
    launcher: { name: 'Rocket Launcher', damage: 100, cooldown: 90, speed: 8, spread: 0.1, count: 1, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Big explosions.', price: 5000 },
    spreader: { name: 'Spreader', damage: 18, cooldown: 15, speed: 12, spread: 0.6, count: 7, pierce: 0, color: '#a855f7', rarity: 'epic', desc: 'Fans out lots of shots.', price: 5000 },
    hydra: { name: 'Hydra', damage: 40, cooldown: 10, speed: 15, spread: 0.5, count: 5, pierce: 2, color: '#fbbf24', rarity: 'legendary', desc: 'Rapid fire shotgun madness.', price: 10000 },
    void_cannon: { name: 'Void Cannon', damage: 500, cooldown: 120, speed: 5, spread: 0, count: 1, pierce: 99, color: '#fbbf24', rarity: 'legendary', desc: 'Destroys everything in its path.', price: 10000 },
    arc_caster: { name: 'Arc Caster', damage: 5, cooldown: 1, speed: 20, spread: 360, count: 8, pierce: 0, color: '#fbbf24', rarity: 'legendary', desc: 'Shoots in all directions at once.', price: 10000 },
    railgun: { name: 'Railgun', damage: 120, cooldown: 60, speed: 35, spread: 0, count: 1, pierce: 6, color: '#fbbf24', rarity: 'legendary', desc: 'Ultra fast, goes through everything.', price: 10000 }
};

window.UPGRADES_DB = [
    // --- BASIC UPGRADES ---
    { id: 'dmg', name: 'Damage Up', desc: '+15% more damage', rarity: 'common', weight: 100, max: 10, type: 'stat', stat: 'damage', val: 1.15 },
    { id: 'rate', name: 'Faster Shooting', desc: '+10% fire rate', rarity: 'common', weight: 100, max: 10, type: 'stat', stat: 'cooldown', val: 0.9 },
    { id: 'speed', name: 'Speed Boost', desc: '+8% movement speed', rarity: 'common', weight: 100, max: 8, type: 'stat', stat: 'maxSpeed', val: 1.08 },
    { id: 'hp', name: 'Extra Health', desc: '+25 max health', rarity: 'common', weight: 80, max: 10, type: 'heal', val: 25 },
    { id: 'mag', name: 'Magnet', desc: '+25% pickup range', rarity: 'common', weight: 80, max: 5, type: 'stat', stat: 'pickupRange', val: 1.25 },
    
    // --- RARE UPGRADES ---
    { id: 'pierce', name: 'Pierce', desc: 'Shots go through +1 enemy', rarity: 'rare', weight: 40, minWave: 2, max: 3, type: 'add', stat: 'pierce', val: 1 },
    { id: 'multi', name: 'Multi-Shot', desc: '+1 extra bullet', rarity: 'rare', weight: 40, minWave: 3, max: 3, type: 'add', stat: 'count', val: 1 },
    { id: 'regen', name: 'Healing', desc: '+1 health per second', rarity: 'rare', weight: 30, minWave: 2, max: 5, type: 'add', stat: 'regen', val: 1 },
    { id: 'crit', name: 'Critical Hit', desc: '+10% chance to crit', rarity: 'rare', weight: 30, minWave: 2, max: 5, type: 'add', stat: 'critChance', val: 0.1 },
    { id: 'backshot', name: 'Back Shot', desc: 'Shoot 1 bullet backwards', rarity: 'rare', weight: 25, minWave: 4, max: 1, type: 'bool', stat: 'backshot' },
    
    // --- EPIC UPGRADES ---
    { id: 'bounce', name: 'Ricochet', desc: 'Bullets bounce off walls', rarity: 'epic', weight: 10, minWave: 5, max: 1, type: 'bool', stat: 'ricochet' },
    { id: 'homing', name: 'Homing Shots', desc: 'Bullets chase enemies', rarity: 'epic', weight: 10, minWave: 6, max: 1, type: 'bool', stat: 'homing' },
    { id: 'explode', name: 'Explosions', desc: 'Enemies blow up on death', rarity: 'epic', weight: 10, minWave: 5, max: 1, type: 'bool', stat: 'explosive' },
    { id: 'dash_nova', name: 'Dash Blast', desc: 'Dashing makes an explosion', rarity: 'epic', weight: 10, minWave: 4, max: 1, type: 'bool', stat: 'dashNova' },
    { id: 'vamp', name: 'Lifesteal', desc: 'Heal 5% of damage dealt', rarity: 'epic', weight: 10, minWave: 5, max: 3, type: 'add', stat: 'lifesteal', val: 0.05 },
    
    // --- LEGENDARY UPGRADES ---
    { id: 'tesla', name: 'Lightning', desc: 'Zaps nearby enemies', rarity: 'legendary', weight: 2, minWave: 8, max: 1, type: 'bool', stat: 'tesla' },
    { id: 'freeze', name: 'Freeze', desc: 'Slows all enemies by 50%', rarity: 'legendary', weight: 2, minWave: 8, max: 1, type: 'bool', stat: 'freeze' },
    { id: 'god_mode', name: 'Tank', desc: '+200 health, +2 pierce', rarity: 'legendary', weight: 1, minWave: 10, max: 1, type: 'complex', apply: (p) => { p.maxHp += 200; p.hp += 200; p.pierce += 2; } },
    { id: 'black_hole', name: 'Vortex', desc: 'Chance to spawn vortexes that pull enemies in', rarity: 'legendary', weight: 1, minWave: 12, max: 1, type: 'bool', stat: 'blackHole' },
    { id: 'chain_lightning', name: 'Chain Zap', desc: 'Lightning hits even more targets', rarity: 'legendary', weight: 5, req: 'tesla', max: 1, type: 'complex', apply: (p) => { p.teslaRange = 400; p.teslaCount = 3; } },
    { id: 'shatter', name: 'Shatter', desc: 'Frozen enemies explode', rarity: 'legendary', weight: 5, req: 'freeze', max: 1, type: 'bool', stat: 'shatter' },
    { id: 'cluster', name: 'Cluster Bombs', desc: 'Explosions make more explosions', rarity: 'legendary', weight: 5, req: 'explode', max: 1, type: 'bool', stat: 'cluster' },
    
    // --- UTILITY / STATS ---
    { id: 'dash_cd', name: 'Quick Dash', desc: '-15% dash cooldown', rarity: 'common', weight: 80, max: 5, type: 'stat', stat: 'dashCooldown', val: 0.85 },
    { id: 'luck', name: 'Lucky', desc: '+10% better drops', rarity: 'uncommon', weight: 60, max: 5, type: 'add', stat: 'luck', val: 0.1 },
    { id: 'greed', name: 'Greedy', desc: '+20% more gold', rarity: 'uncommon', weight: 60, max: 5, type: 'stat', stat: 'goldMult', val: 1.2 },
    
    // --- COMBAT ---
    { id: 'executioner', name: 'Executioner', desc: '+50% damage to low health enemies', rarity: 'rare', weight: 40, minWave: 4, max: 1, type: 'bool', stat: 'executioner' },
    { id: 'rage', name: 'Berserk', desc: 'Deal more damage the lower your health', rarity: 'rare', weight: 40, minWave: 5, max: 1, type: 'bool', stat: 'rage' },
    { id: 'ghost', name: 'Ghost', desc: '15% chance to dodge hits', rarity: 'rare', weight: 30, minWave: 6, max: 3, type: 'add', stat: 'dodgeChance', val: 0.15 },
    { id: 'sniper_training', name: 'Sniper Training', desc: '+30% range and speed, slightly slower fire rate', rarity: 'rare', weight: 35, minWave: 3, max: 3, type: 'complex', apply: (p) => { p.range *= 1.3; p.speed *= 1.3; p.cooldown *= 1.1; } },
    { id: 'spray_pray', name: 'Spray & Pray', desc: 'Way faster shooting, less accurate', rarity: 'rare', weight: 35, minWave: 3, max: 3, type: 'complex', apply: (p) => { p.cooldown *= 0.75; p.spread += 0.1; } },

    // --- LATE GAME ---
    { id: 'orbitals', name: 'Orbitals', desc: '2 orbs spin around you dealing damage', rarity: 'epic', weight: 15, minWave: 8, max: 3, type: 'complex', apply: (p) => { p.orbitals = (p.orbitals || 0) + 2; } },
    { id: 'split_shot', name: 'Split Shot', desc: 'Fire 2 extra shots to the sides', rarity: 'epic', weight: 15, minWave: 10, max: 1, type: 'bool', stat: 'splitShot' },
    { id: 'rear_guard', name: 'Rear Guard', desc: 'Fire 2 extra shots behind you', rarity: 'epic', weight: 15, minWave: 8, max: 1, type: 'bool', stat: 'rearGuard' },
    
    // --- SUPER LATE GAME ---
    { id: 'time_warp', name: 'Slow Motion', desc: 'All enemies move 30% slower forever', rarity: 'legendary', weight: 3, minWave: 15, max: 1, type: 'complex', apply: (p) => { window.GAME_DATA.multipliers.enemySpeed = 0.7; } },
    { id: 'clone', name: 'Shadow Clone', desc: 'A clone copies your shots', rarity: 'legendary', weight: 2, minWave: 20, max: 1, type: 'bool', stat: 'clone' },
    { id: 'nuke', name: 'Nuke', desc: 'Huge explosion every 10 seconds', rarity: 'legendary', weight: 2, minWave: 18, max: 1, type: 'bool', stat: 'nuke' },
    { id: 'blood_pact', name: 'Blood Pact', desc: 'Double damage but half health', rarity: 'legendary', weight: 1, minWave: 12, max: 1, type: 'complex', apply: (p) => { p.damage *= 2; p.maxHp *= 0.5; p.hp = Math.min(p.hp, p.maxHp); } }
];

window.GAME_DATA = {
    multipliers: { xp: 1.0, gold: 1.0, damage: 1.0, enemySpeed: 1.0 },
    prestigeLevel: 0,
    weaponLevels: {},
    skins: [
        { id: 'default', name: 'Standard', color: '#38bdf8', unlocked: true },
        { id: 'crimson', name: 'Crimson', color: '#ef4444', unlocked: false, rarity: 'rare' },
        { id: 'midas', name: 'Midas', color: '#fbbf24', unlocked: false, rarity: 'legendary' },
        { id: 'neon', name: 'Neon', color: '#00f3ff', unlocked: false, rarity: 'epic' },
        { id: 'void', name: 'Shadow', color: '#1e293b', unlocked: false, rarity: 'epic' }
    ],
    currentSkin: 'default'
};