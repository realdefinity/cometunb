window.audioEngine = {
    init() {
        if (!window.state.actx) {
            window.state.actx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (window.state.actx.state === 'suspended') {
            window.state.actx.resume();
        }
    },

    playStack(isPerfect) {
        this.init();
        const actx = window.state.actx;
        const score = window.state.score;
        const noteIndex = score % window.NOTES.length;
        const frequency = window.NOTES[noteIndex];

        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);

        if (isPerfect) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, actx.currentTime);
            gain.gain.setValueAtTime(0, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, actx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
            osc.start();
            osc.stop(actx.currentTime + 0.5);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(frequency * 0.5, actx.currentTime);
            gain.gain.setValueAtTime(0, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, actx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.2);
            osc.start();
            osc.stop(actx.currentTime + 0.2);
        }
    },

    playEffect(type) {
        this.init();
        const actx = window.state.actx;
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);

        if (type === 'grow') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, actx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, actx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.3);
            osc.start();
            osc.stop(actx.currentTime + 0.3);
        } else if (type === 'fail') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, actx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, actx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
            osc.start();
            osc.stop(actx.currentTime + 0.5);
        }
    }
};
