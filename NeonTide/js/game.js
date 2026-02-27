const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => a + Math.random() * (b - a);

export class NeonTideGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    this.keys = new Set();
    this.pointer = null;

    this.reset();
  }

  reset() {
    this.running = false;
    this.score = 0;
    this.combo = 1;
    this.time = 0;
    this.best = Number(localStorage.getItem('neon-tide-best') || 0);

    this.player = {
      x: this.width * 0.5,
      y: this.height * 0.55,
      r: 14,
      vx: 0,
      vy: 0,
      dashCd: 1,
      dashTimer: 0,
      hp: 100,
      hitFlash: 0
    };

    this.flowField = Array.from({ length: 40 }, (_, i) => ({
      x: rand(0, this.width),
      y: rand(0, this.height),
      r: rand(60, 240),
      speed: rand(0.25, 1.2),
      phase: rand(0, Math.PI * 2),
      hue: 180 + i * 2
    }));

    this.orbs = [];
    this.shards = [];
    this.spawnTimers = { orb: 0.3, shard: 0.6 };
    this.comboTimer = 4;
  }

  resize(w, h, dpr) {
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.reset();
    this.running = true;
  }

  end() {
    this.running = false;
    this.best = Math.max(this.best, Math.floor(this.score));
    localStorage.setItem('neon-tide-best', String(this.best));
    return {
      score: Math.floor(this.score),
      best: this.best,
      time: this.time.toFixed(1)
    };
  }

  setKey(key, down) {
    if (down) this.keys.add(key);
    else this.keys.delete(key);
  }

  update(dt) {
    if (!this.running) {
      this.render();
      return null;
    }

    this.time += dt;
    const p = this.player;
    p.hitFlash = Math.max(0, p.hitFlash - dt * 3);

    this.spawnTimers.orb -= dt;
    this.spawnTimers.shard -= dt;

    if (this.spawnTimers.orb <= 0) {
      this.spawnOrb();
      this.spawnTimers.orb = rand(0.4, 0.8) / Math.min(2.4, 1 + this.time * 0.04);
    }
    if (this.spawnTimers.shard <= 0) {
      this.spawnShard();
      this.spawnTimers.shard = rand(0.5, 0.92) / Math.min(2.7, 1 + this.time * 0.045);
    }

    let ax = 0;
    let ay = 0;
    if (this.keys.has('arrowup') || this.keys.has('w')) ay -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) ay += 1;
    if (this.keys.has('arrowleft') || this.keys.has('a')) ax -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) ax += 1;
    if (this.pointer) {
      ax += this.pointer.x - p.x;
      ay += this.pointer.y - p.y;
    }

    const mag = Math.hypot(ax, ay) || 1;
    ax /= mag;
    ay /= mag;

    const accel = p.dashTimer > 0 ? 1650 : 980;
    p.vx += ax * accel * dt;
    p.vy += ay * accel * dt;

    const drag = p.dashTimer > 0 ? 0.985 : 0.93;
    p.vx *= drag;
    p.vy *= drag;

    if (this.keys.has(' ') && p.dashCd >= 1) {
      p.dashCd = 0;
      p.dashTimer = 0.18;
      p.vx += ax * 520;
      p.vy += ay * 520;
    }

    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.dashCd = clamp(p.dashCd + dt * 0.45, 0, 1);

    const flowX = Math.sin(this.time * 1.3 + p.y * 0.009) * 60;
    const flowY = Math.cos(this.time * 1.1 + p.x * 0.007) * 40;

    p.x += (p.vx + flowX) * dt;
    p.y += (p.vy + flowY) * dt;

    p.x = clamp(p.x, p.r, this.width - p.r);
    p.y = clamp(p.y, p.r, this.height - p.r);

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = Math.max(1, this.combo - dt * 0.7);

    this.updateOrbs(dt);
    this.updateShards(dt);

    this.score += dt * (6 + this.combo * 2.5);

    if (p.hp <= 0) return this.end();

    this.render();
    return null;
  }

  updateOrbs(dt) {
    const p = this.player;
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i];
      o.t += dt;
      o.y += o.vy * dt;
      o.x += Math.sin(o.t * o.waveSpeed + o.seed) * o.waveAmt * dt;

      if (o.y > this.height + 40) {
        this.orbs.splice(i, 1);
        this.combo = Math.max(1, this.combo - 0.55);
        continue;
      }

      if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + p.r + 1) {
        this.orbs.splice(i, 1);
        this.combo = clamp(this.combo + 0.16, 1, 5);
        this.comboTimer = 4;
        this.score += 65 * this.combo;
        p.hp = clamp(p.hp + 4, 0, 100);
      }
    }
  }

  updateShards(dt) {
    const p = this.player;
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.t += dt;
      s.y += s.vy * dt;
      s.x += Math.cos(s.t * s.curve + s.seed) * 130 * dt;
      s.rot += s.rotSpd * dt;

      if (s.y > this.height + 60 || s.x < -80 || s.x > this.width + 80) {
        this.shards.splice(i, 1);
        continue;
      }

      if (Math.hypot(s.x - p.x, s.y - p.y) < p.r + s.r) {
        if (p.dashTimer > 0) {
          this.shards.splice(i, 1);
          this.score += 40;
          continue;
        }
        this.shards.splice(i, 1);
        p.hp -= 18;
        p.hitFlash = 1;
        this.combo = Math.max(1, this.combo - 0.75);
      }
    }
  }

  spawnOrb() {
    this.orbs.push({
      x: rand(50, this.width - 50),
      y: -20,
      r: rand(6, 12),
      vy: rand(80, 160) + this.time * 1.7,
      t: 0,
      waveAmt: rand(14, 44),
      waveSpeed: rand(1.4, 2.9),
      seed: rand(0, Math.PI * 2)
    });
  }

  spawnShard() {
    this.shards.push({
      x: rand(30, this.width - 30),
      y: -35,
      r: rand(12, 20),
      vy: rand(130, 220) + this.time * 2.2,
      t: 0,
      curve: rand(0.8, 2.1),
      seed: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2),
      rotSpd: rand(-6, 6)
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const grd = ctx.createRadialGradient(this.width * 0.5, this.height * 0.5, 80, this.width * 0.5, this.height * 0.6, this.height);
    grd.addColorStop(0, 'rgba(34, 78, 154, 0.18)');
    grd.addColorStop(1, 'rgba(2, 7, 20, 0.04)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const flow of this.flowField) {
      const pulse = 0.55 + 0.45 * Math.sin(this.time * flow.speed + flow.phase);
      ctx.beginPath();
      ctx.arc(flow.x, flow.y, flow.r * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${flow.hue + Math.sin(this.time) * 12}, 98%, 66%, 0.06)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const orb of this.orbs) {
      const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * 3);
      glow.addColorStop(0, 'rgba(130, 255, 255, 0.95)');
      glow.addColorStop(1, 'rgba(130, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c9ffff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const shard of this.shards) {
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(shard.rot);
      ctx.fillStyle = 'rgba(255, 124, 187, 0.82)';
      ctx.shadowBlur = 18;
      ctx.shadowColor = 'rgba(255, 130, 197, 0.65)';
      ctx.beginPath();
      ctx.moveTo(0, -shard.r);
      ctx.lineTo(shard.r * 0.66, shard.r);
      ctx.lineTo(-shard.r * 0.66, shard.r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.atan2(p.vy, p.vx);
    ctx.rotate(angle + Math.PI * 0.5);
    const pulse = 1 + Math.sin(this.time * 12) * 0.05;
    ctx.scale(pulse, pulse);

    ctx.fillStyle = p.hitFlash > 0 ? '#ff9fc8' : '#baf8ff';
    ctx.shadowBlur = p.dashTimer > 0 ? 34 : 20;
    ctx.shadowColor = p.dashTimer > 0 ? 'rgba(161, 248, 255, 0.98)' : 'rgba(161, 248, 255, 0.6)';

    ctx.beginPath();
    ctx.moveTo(0, -p.r * 1.2);
    ctx.quadraticCurveTo(p.r * 0.95, 0, 0, p.r * 1.15);
    ctx.quadraticCurveTo(-p.r * 0.95, 0, 0, -p.r * 1.2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = 'rgba(189, 255, 255, 0.14)';
    ctx.fillRect(0, this.height - 14, this.width * (p.hp / 100), 14);
    ctx.strokeStyle = 'rgba(220, 250, 255, 0.38)';
    ctx.strokeRect(0, this.height - 14, this.width, 14);
  }
}
