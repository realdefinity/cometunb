const PROGRESS_SAVE_KEY = 'blackjack.v1.progress';

function clonePerksDefaults() {
  return {
    luckyStart: false,
    highRoller: false,
    insuranceDiscountRemaining: 0,
    doubleAnywhereRemaining: 0,
    rebetBoostRemaining: 0,
    splitMasterRemaining: 0,
    insuranceProRemaining: 0,
    comebackCoinRemaining: 0
  };
}

function sanitizeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeInventory(rawInventory) {
  if (!rawInventory || typeof rawInventory !== 'object' || Array.isArray(rawInventory)) return {};

  const cleaned = {};
  for (const [key, value] of Object.entries(rawInventory)) {
    if (typeof key !== 'string') continue;
    const count = Math.floor(Number(value));
    if (Number.isFinite(count) && count > 0) cleaned[key] = count;
  }
  return cleaned;
}

function sanitizePerks(rawPerks) {
  const defaults = clonePerksDefaults();
  if (!rawPerks || typeof rawPerks !== 'object' || Array.isArray(rawPerks)) return defaults;

  return {
    luckyStart: Boolean(rawPerks.luckyStart),
    highRoller: Boolean(rawPerks.highRoller),
    insuranceDiscountRemaining: Math.max(0, Math.floor(sanitizeNumber(Number(rawPerks.insuranceDiscountRemaining), defaults.insuranceDiscountRemaining))),
    doubleAnywhereRemaining: Math.max(0, Math.floor(sanitizeNumber(Number(rawPerks.doubleAnywhereRemaining), defaults.doubleAnywhereRemaining))),
    rebetBoostRemaining: Math.max(0, Math.floor(sanitizeNumber(Number(rawPerks.rebetBoostRemaining), defaults.rebetBoostRemaining))),
    splitMasterRemaining: Math.max(0, Math.floor(sanitizeNumber(Number(rawPerks.splitMasterRemaining), defaults.splitMasterRemaining))),
    insuranceProRemaining: Math.max(0, Math.floor(sanitizeNumber(Number(rawPerks.insuranceProRemaining), defaults.insuranceProRemaining))),
    comebackCoinRemaining: Math.max(0, Math.floor(sanitizeNumber(Number(rawPerks.comebackCoinRemaining), defaults.comebackCoinRemaining)))
  };
}

function loadProgress() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const raw = window.localStorage.getItem(PROGRESS_SAVE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    coins = Math.max(0, Math.floor(sanitizeNumber(Number(parsed.coins), coins)));
    inventory = sanitizeInventory(parsed.inventory);
    perks = sanitizePerks(parsed.perks);
  } catch (_err) {
    // Ignore malformed/corrupt data so startup never crashes.
  }
}

function saveProgress() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const payload = {
    coins: Math.max(0, Math.floor(sanitizeNumber(Number(coins), 0))),
    inventory: sanitizeInventory(inventory),
    perks: sanitizePerks(perks)
  };

  try {
    window.localStorage.setItem(PROGRESS_SAVE_KEY, JSON.stringify(payload));
  } catch (_err) {
    // Ignore quota/private mode failures and keep the game functional.
  }
}
