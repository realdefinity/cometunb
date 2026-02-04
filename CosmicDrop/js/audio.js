window.AudioSys = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    
    play(idx, type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const freq = 180 + (idx * 50);
        
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        if (type === 'drop') {
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, this.ctx.currentTime + 0.15);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } else if (type === 'merge') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(freq + 250, this.ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        }
    }
};