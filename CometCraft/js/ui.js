const inventory = document.getElementById('inventory');
const searchInput = document.getElementById('search');
const counter = document.getElementById('counter');
const modal = document.getElementById('modal');

window.renderInventory = () => {
    inventory.innerHTML = '';
    const query = searchInput.value.toLowerCase();
    let items = [...window.state.discovered];

    if (window.state.sortMode === 'az') items.sort((a, b) => a.name.localeCompare(b.name));
    else items.sort((a, b) => b.date - a.date);

    items.forEach((item, index) => {
        if (item.name.toLowerCase().includes(query)) {
            const el = document.createElement('div');
            el.className = 'inv-item';
            el.style.animationDelay = `${index * 0.02}s`;
            el.innerHTML = `<span class="emoji">${item.icon}</span> <span class="name">${item.name}</span>`;

            el.onmousedown = (e) => {
                if (e.button !== 0) return;
                const rect = canvas.getBoundingClientRect();
                window.spawn(item.name, item.icon, rect.width / 2 + (Math.random() * 40 - 20), rect.height / 2 + (Math.random() * 40 - 20), true);
            };

            inventory.appendChild(el);
        }
    });
};

window.setSort = (mode) => {
    window.state.sortMode = mode;
    document.getElementById('sortAz').classList.toggle('active', mode === 'az');
    document.getElementById('sortTime').classList.toggle('active', mode === 'time');
    renderInventory();
};

window.updateCounter = () => {
    counter.innerText = `${window.state.discovered.length} Elements`;
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

// Event Listeners
searchInput.addEventListener('input', window.renderInventory);