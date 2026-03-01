(function() {
    console.log('Comet Craft: Initializing...');

    if (!window.state || !window.recipes) {
        console.error('Critical Error: Game State or Recipes missing.');
        return;
    }

    window.renderInventory();
    window.updateCounter();

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeModal();
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            const search = document.getElementById('search');
            search?.focus();
        }
    });

    if (document.body) {
        document.body.classList.add('loaded');
    }
})();
