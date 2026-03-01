window.uiHelpers = {
    updateScoreUI(score) {
        const { scoreVal, scoreEl } = window.ui;
        scoreVal.innerText = String(score);
        scoreEl.classList.remove('bump');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('bump');
    },

    triggerFlash() {
        const f = window.ui.flash;
        f.style.opacity = '0.15';
        setTimeout(() => {
            f.style.opacity = '0';
        }, 50);
    },

    showPopup(text, y) {
        const el = document.createElement('div');
        el.className = 'float-txt';
        el.innerText = text;
        const screenY = y + window.state.cameraY;
        el.style.top = `${screenY - 50}px`;
        window.ui.popups.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }
};
