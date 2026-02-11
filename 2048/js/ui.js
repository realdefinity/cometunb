window.ui = {
    selectSize: (n) => {
        document.querySelectorAll('.size-opt').forEach(b => b.classList.remove('selected'));
        event.target.classList.add('selected');
        window.CONFIG.selectedSize = n;
    },
    toggleMenu: () => {
        const m = document.getElementById('menu');
        m.classList.toggle('hidden');
    },
    updateStats: (score, best, flux) => {
        document.getElementById('score').innerText = score;
        document.getElementById('best').innerText = best;
        
        // Flux Bar
        const pct = Math.min(100, (flux / window.CONFIG.maxFlux) * 100);
        document.getElementById('flux-bar').style.width = `${pct}%`;
        document.getElementById('flux-val').innerText = Math.floor(flux);

        // Button States
        document.getElementById('btn-undo').disabled = flux < window.CONFIG.costs.undo;
        document.getElementById('btn-destroy').disabled = flux < window.CONFIG.costs.destroy;
    },
    shakeBoard: () => {
        const b = document.getElementById('game-board');
        b.classList.remove('shake');
        void b.offsetWidth;
        b.classList.add('shake');
    },
    spawnFloatText: (text, context) => {
        const el = document.createElement('div');
        el.className = 'float-text';
        el.innerText = text;
        
        if(context === 'center') {
            el.style.left = '50%'; el.style.top = '50%';
            el.style.transform = 'translate(-50%, -50%)';
            document.getElementById('app').appendChild(el);
        } else if (document.getElementById(context)) {
            const rect = document.getElementById(context).getBoundingClientRect();
            el.style.left = (rect.left + rect.width/2) + 'px';
            el.style.top = (rect.top - 20) + 'px';
            document.body.appendChild(el);
        }
        
        setTimeout(() => el.remove(), 1000);
    }
};