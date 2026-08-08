import { describe, expect, it } from 'vitest';
import { Clock } from '../src/engine/time/Clock.js';

describe('Clock', () => {
  it('yields nothing on its first frame, having no previous timestamp', () => {
    const clock = new Clock();

    expect(clock.advance(1000)).toBe(0);
    expect(clock.now()).toBe(0);
  });

  it('advances by the real time elapsed between frames', () => {
    const clock = new Clock();
    clock.advance(1000);

    expect(clock.advance(1016)).toBe(16);
    expect(clock.advance(1032)).toBe(16);
    expect(clock.now()).toBe(32);
    expect(clock.dt()).toBe(16);
  });

  it('caps a huge step, so a backgrounded tab does not teleport the world', () => {
    const clock = new Clock();
    clock.advance(1000);

    // Five seconds of a hidden tab, handed over in one frame.
    expect(clock.advance(6000)).toBe(Clock.MAX_STEP);
  });

  it('never runs backwards on a timestamp that does', () => {
    const clock = new Clock();
    clock.advance(1000);

    expect(clock.advance(900)).toBe(0);
    expect(clock.now()).toBe(0);
  });

  describe('pause', () => {
    it('freezes game time while real time keeps running', () => {
      const clock = new Clock();
      clock.advance(1000);
      clock.advance(1016);

      clock.pause();
      expect(clock.advance(1100)).toBe(0);
      expect(clock.advance(2000)).toBe(0);
      expect(clock.now()).toBe(16);
      expect(clock.isPaused()).toBe(true);
    });

    it('resumes without spending the time that passed while paused', () => {
      const clock = new Clock();
      clock.advance(1000);
      clock.pause();
      clock.advance(5000);

      clock.resume();
      expect(clock.advance(5016)).toBe(16);
    });
  });

  describe('scale', () => {
    it('multiplies the step', () => {
      const clock = new Clock();
      clock.advance(1000);
      clock.scale(0.25);

      expect(clock.advance(1016)).toBe(4);
      expect(clock.scale()).toBe(0.25);
    });

    it('freezes the world at zero, like a pause', () => {
      const clock = new Clock();
      clock.advance(1000);
      clock.scale(0);

      expect(clock.advance(1016)).toBe(0);
    });

    it('refuses to run time backwards', () => {
      const clock = new Clock();

      expect(clock.scale(-2)).toBe(0);
    });
  });

  describe('step', () => {
    it('advances by hand, which is how a probe drives a background tab', () => {
      const clock = new Clock();

      expect(clock.step(16)).toBe(16);
      expect(clock.now()).toBe(16);
      expect(clock.frame()).toBe(1);
    });

    it('ignores the pause and the scale — it IS the manual override', () => {
      const clock = new Clock();
      clock.pause();
      clock.scale(0.5);

      expect(clock.step(16)).toBe(16);
    });
  });

  it('counts frames, paused ones included', () => {
    const clock = new Clock();
    clock.advance(1000);
    clock.advance(1016);
    clock.pause();
    clock.advance(1032);

    expect(clock.frame()).toBe(3);
  });
});
