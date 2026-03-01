const inventory = document.getElementById('inventory');
const searchInput = document.getElementById('search');
const counter = document.getElementById('counter');
const modal = document.getElementById('modal');

window.renderInventory = () => {
    inventory.innerHTML = '';
    const query = searchInput.value.toLowerCase().trim();
    const items = [...window.state.discovered];

    if (window.state.sortMode === 'az') {
        items.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        items.sort((a, b) => b.date - a.date);
    }

    let rendered = 0;
    items.forEach(item => {
        if (!item.name.toLowerCase().includes(query)) return;

        const el = document.createElement('div');
        el.className = 'inv-item';
        el.style.animationDelay = `${rendered * 0.02}s`;
        el.innerHTML = `<span class="emoji">${item.icon}</span> <span class="name">${item.name}</span>`;

        el.onmousedown = (e) => {
            if (e.button !== 0) return;
            const canvas = document.getElementById('canvas');
            const rect = canvas.getBoundingClientRect();
            const x = rect.width / 2 + (Math.random() * 40 - 20);
            const y = rect.height / 2 + (Math.random() * 40 - 20);
            window.spawn(item.name, item.icon, x, y, true);
        };

        inventory.appendChild(el);
        rendered += 1;
    });
};

window.setSort = (mode) => {
    window.state.sortMode = mode;
    document.getElementById('sortAz').classList.toggle('active', mode === 'az');
    document.getElementById('sortTime').classList.toggle('active', mode === 'time');
    window.renderInventory();
};

window.updateCounter = () => {
    const count = window.state.discovered.length;
    counter.innerText = `${count} Element${count === 1 ? '' : 's'}`;
};

window.showModal = (item) => {
    document.getElementById('dIcon').innerText = item.icon;
    document.getElementById('dName').innerText = item.name;
    modal.classList.add('open');
    window.explode(window.innerWidth / 2, window.innerHeight / 2, '#fbbf24', 80, 250);
};

window.closeModal = () => {
    modal.classList.remove('open');
};

searchInput.addEventListener('input', window.renderInventory);
