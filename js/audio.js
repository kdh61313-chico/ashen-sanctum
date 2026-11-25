// Synthesized SFX with Web Audio. No asset files.
export class Audio {
  constructor() { this.ctx = null; this.vol = 0.6; this.last = {}; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.vol;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startAmbience();
    } catch (e) { this.ctx = null; }
  }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }

  env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  noiseHit({ f = 800, q = 1, type = 'bandpass', dur = 0.2, vol = 0.4, f2 = null, delay = 0, pan = 0 }) {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); this.env(g, t, 0.005, vol, dur);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    s.connect(fl); fl.connect(g);
    if (p) { p.pan.value = pan; g.connect(p); p.connect(this.master); } else g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  tone({ f = 440, f2 = null, type = 'sine', dur = 0.2, vol = 0.2, a = 0.005, delay = 0, pan = 0 }) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); this.env(g, t, a, vol, dur);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.connect(g);
    if (p) { p.pan.value = pan; g.connect(p); p.connect(this.master); } else g.connect(this.master);
    o.start(t); o.stop(t + a + dur + 0.05);
  }

  // distance attenuation: d in meters, pan -1..1
  play(name, d = 0, pan = 0) {
    if (!this.ctx) return;
    const now = performance.now();
    if (this.last[name] && now - this.last[name] < 30) return;
    this.last[name] = now;
    const att = Math.max(0.08, 1 / (1 + d * 0.09));
    const v = (x) => x * att;
    const P = { pan: Math.max(-1, Math.min(1, pan)) };
    switch (name) {
      case 'gun': this.noiseHit({ f: 2600, f2: 600, q: 0.8, type: 'bandpass', dur: 0.09, vol: v(0.5), ...P }); this.tone({ f: 160, f2: 60, type: 'square', dur: 0.06, vol: v(0.12), ...P }); break;
      case 'rifle': this.noiseHit({ f: 1800, f2: 200, q: 0.6, dur: 0.22, vol: v(0.7), ...P }); this.tone({ f: 110, f2: 40, type: 'sine', dur: 0.2, vol: v(0.4), ...P }); break;
      case 'shotgun': this.noiseHit({ f: 900, f2: 120, q: 0.5, type: 'lowpass', dur: 0.3, vol: v(0.85), ...P }); this.tone({ f: 90, f2: 35, type: 'sine', dur: 0.25, vol: v(0.5), ...P }); break;
      case 'thump': this.tone({ f: 220, f2: 80, type: 'sine', dur: 0.14, vol: v(0.35), ...P }); this.noiseHit({ f: 500, q: 1, type: 'lowpass', dur: 0.1, vol: v(0.3), ...P }); break;
      case 'cannon': this.tone({ f: 140, f2: 50, type: 'sawtooth', dur: 0.3, vol: v(0.2), ...P }); this.noiseHit({ f: 1400, f2: 200, q: 0.6, dur: 0.3, vol: v(0.5), ...P }); break;
      case 'reload': this.noiseHit({ f: 3000, q: 8, dur: 0.05, vol: 0.18 }); this.noiseHit({ f: 2200, q: 8, dur: 0.06, vol: 0.18, delay: 0.25 }); this.tone({ f: 900, type: 'square', dur: 0.03, vol: 0.04, delay: 0.5 }); break;
      case 'swing': this.noiseHit({ f: 1800, f2: 400, q: 1.2, dur: 0.16, vol: v(0.35), ...P }); break;
      case 'heavySwing': this.noiseHit({ f: 900, f2: 200, q: 1, dur: 0.28, vol: v(0.45), ...P }); break;
      case 'hit': this.noiseHit({ f: 300, q: 0.8, type: 'lowpass', dur: 0.12, vol: v(0.6), ...P }); this.tone({ f: 140, f2: 60, type: 'triangle', dur: 0.12, vol: v(0.3), ...P }); break;
      case 'hitmark': this.tone({ f: 1400, type: 'square', dur: 0.04, vol: 0.06 }); break;
      case 'crit': this.tone({ f: 1900, f2: 2400, type: 'square', dur: 0.06, vol: 0.08 }); this.noiseHit({ f: 3000, q: 2, dur: 0.08, vol: 0.2 }); break;
      case 'fire': this.noiseHit({ f: 600, f2: 1400, q: 0.7, dur: 0.3, vol: v(0.35), ...P }); break;
      case 'boom': this.noiseHit({ f: 400, f2: 60, type: 'lowpass', q: 0.7, dur: 0.7, vol: v(0.9), ...P }); this.tone({ f: 80, f2: 30, type: 'sine', dur: 0.6, vol: v(0.5), ...P }); break;
      case 'bigboom': this.noiseHit({ f: 300, f2: 40, type: 'lowpass', q: 0.6, dur: 1.4, vol: v(1.1), ...P }); this.tone({ f: 60, f2: 25, type: 'sine', dur: 1.2, vol: v(0.8), ...P }); break;
      case 'arrow': this.noiseHit({ f: 2500, f2: 900, q: 3, dur: 0.12, vol: v(0.3), ...P }); this.tone({ f: 220, f2: 110, type: 'triangle', dur: 0.08, vol: v(0.15), ...P }); break;
      case 'zap': this.noiseHit({ f: 4000, q: 0.5, type: 'highpass', dur: 0.12, vol: v(0.3), ...P }); this.tone({ f: 900, f2: 200, type: 'sawtooth', dur: 0.1, vol: v(0.08), ...P }); break;
      case 'thunder': this.noiseHit({ f: 2000, f2: 100, q: 0.4, type: 'lowpass', dur: 0.9, vol: v(0.8), ...P }); break;
      case 'magic': this.tone({ f: 520, f2: 980, type: 'triangle', dur: 0.25, vol: v(0.12), ...P }); this.tone({ f: 780, f2: 1470, type: 'sine', dur: 0.25, vol: v(0.08), delay: 0.03, ...P }); break;
      case 'dark': this.tone({ f: 180, f2: 90, type: 'sawtooth', dur: 0.4, vol: v(0.1), ...P }); this.noiseHit({ f: 300, q: 4, dur: 0.4, vol: v(0.2), ...P }); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => this.tone({ f, type: 'sine', dur: 0.4, vol: v(0.08), delay: i * 0.05, ...P })); break;
      case 'shield': this.tone({ f: 300, f2: 600, type: 'triangle', dur: 0.35, vol: v(0.15), ...P }); this.tone({ f: 450, f2: 900, type: 'sine', dur: 0.35, vol: v(0.1), ...P }); break;
      case 'dash': this.noiseHit({ f: 500, f2: 2500, q: 0.8, dur: 0.3, vol: v(0.4), ...P }); break;
      case 'blink': this.tone({ f: 1200, f2: 200, type: 'sine', dur: 0.25, vol: v(0.15), ...P }); this.noiseHit({ f: 3000, q: 5, dur: 0.2, vol: v(0.15), ...P }); break;
      case 'jump': this.noiseHit({ f: 400, q: 1, type: 'lowpass', dur: 0.08, vol: 0.12 }); break;
      case 'land': this.noiseHit({ f: 200, q: 1, type: 'lowpass', dur: 0.12, vol: 0.2 }); break;
      case 'step': this.noiseHit({ f: 250 + Math.random() * 100, q: 1.2, type: 'lowpass', dur: 0.06, vol: v(0.1), ...P }); break;
      case 'ice': this.noiseHit({ f: 5000, q: 6, dur: 0.3, vol: v(0.25), ...P }); this.tone({ f: 2400, f2: 1800, type: 'sine', dur: 0.2, vol: v(0.05), ...P }); break;
      case 'poison': this.noiseHit({ f: 700, f2: 300, q: 6, dur: 0.35, vol: v(0.25), ...P }); break;
      case 'ult': this.tone({ f: 110, f2: 220, type: 'sawtooth', dur: 0.8, vol: v(0.18), ...P }); this.tone({ f: 165, f2: 330, type: 'sawtooth', dur: 0.8, vol: v(0.12), ...P }); this.noiseHit({ f: 800, f2: 3000, q: 1, dur: 0.8, vol: v(0.3), ...P }); break;
      case 'ultReady': [392, 523, 659].forEach((f, i) => this.tone({ f, type: 'triangle', dur: 0.3, vol: 0.1, delay: i * 0.08 })); break;
      case 'kill': this.tone({ f: 880, type: 'square', dur: 0.08, vol: 0.08 }); this.tone({ f: 1320, type: 'square', dur: 0.12, vol: 0.08, delay: 0.08 }); break;
      case 'death': this.tone({ f: 300, f2: 80, type: 'sawtooth', dur: 0.8, vol: 0.12 }); this.noiseHit({ f: 400, f2: 100, type: 'lowpass', dur: 0.8, vol: 0.3 }); break;
      case 'hurt': this.noiseHit({ f: 250, q: 0.7, type: 'lowpass', dur: 0.15, vol: 0.35 }); break;
      case 'bell': [196, 392, 588].forEach((f, i) => this.tone({ f, type: 'sine', dur: 2.2, vol: 0.12 / (i + 1), a: 0.01 })); this.tone({ f: 311, type: 'triangle', dur: 1.6, vol: 0.04 }); break;
      case 'win': [392, 494, 587, 784].forEach((f, i) => this.tone({ f, type: 'triangle', dur: 0.6, vol: 0.12, delay: i * 0.14 })); break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => this.tone({ f, type: 'triangle', dur: 0.7, vol: 0.1, delay: i * 0.18 })); break;
      case 'click': this.tone({ f: 660, type: 'triangle', dur: 0.05, vol: 0.06 }); break;
      case 'hover': this.tone({ f: 990, type: 'sine', dur: 0.03, vol: 0.025 }); break;
      case 'select': this.tone({ f: 220, f2: 440, type: 'triangle', dur: 0.25, vol: 0.1 }); this.noiseHit({ f: 1200, f2: 300, q: 2, dur: 0.3, vol: 0.12 }); break;
      case 'tick': this.tone({ f: 1100, type: 'sine', dur: 0.05, vol: 0.08 }); break;
      case 'deny': this.tone({ f: 160, type: 'square', dur: 0.08, vol: 0.05 }); break;
    }
  }

  startAmbience() {
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 0.4;
    const g = c.createGain(); g.gain.value = 0.05;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const lg = c.createGain(); lg.gain.value = 160;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    s.connect(f); f.connect(g); g.connect(this.master); s.start();
    // low drone
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 55;
    const og = c.createGain(); og.gain.value = 0.025;
    o.connect(og); og.connect(this.master); o.start();
  }
}
