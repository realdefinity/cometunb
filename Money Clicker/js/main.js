// =========================================
// MAIN ENTRY POINT
// =========================================

// 1. Bind Click Events (Touch & Mouse)
const mainBtn = document.getElementById('main-btn');

if (mainBtn) {
    // Prevent default touch behaviors (zooming/scrolling) on the button
    mainBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Critical for fast tapping
        clickAction(e);
    }, { passive: false });

    mainBtn.addEventListener('mousedown', clickAction);
} else {
    console.error("Critical Error: Main Button ID 'main-btn' not found in DOM.");
}

// 2. Initialize Game System
function init() {
    console.log("System Initializing...");
    
    // Load Data
    loadLocal();
    
    // Render Static UI Elements
    renderShop();
    
    // Start Audio Context (suspended until interaction)
    if(window.AudioContext || window.webkitAudioContext) {
        // audioCtx is defined in js/audio.js, usually initialized globally
        // checking suspension state handled in clickAction
    }

    // Begin Loop
    requestAnimationFrame(gameLoop);
    
    console.log("System Ready.");
}

// 3. Boot
window.onload = init;