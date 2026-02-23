window.openShop = function() {
  const overlay = document.getElementById('shop-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.classList.add('visible');
  renderShop();
};

window.closeShop = function() {
  const overlay = document.getElementById('shop-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => { overlay.style.display = 'none'; }, 500);
}

function renderShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (els.shopCoinsVal) els.shopCoinsVal.textContent = coins;

  SHOP_ITEMS.forEach((item, idx) => {
    const owned = inventory[item.id] || 0;
    const canBuy = coins >= item.price && (item.max === 0 || owned < item.max);
    const el = document.createElement('div');
    el.className = 'shop-item' + (canBuy ? '' : ' disabled');
    el.style.animationDelay = (idx * 0.05) + 's';
    el.innerHTML = `
      <span class="shop-item-icon">${item.icon}</span>
      <span class="shop-item-name">${item.name}</span>
      <span class="shop-item-desc">${item.desc}</span>
      <div class="shop-item-footer">
        <span class="shop-item-price">${item.price} ⭐</span>
        ${owned > 0 ? `<span class="shop-item-owned">×${owned}</span>` : ''}
      </div>
    `;
    if (canBuy) {
      el.onclick = () => purchaseItem(item);
    }
    grid.appendChild(el);
  });
}

function purchaseItem(item) {
  const owned = inventory[item.id] || 0;
  if (coins < item.price) return;
  if (item.max > 0 && owned >= item.max) return;

  initAudio();
  playSound('chip');
  coins -= item.price;
  inventory[item.id] = owned + 1;

  if (item.id === 'extra-life') {}
  if (item.id === 'grace-period') {}
  if (item.id === 'lucky-start') perks.luckyStart = true;
  if (item.id === 'insurance-discount') perks.insuranceDiscountRemaining += 10;
  if (item.id === 'double-anywhere') perks.doubleAnywhereRemaining += 5;
  if (item.id === 'rebet-boost') perks.rebetBoostRemaining += 1;

  updateCoinsUI();
  renderShop();
}
