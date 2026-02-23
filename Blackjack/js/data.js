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
  { id: 'extra-life', name: 'Extra Life', icon: '❤️', desc: 'Survive one loan collection', price: 50, type: 'consumable', max: 3 },
  { id: 'grace-period', name: 'Grace Period', icon: '⏰', desc: '+3 hands before loan collection', price: 30, type: 'consumable', max: 5 },
  { id: 'lucky-start', name: 'Lucky Start', icon: '🍀', desc: 'Start each game with $1,500', price: 120, type: 'permanent', max: 1 },
  { id: 'insurance-discount', name: 'Insurance Discount', icon: '🛡️', desc: '50% off insurance for 10 hands', price: 40, type: 'consumable', max: 5 },
  { id: 'double-anywhere', name: 'Double Anywhere', icon: '⚡', desc: 'Double down on 3+ cards (5 uses)', price: 75, type: 'consumable', max: 3 },
  { id: 'rebet-boost', name: 'Rebet Boost', icon: '📈', desc: 'Rebet gives 1.5× last bet once', price: 25, type: 'consumable', max: 5 }
];
