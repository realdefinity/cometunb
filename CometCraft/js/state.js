// Global State Management
window.state = {
    starterItems: [
        { name: "Water", icon: "💧", date: 0 },
        { name: "Fire", icon: "🔥", date: 1 },
        { name: "Earth", icon: "🌍", date: 2 },
        { name: "Wind", icon: "💨", date: 3 }
    ],
    discovered: [],
    sortMode: 'az',
    
    // Canvas Physics
    dragItem: null,
    dragOffset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 },
    mergeTarget: null,
    dragFrame: null
};

// Initialize or Load
window.state.discovered = JSON.parse(localStorage.getItem('ic_cosmos_items')) || [...window.state.starterItems];

window.saveGame = () => {
    localStorage.setItem('ic_cosmos_items', JSON.stringify(window.state.discovered));
    window.updateCounter();
};

window.resetGame = () => {
    if(confirm("Clear all data?")) {
        localStorage.removeItem('ic_cosmos_items');
        location.reload();
    }
};