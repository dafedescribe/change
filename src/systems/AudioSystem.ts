import { persistence } from './PersistenceSystem';

export class AudioSystem {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    this.soundEnabled = persistence.loadSettings().soundEnabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    persistence.saveSettings({ soundEnabled: enabled });
  }

  toggleSound(): boolean {
    this.setSoundEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
        } catch {
          return null;
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', gainVal: number = 0.15): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio autoplay policy or device restrictions
    }
  }

  /** Cash tender / note selection sound */
  playCash(): void {
    this.playTone(400, 0.08, 'triangle', 0.12);
    setTimeout(() => this.playTone(600, 0.08, 'triangle', 0.1), 40);
  }

  /** Successful change payment chime (sweet 2-tone) */
  playChime(): void {
    this.playTone(523.25, 0.15, 'sine', 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.25, 'sine', 0.2), 120); // E5
  }

  /** Hold change obligation sound (soft ascending tone) */
  playHold(): void {
    this.playTone(329.63, 0.12, 'sine', 0.15); // E4
    setTimeout(() => this.playTone(440.0, 0.18, 'sine', 0.15), 90); // A4
  }

  /** Marry passengers sound (resonant triad) */
  playMarry(): void {
    this.playTone(523.25, 0.2, 'triangle', 0.15);
    setTimeout(() => this.playTone(659.25, 0.2, 'triangle', 0.15), 80);
    setTimeout(() => this.playTone(783.99, 0.3, 'triangle', 0.18), 160);
  }

  /** Break note sound (descending 3-tone split cascade) */
  playBreak(): void {
    this.playTone(783.99, 0.1, 'square', 0.08);
    setTimeout(() => this.playTone(659.25, 0.1, 'square', 0.08), 70);
    setTimeout(() => this.playTone(523.25, 0.15, 'square', 0.08), 140);
  }

  /** Invalid action buzzer / warning */
  playError(): void {
    this.playTone(180, 0.18, 'sawtooth', 0.15);
  }

  /** Stop arrival / bus horn */
  playStopArrival(): void {
    this.playTone(392.0, 0.12, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(440.0, 0.2, 'sawtooth', 0.14), 100);
  }

  /** Route completion fanfare */
  playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.25, 'triangle', 0.2), idx * 110);
    });
  }

  /** Subtle UI button click */
  playClick(): void {
    this.playTone(800, 0.04, 'sine', 0.05);
  }
}

export const audioSystem = new AudioSystem();
