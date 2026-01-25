// Init Inputs
const mainBtn = document.getElementById('main-btn');
mainBtn.addEventListener('mousedown', clickAction);
mainBtn.addEventListener('touchstart', clickAction);

// Remove the old 3D tilt listeners to ensure no conflict.

// Start Game
loadLocal();
renderShop();
requestAnimationFrame(gameLoop);