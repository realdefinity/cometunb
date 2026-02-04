// Initialize Game
(function() {
    console.log("Comet Craft: Initializing...");
    
    // Ensure state is loaded
    if (!window.state || !window.recipes) {
        console.error("Critical Error: Game State or Recipes missing.");
        return;
    }

    // Initial Render
    window.renderInventory();
    window.updateCounter();

    // Signal Loader to fade out
    if (document.body) {
        document.body.classList.add('loaded');
    }
})();