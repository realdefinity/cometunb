window.audioEngine = {
    ctx: null,
    osc: null,
    gain: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    startDraw() {
        this.init();
        this.stopDraw(true);

        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();

        this.osc.type = 'triangle';
        this.osc.frequency.value = 150;
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);

        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);

        this.osc.start();
    },

    updatePitch(progressRatio) {
        if (!this.osc) return;
        const targetFreq = 150 + (progressRatio * 450);
        this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    },

    stopDraw(instant = false) {
        if (!this.gain) return;

        const now = this.ctx ? this.ctx.currentTime : 0;
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.exponentialRampToValueAtTime(0.001, now + (instant ? 0.01 : 0.2));

        const oldOsc = this.osc;
        setTimeout(() => {
            if (oldOsc) {
                oldOsc.stop();
                oldOsc.disconnect();
            }
        }, instant ? 20 : 250);

        this.osc = null;
        this.gain = null;
    },

    playWin(score) {
        this.init();
        const t = this.ctx.currentTime;

        const notes = score > 95 ? [523.25, 659.25, 783.99, 1046.5]
            : score > 80 ? [523.25, 659.25, 783.99]
                : [261.63, 311.13];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = score > 90 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t + i * 0.05);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + i * 0.05 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.5);
            osc.stop(t + i * 0.05 + 0.6);
        });
    }
};
