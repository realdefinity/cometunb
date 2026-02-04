// Boot Sequence
(function() {
    console.log("Cosmic Drop: Booting...");
    if (window.Game && window.Matter) {
        window.Game.init();
    } else {
        console.error("Critical Error: Engine or Game module missing.");
    }
})();