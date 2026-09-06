/**
 * Futuristic Web Audio API sound synthesizer
 * Zero external audio dependencies, instant playback, zero network latency.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Load mute preference if available
    try {
      const stored = localStorage.getItem('cyber_clash_muted');
      if (stored !== null) {
        this.isMuted = stored === 'true';
      }
    } catch {
      // ignore
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('cyber_clash_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  /**
   * Holographic card deal / slide sound
   */
  public playDeal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Card select / tap sound
   */
  public playCardSelect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Card snap / lock into slot
   */
  public playCardDrop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Card flip 3D swoosh
   */
  public playCardFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Suspense charging drone before revealing lane
   */
  public playSuspenseCharge(durationSec = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + durationSec);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(180, now);
    osc2.frequency.exponentialRampToValueAtTime(560, now + durationSec);

    // Filter to soften the sawtooth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + durationSec);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.12, now + durationSec * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
  }

  /**
   * Laser clash / impact explosion when cards are revealed and clash
   */
  public playClash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub bass punch
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.3);

    // Laser zap
    const laserOsc = this.ctx.createOscillator();
    const laserGain = this.ctx.createGain();
    laserOsc.type = 'sawtooth';
    laserOsc.frequency.setValueAtTime(1200, now);
    laserOsc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    laserGain.gain.setValueAtTime(0.15, now);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    laserOsc.connect(laserGain);
    laserGain.connect(this.ctx.destination);
    laserOsc.start(now);
    laserOsc.stop(now + 0.22);
  }

  /**
   * Lane win chime (Cyber triumphant triad)
   */
  public playLaneWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  /**
   * Lane tie sound (glitchy dual tone)
   */
  public playLaneTie() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.setValueAtTime(320, now + 0.08);
    osc.frequency.setValueAtTime(360, now + 0.16);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Match victory fanfare
   */
  public playMatchVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, t: 0, d: 0.12 },
      { f: 659.25, t: 0.12, d: 0.12 },
      { f: 783.99, t: 0.24, d: 0.15 },
      { f: 1046.50, t: 0.40, d: 0.45 },
    ];

    fanfare.forEach(item => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + item.t;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.f, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + item.d + 0.05);
    });
  }

  /**
   * Match defeat synth fall
   */
  public playMatchDefeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(100, now + 0.6);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  /**
   * Tie-breaker emergency alarm sound
   */
  public playTieBreakerAlarm() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + i * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, st);
      osc.frequency.exponentialRampToValueAtTime(450, st + 0.12);

      gain.gain.setValueAtTime(0.1, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.13);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.15);
    }
  }
  /**
   * Button click sound
   */
  public playButton() {
    this.playCardSelect();
  }

  /**
   * Card place sound
   */
  public playPlace() {
    this.playCardDrop();
  }

  /**
   * Lane reveal sound
   */
  public playLaneReveal() {
    this.playCardFlip();
  }

  /**
   * Lane loss sound
   */
  public playLaneLoss() {
    this.playClash();
  }

  /**
   * Lane draw sound
   */
  public playLaneDraw() {
    this.playLaneTie();
  }
}

export const sound = new SoundEngine();
