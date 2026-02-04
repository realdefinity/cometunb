window.WEAPONS = {
    rifle: { name: 'Assault Rifle', damage: 20, cooldown: 12, speed: 14, spread: 0.1, count: 1, pierce: 0, color: '#38bdf8', desc: 'Balanced automatic fire.', price: 0 },
    shotgun: { name: 'Scattergun', damage: 12, cooldown: 55, speed: 11, spread: 0.4, count: 6, pierce: 0, color: '#fbbf24', desc: 'High damage close range burst.', price: 2500 },
    sniper: { name: 'Railgun', damage: 90, cooldown: 70, speed: 25, spread: 0.01, count: 1, pierce: 3, color: '#ef4444', desc: 'Piercing high-velocity rounds.', price: 8000 },
    smg: { name: 'Vector X', damage: 9, cooldown: 4, speed: 13, spread: 0.25, count: 1, pierce: 0, color: '#a855f7', desc: 'Extreme fire rate prototype.', price: 50000 }
};

window.UPGRADES_DB = [
    { id: 'dmg_1', name: 'Hollow Points', desc: '+15% Damage', rarity: 'common', type: 'stat', stat: 'damage', val: 0.15 },
    { id: 'rate_1', name: 'Oiled Action', desc: '+10% Fire Rate', rarity: 'common', type: 'stat', stat: 'cooldown', val: 0.9 },
    { id: 'speed_1', name: 'Lightweight', desc: '+8% Move Speed', rarity: 'common', type: 'stat', stat: 'maxSpeed', val: 1.08 },
    { id: 'hp_1', name: 'Armor Plate', desc: '+25 Max HP', rarity: 'common', type: 'heal', val: 25 },
    { id: 'mag_1', name: 'Magnet', desc: '+30% Pickup Range', rarity: 'common', type: 'stat', stat: 'pickupRange', val: 1.3 },
    { id: 'reload_1', name: 'Quick Charge', desc: '-10% Dash Cooldown', rarity: 'common', type: 'stat', stat: 'dashCdMax', val: 0.9 },
    { id: 'crit_1', name: 'Scope Lens', desc: '+10% Crit Chance', rarity: 'rare', type: 'add', stat: 'critChance', val: 0.1 },
    { id: 'crit_dmg', name: 'High Impact', desc: '+50% Crit Damage', rarity: 'rare', type: 'add', stat: 'critMult', val: 0.5 },
    { id: 'pierce_1', name: 'FMJ Rounds', desc: 'Bullets pierce +1 enemy', rarity: 'rare', type: 'add', stat: 'pierce', val: 1 },
    { id: 'regen_1', name: 'Nanobots', desc: 'Regen 1 HP/sec', rarity: 'rare', type: 'add', stat: 'regen', val: 1 },
    { id: 'speed_bullet', name: 'Accelerator', desc: '+25% Bullet Speed', rarity: 'rare', type: 'stat', stat: 'bulletSpeed', val: 1.25 },
    { id: 'vamp_1', name: 'Vampirism', desc: '2% Chance to heal on kill', rarity: 'rare', type: 'add', stat: 'lifesteal', val: 0.02 },
    { id: 'multi_1', name: 'Twin Link', desc: 'Fire 1 additional projectile', rarity: 'epic', type: 'add', stat: 'count', val: 1 },
    { id: 'bounce_1', name: 'Ricochet', desc: 'Bullets bounce off walls', rarity: 'epic', type: 'bool', stat: 'ricochet' },
    { id: 'homing_1', name: 'Smart Rounds', desc: 'Bullets steer towards enemies', rarity: 'epic', type: 'bool', stat: 'homing' },
    { id: 'explode_1', name: 'Blast Radius', desc: 'Enemies explode on death', rarity: 'epic', type: 'bool', stat: 'explosive' },
    { id: 'dodge_1', name: 'Phase Shift', desc: '15% Chance to dodge damage', rarity: 'epic', type: 'add', stat: 'dodge', val: 0.15 },
    { id: 'omega_dmg', name: 'Omega Output', desc: '+100% Damage, -20% Fire Rate', rarity: 'legendary', type: 'complex', apply: (p) => { p.damage *= 2; p.maxCooldown *= 1.2; } },
    { id: 'minigun', name: 'Overclock', desc: '+50% Fire Rate, -20% Damage', rarity: 'legendary', type: 'complex', apply: (p) => { p.maxCooldown *= 0.5; p.damage *= 0.8; } },
    { id: 'tank_mode', name: 'Juggernaut', desc: '+100 Max HP, -10% Speed', rarity: 'legendary', type: 'complex', apply: (p) => { p.maxHp += 100; p.hp += 100; p.maxSpeed *= 0.9; } },
];