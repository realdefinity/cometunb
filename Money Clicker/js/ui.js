const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Od", "Nd", "Vg"];

function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toLocaleString();
    let tier = Math.floor(Math.log10(num) / 3);
    if (tier < suffixStandard.length) {
        let suffix = suffixStandard[tier];
        let scale = Math.pow(10, tier * 3);
        return (num / scale).toFixed(2) + suffix;
    }
    return num.toExponential(2).replace('+', '');
}

function updateUI(rate) {
    // 1. Title & Main Display
    document.title = `$${formatNumber(game.money)} - THE MINT`;
    document.getElementById('ui-money').innerText = formatNumber(game.money);
    
    // Pulse effect on money change if rate is high
    const moneyEl = document.getElementById('balance-el');
    if (rate > game.money * 0.1) {
        moneyEl.classList.add('pulse');
        setTimeout(() => moneyEl.classList.remove('pulse'), 100);
    }

    // 2. Stats
    document.getElementById('ui-rate').innerText = formatNumber(rate);
    document.getElementById('ui-influence').innerText = formatNumber(game.influence);
    document.getElementById('ui-bonus').innerText = formatNumber(game.influence * 10);

    // 3. Influence Progress Bar
    let costForNext = Math.pow(game.influence + 1, 2) * 1000000;
    let costForCurrent = Math.pow(game.influence, 2) * 1000000;
    let progress = 0;
    
    if (game.lifetimeEarnings >= costForNext) {
        progress = 100;
    } else {
        let range = costForNext - costForCurrent;
        let currentInLevel = game.lifetimeEarnings - costForCurrent;
        progress = Math.max(0, Math.min(100, (currentInLevel / range) * 100));
    }
    document.getElementById('influence-bar').style.width = progress + "%";
    document.getElementById('next-influence-cost').innerText = formatNumber(costForNext);
    
    // 4. Rank Name
    let rankIndex = Math.min(ranks.length - 1, Math.floor(game.influence / 5));
    document.getElementById('rank-name').innerText = ranks[rankIndex];

    // 5. Prestige Button State
    let btn = document.getElementById('btn-open-prestige');
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    if (potential > game.influence) btn.classList.add('ready'); else btn.classList.remove('ready');

    // 6. Hype Bar
    document.getElementById('hype-bar').style.width = hype + '%';
    document.getElementById('hype-text').innerText = Math.floor(hype) + '%';
    
    // 7. Shop Updates (Efficient)
    let influenceMult = 1 + (game.influence * 0.10);
    upgrades.forEach((u, i) => {
        let el = document.getElementById(`upg-${i}`);
        if (!el) return;
        
        let max = getMaxBuy(i);
        let amt = (buyMode === 'MAX') ? max : buyMode;
        if(buyMode === 'MAX' && amt === 0) amt = 1;

        let cost = getCost(i, amt);
        let affordable = game.money >= cost;
        
        // Update Text
        el.querySelector('.cost-text').innerText = "$" + formatNumber(cost);
        el.querySelector('.count-badge').innerText = game.counts[i];
        
        // Update Name (Handling Max Mode)
        el.querySelector('h4').innerText = u.name + (buyMode === 'MAX' && max > 0 ? ` +${max}` : (buyMode !== 1 && buyMode !== 'MAX' ? ` +${amt}` : ''));
        
        // Update Rate
        let boostRate = u.baseRate * influenceMult * (maniaMode ? 3 : 1);
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        // Classes
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) {
            el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        } else if (game.counts[i] === 0 && !affordable) {
            el.classList.add('locked');
        }
    });
}

function renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = '';
    upgrades.forEach((u, i) => {
        let div = document.createElement('div');
        div.className = 'upgrade';
        div.id = `upg-${i}`;
        div.onclick = () => buy(i);
        // Staggered animation for list loading
        div.style.animation = `slide-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.03}s forwards`;
        div.style.opacity = '0'; // Start hidden for animation
        
        // NEW HTML STRUCTURE FOR CSS ALIGNMENT
        div.innerHTML = `
            <div class="upg-info">
                <h4>${u.name}</h4>
                <p><span class="rate-boost">+$0/s</span> <span>(Base: $${formatNumber(u.baseRate)})</span></p>
            </div>
            <div class="upg-cost">
                <div class="cost-text">...</div>
                <div class="count-badge">0</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function setBuyMode(mode, btn) {
    buyMode = mode;
    document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active', 'active-max'));
    btn.classList.add(mode === 'MAX' ? 'active-max' : 'active');
    updateUI(0);
}

// Modal Logic
function openModal(id, content, btnText, isImport) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    // Small timeout to allow display:flex to apply before adding opacity class
    setTimeout(() => modal.classList.add('open'), 10);
    
    let txt = document.getElementById('save-data-input'); 
    if(txt) txt.value = content;
    
    let btn = document.getElementById('modal-action-btn'); 
    if(btn) {
        btn.innerText = btnText;
        btn.onclick = isImport ? async () => {
            let val = txt.value.trim();
            // Dev Backdoor
            if (await checkSecureCode(val)) {
                game.money += 1e55; game.lifetimeEarnings += 1e55; 
                closeModal(id); playSound('crit'); alert("DEV ACCESS GRANTED"); return;
            }
            try { 
                game = JSON.parse(atob(val)); 
                closeModal(id); 
                renderShop(); 
                playSound('buy'); 
            } catch(e) { playSound('error'); alert("CORRUPT SAVE DATA"); }
        } : () => { 
            txt.select(); document.execCommand('copy'); 
            btn.innerText = "COPIED TO CLIPBOARD"; 
        };
    }
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openExport() { saveLocal(); openModal('save-modal', btoa(JSON.stringify(game)), "COPY SAVE CODE"); }
function openImport() { openModal('save-modal', "", "LOAD SAVE CODE", true); }
function hardReset() { if(confirm("PERFORM HARD RESET? THIS CANNOT BE UNDONE.")) { localStorage.removeItem('mintV6_save'); location.reload(); } }