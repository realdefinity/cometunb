const API = "https://en.wikipedia.org/w/api.php";
const themes = ["Classic", "Midnight", "Paper", "Forest", "Cyberpunk", "Terminal"];

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