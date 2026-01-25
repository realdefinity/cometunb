// Init Inputs
document.getElementById('main-btn').addEventListener('mousedown', clickAction);
document.getElementById('main-btn').addEventListener('touchstart', clickAction);

// --- 3D TILT LOGIC (New) ---
const mainBtn = document.getElementById('main-btn');
const btnContainer = document.querySelector('.big-button-container');

// Only add tilt on non-mobile devices to save battery/performance
if (window.matchMedia("(hover: hover)").matches) {
    btnContainer.addEventListener('mousemove', (e) => {
        const rect = btnContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate center
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Get values from -1 to 1
        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;
        
        // Rotate (Max 15 degrees)
        const rotateX = percentY * -15; 
        const rotateY = percentX * 15;

        mainBtn.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    btnContainer.addEventListener('mouseleave', () => {
        // Reset position smoothly
        mainBtn.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    });
}

// Start Game
loadLocal();
renderShop();
requestAnimationFrame(gameLoop);