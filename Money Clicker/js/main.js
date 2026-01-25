// Remove old listeners if any, just to be safe
const mainBtn = document.getElementById('main-btn');
// The listeners are now handled inside game.js for tighter scope control

// Start
loadLocal();
renderShop();
requestAnimationFrame(gameLoop);