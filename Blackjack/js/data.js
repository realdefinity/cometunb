const SUITS = ['♥', '♦', '♣', '♠'];
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

const PIP_LAYOUTS = {
  2: [[2,1],[2,5]], 3: [[2,1],[2,3],[2,5]], 4: [[1,1],[3,1],[1,5],[3,5]],
  5: [[1,1],[3,1],[2,3],[1,5],[3,5]], 6: [[1,1],[3,1],[1,3],[3,3],[1,5],[3,5]],
  7: [[1,1],[3,1],[2,2],[1,3],[3,3],[1,5],[3,5]], 8: [[1,1],[3,1],[2,2],[1,3],[3,3],[2,4],[1,5],[3,5]],
  9: [[1,1],[2,1],[3,1],[1,3],[2,3],[3,3],[1,5],[2,5],[3,5]],
  10: [[1,1],[2,1],[3,1],[1,2],[3,2],[1,4],[3,4],[1,5],[2,5],[3,5]]
};

const LOAN_DEATH_HANDS = 5;
const SHOP_ITEMS = [
  { id: 'coin-boost', name: 'Pocket Change', icon: '🪙', desc: '+15 coins right now', price: 8, type: 'consumable', max: 10 },
  { id: 'rebet-boost', name: 'Rebet Boost', icon: '📈', desc: 'Rebet gives 1.5× last bet once', price: 12, type: 'consumable', max: 5 },
  { id: 'quick-cash', name: 'Quick Cash', icon: '💵', desc: 'Add $200 to wallet now', price: 15, type: 'consumable', max: 5 },
  { id: 'grace-period', name: 'Grace Period', icon: '⏰', desc: '+3 hands before loan collection', price: 22, type: 'consumable', max: 5 },
  { id: 'insurance-discount', name: 'Insurance Discount', icon: '🛡️', desc: '50% off insurance for 10 hands', price: 28, type: 'consumable', max: 5 },
  { id: 'extra-life', name: 'Extra Life', icon: '❤️', desc: 'Survive one loan collection', price: 45, type: 'consumable', max: 3 },
  { id: 'double-anywhere', name: 'Double Anywhere', icon: '⚡', desc: 'Double down on 3+ cards (5 uses)', price: 55, type: 'consumable', max: 3 },
  { id: 'split-master', name: 'Split Master', icon: '✂️', desc: 'Split any pair (3 uses)', price: 60, type: 'consumable', max: 2 },
  { id: 'lucky-start', name: 'Lucky Start', icon: '🍀', desc: 'Start each game with $1,500', price: 95, type: 'permanent', max: 1 },
  { id: 'high-roller', name: 'High Roller', icon: '🃏', desc: 'Start each game with $2,000', price: 180, type: 'permanent', max: 1 },
  { id: 'insurance-pro', name: 'Insurance Pro', icon: '🛡️', desc: 'Free insurance for 5 hands', price: 70, type: 'consumable', max: 2 },
  { id: 'comeback-coin', name: 'Comeback Coin', icon: '🔄', desc: 'Win: +5 coins. Lose: refund 1 bet', price: 35, type: 'consumable', max: 3 }
];
