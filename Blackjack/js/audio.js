function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (soundMuted || !audioCtx) return;
  const now = audioCtx.currentTime;
  const tone = (freq, dur, gainVal, wave = 'sine', start = 0) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, now + start);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(gainVal, now + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now + start);
    o.stop(now + start + dur);
  };
  if (type === 'chip') { tone(1200, 0.12, 0.22, 'sine'); tone(800, 0.1, 0.15, 'triangle', 0.02); }
  else if (type === 'card') { tone(420, 0.1, 0.14, 'triangle'); tone(120, 0.14, 0.05, 'sawtooth'); }
  else if (type === 'win') { tone(523.25, 0.9, 0.09, 'sine'); tone(659.25, 0.9, 0.07, 'sine', 0.06); tone(783.99, 0.9, 0.05, 'sine', 0.12); }
  else if (type === 'bust') { tone(140, 0.26, 0.16, 'sawtooth'); tone(90, 0.34, 0.09, 'triangle', 0.04); }
}
