window.game = new window.Game();
window.CONFIG.selectedSize = 4;

window.addEventListener('keydown', e => {
    const map = { 38: 0, 87: 0, 39: 1, 68: 1, 40: 2, 83: 2, 37: 3, 65: 3 };
    if(map[e.keyCode] !== undefined) window.game.move(map[e.keyCode]);
    if(e.key === 'z') window.game.triggerUndo();
});

let touch = {x:0, y:0};
document.addEventListener('touchstart', e => { touch.x = e.touches[0].clientX; touch.y = e.touches[0].clientY; }, {passive:false});
document.addEventListener('touchmove', e => e.preventDefault(), {passive:false});
document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    if(Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if(Math.abs(dx) > Math.abs(dy)) window.game.move(dx > 0 ? 1 : 3);
    else window.game.move(dy > 0 ? 2 : 0);
});

window.addEventListener('resize', () => {
    window.game.setupGrid();
    window.game.tiles.forEach(t => t.render());
});