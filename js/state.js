const API = "https://en.wikipedia.org/w/api.php";

// Updated list with all 36 themes
const themes = [
    "Classic", "Midnight", "Paper", "Forest", "Cyberpunk", "Terminal",
    "Amoled", "Nord", "Dracula", "Synthwave", "Matrix", "Slate",
    "Obsidian", "Monokai", "Mint", "Lavender", "Cherry", "Sepia",
    "Cloud", "Lemonade", "Bubblegum", "Ocean", "Sunset", "Coffee",
    "Neptune", "Mars", "Glacier", "Royal", "Toxic", "Coral",
    "Gold", "Blueprint", "Halloween", "Winter", "Vintage", "Candy", "Nightshade"
];

let state = {
    mode: 'standard',
    start: null,
    target: null, 
    targetDesc: "",
    gauntletIndex: 0,
    history: [],
    clicks: 0,
    startTime: 0,
    timer: null,
    penalties: 0,
    checkpoint: null,
    checkpointIndex: -1,
    sdTime: 30, 
    isPlaying: false
};