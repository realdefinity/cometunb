window.CONFIG = {
    size: 4,
    animSpeed: 300, // Slower, fluid movement for that "liquid" feel
    gap: 12,
    maxFlux: 100,
    costs: { undo: 25, destroy: 60 }
};

window.sleep = (ms) => new Promise(r => setTimeout(r, ms));
window.randomID = () => Math.random().toString(36).substr(2, 9);