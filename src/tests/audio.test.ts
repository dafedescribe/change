import { describe, it, expect, beforeEach } from 'vitest';
import { AudioSystem } from '../systems/AudioSystem';

describe('AudioSystem', () => {
  let audio: AudioSystem;

  beforeEach(() => {
    audio = new AudioSystem();
  });

  it('initializes with default sound enabled', () => {
    expect(audio.isSoundEnabled()).toBe(true);
  });

  it('toggles sound on and off', () => {
    expect(audio.toggleSound()).toBe(false);
    expect(audio.isSoundEnabled()).toBe(false);
    expect(audio.toggleSound()).toBe(true);
    expect(audio.isSoundEnabled()).toBe(true);
  });

  it('safely handles audio triggers in headless test environment without throwing', () => {
    expect(() => {
      audio.playCash();
      audio.playChime();
      audio.playHold();
      audio.playMarry();
      audio.playBreak();
      audio.playError();
      audio.playStopArrival();
      audio.playVictory();
      audio.playClick();
    }).not.toThrow();
  });
});
