document.getElementById('main-btn').addEventListener('mousedown', clickAction);
document.getElementById('main-btn').addEventListener('touchstart', clickAction);

loadLocal();
renderShop();
requestAnimationFrame(gameLoop);