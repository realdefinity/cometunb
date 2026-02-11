window.keys = {};
window.mobileInput = { move: {x:0,y:0,active:false}, aim: {x:0,y:0,active:false}, dash: false };
window.mouse = { x: 0, y: 0, down: false };

window.addEventListener('keydown', e => window.keys[e.key] = true);
window.addEventListener('keyup', e => window.keys[e.key] = false);
window.addEventListener('mousemove', e => { window.mouse.x=e.clientX; window.mouse.y=e.clientY; });
window.addEventListener('mousedown', () => window.mouse.down = true);
window.addEventListener('mouseup', () => window.mouse.down = false);

if(/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    document.getElementById('mobile-controls').style.display = 'block';
    const bindTouch = (id, key) => {
        const zone = document.getElementById(id);
        const knob = zone.querySelector('.joystick-knob');
        let tid = null; let start = {x:0,y:0};
        zone.addEventListener('touchstart', e => {
            e.preventDefault();
            if(tid===null) { tid = e.changedTouches[0].identifier; start={x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY}; window.mobileInput[key].active=true; }
        }, {passive:false});
        zone.addEventListener('touchmove', e => {
            e.preventDefault();
            for(let t of e.changedTouches) {
                if(t.identifier === tid) {
                    const dx=t.clientX-start.x, dy=t.clientY-start.y;
                    const d=Math.min(40,Math.hypot(dx,dy)); const a=Math.atan2(dy,dx);
                    knob.style.transform=`translate(calc(-50% + ${Math.cos(a)*d}px), calc(-50% + ${Math.sin(a)*d}px))`;
                    window.mobileInput[key].x=dx/40; window.mobileInput[key].y=dy/40;
                }
            }
        }, {passive:false});
        const end = e => { for(let t of e.changedTouches) if(t.identifier===tid) { tid=null; window.mobileInput[key].active=false; knob.style.transform='translate(-50%,-50%)'; window.mobileInput[key].x=0; window.mobileInput[key].y=0; } };
        zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    }
    bindTouch('stick-left', 'move'); bindTouch('stick-right', 'aim');
    document.getElementById('mobile-dash-btn').addEventListener('touchstart', e=>{e.preventDefault(); window.mobileInput.dash=true;});
}

const startBtn = document.getElementById('start-btn');
if(startBtn) {
    startBtn.addEventListener('click', () => {
        window.AudioSys.init();
        document.getElementById('start-screen').classList.add('hidden');
        window.Game.startGame();
    });
}

const restartBtn = document.getElementById('restart-btn');
if(restartBtn) {
    restartBtn.addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        window.Game.loadData();
    });
}

// Nav tab switching (delegated)
document.querySelector('.menu-nav-container')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (btn && btn.dataset.tab && window.UI) {
        window.UI.switchTab(btn.dataset.tab);
    }
});

// Boot
if(window.Game) {
    window.Game.init();
    
    setTimeout(() => {
        if(window.UI) {
            window.UI.switchTab('play');
            window.UI.updateMenuUI();
        }
    }, 100);
}