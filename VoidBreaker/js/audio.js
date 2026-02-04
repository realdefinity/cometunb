window.AudioSys = {
    ctx: null,
    init: function() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if(!this.ctx) this.ctx = new AudioContext();
        if(this.ctx.state === 'suspended') this.ctx.resume();
    },
    play: function(type, freq, dur, vol=0.1, slideTo=null) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if(slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + dur);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + dur);
    },
    shoot: function(type) {
        if(type === 'shotgun') { this.play('sawtooth', 100, 0.3, 0.15, 50); this.play('square', 80, 0.1, 0.1); }
        else if (type === 'sniper') { this.play('square', 800, 0.4, 0.08, 100); this.play('sawtooth', 200, 0.5, 0.15); }
        else if (type === 'smg') { this.play('triangle', 300, 0.05, 0.04, 100); }
        else { this.play('square', 150, 0.1, 0.06, 50); }
    },
    hit: function() { this.play('sine', 400, 0.1, 0.05); },
    xp: function(pitch) { this.play('sine', 800 + pitch, 0.08, 0.03); },
    buy: function() { this.play('sine', 1200, 0.2, 0.1); this.play('square', 600, 0.2, 0.1); },
    levelUp: function() { [440, 554, 659, 880].forEach((f,i) => setTimeout(() => this.play('square', f, 0.4, 0.08), i*100)); },
    bossWarn: function() { this.play('sawtooth', 100, 1.0, 0.2, 50); }
};