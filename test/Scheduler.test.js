import { describe, expect, it, vi } from 'vitest';
import { Scheduler } from '../src/engine/time/Scheduler.js';

/** Tick the scheduler `frames` times, `dt` game ms each. */
function run(scheduler, frames, dt = 16) {
  for (let i = 0; i < frames; i++) {
    scheduler.update(dt);
  }
}

describe('Scheduler', () => {
  describe('after', () => {
    it('runs once, when the delay has passed in game time', () => {
      const scheduler = new Scheduler();
      const done = vi.fn();
      scheduler.after(100, done);

      run(scheduler, 6);              // 96 ms
      expect(done).not.toHaveBeenCalled();

      run(scheduler, 1);              // 112 ms
      expect(done).toHaveBeenCalledTimes(1);

      run(scheduler, 20);
      expect(done).toHaveBeenCalledTimes(1);
    });

    it('retires itself, leaving nothing behind', () => {
      const scheduler = new Scheduler();
      const handle = scheduler.after(10, () => null);
      run(scheduler, 2);

      expect(scheduler.count()).toBe(0);
      expect(handle.isDone()).toBe(true);
    });

    it('does nothing once cancelled', () => {
      const scheduler = new Scheduler();
      const done = vi.fn();
      const handle = scheduler.after(50, done);

      handle.cancel();
      handle.cancel();               // idempotent
      run(scheduler, 10);

      expect(done).not.toHaveBeenCalled();
    });
  });

  describe('every', () => {
    it('keeps a cadence that does not drift', () => {
      const scheduler = new Scheduler();
      const times = [];
      let elapsed = 0;
      scheduler.every(100, () => times.push(elapsed));

      for (let i = 0; i < 40; i++) {
        elapsed += 16;
        scheduler.update(16);
      }

      // Each firing consumes exactly 100 ms of the accumulated time — six
      // firings for the 640 ms elapsed, with 40 ms carried, never dropped. The
      // observed instants are quantised to the frame (16 ms), which is why they
      // are not round numbers: the cadence is exact, the sampling is not.
      expect(times).toEqual([112, 208, 304, 400, 512, 608]);
      expect(times.length).toBe(Math.floor(640 / 100));
    });

    it('owes several runs when one frame is longer than the interval', () => {
      const scheduler = new Scheduler();
      const done = vi.fn();
      scheduler.every(10, done);

      scheduler.update(100);         // the clock's cap: the worst case there is

      expect(done).toHaveBeenCalledTimes(10);
    });

    it('runs until cancelled', () => {
      const scheduler = new Scheduler();
      const done = vi.fn();
      const handle = scheduler.every(20, done);

      run(scheduler, 10);
      const before = done.mock.calls.length;
      handle.cancel();
      run(scheduler, 10);

      expect(before).toBeGreaterThan(0);
      expect(done).toHaveBeenCalledTimes(before);
    });
  });

  describe('tween', () => {
    it('runs every frame from 0 to 1, and lands exactly on 1', () => {
      const scheduler = new Scheduler();
      const seen = [];
      scheduler.tween(100, progress => seen.push(progress));

      run(scheduler, 10);

      expect(seen[0]).toBeCloseTo(0.16, 5);
      expect(seen[seen.length - 1]).toBe(1);
      expect(seen.every((p, i) => i === 0 || p > seen[i - 1])).toBe(true);
    });

    it('never overshoots, whatever the frame length', () => {
      const scheduler = new Scheduler();
      const seen = [];
      scheduler.tween(50, progress => seen.push(progress));

      scheduler.update(1000);

      expect(seen).toEqual([1]);
      expect(scheduler.count()).toBe(0);
    });
  });

  describe('ownership', () => {
    it('cancels itself when the element it belongs to is destroyed', () => {
      const scheduler = new Scheduler();
      const done = vi.fn();
      let destroy = null;
      const owner = { addEventListener: (name, cb) => { destroy = cb; return () => null; } };

      scheduler.after(100, done, { owner });
      destroy();
      run(scheduler, 20);

      expect(done).not.toHaveBeenCalled();
      expect(scheduler.count()).toBe(0);
    });

    it('lets go of the element when it fires, so nothing is held for ever', () => {
      const scheduler = new Scheduler();
      const release = vi.fn();
      const owner = { addEventListener: () => release };

      scheduler.after(10, () => null, { owner });
      run(scheduler, 2);

      expect(release).toHaveBeenCalled();
    });
  });

  describe('mutating while it ticks', () => {
    it('lets a callback cancel a neighbour without skipping anyone', () => {
      const scheduler = new Scheduler();
      const second = vi.fn();
      const third = vi.fn();

      let handleSecond;
      scheduler.after(10, () => handleSecond.cancel());
      handleSecond = scheduler.after(10, second);
      scheduler.after(10, third);

      run(scheduler, 2);

      expect(second).not.toHaveBeenCalled();
      expect(third).toHaveBeenCalledTimes(1);
    });

    it('lets a one-shot schedule its successor', () => {
      const scheduler = new Scheduler();
      const done = vi.fn();
      scheduler.after(10, () => scheduler.after(10, done));

      run(scheduler, 4);

      expect(done).toHaveBeenCalledTimes(1);
    });
  });

  it('holds everything still while the clock is paused', () => {
    const scheduler = new Scheduler();
    const done = vi.fn();
    scheduler.after(10, done);

    run(scheduler, 100, 0);          // a paused clock hands out dt = 0

    expect(done).not.toHaveBeenCalled();
    expect(scheduler.count()).toBe(1);
  });

  it('drops everything on clear', () => {
    const scheduler = new Scheduler();
    const release = vi.fn();
    scheduler.after(10, () => null, { owner: { addEventListener: () => release } });
    scheduler.every(10, () => null);

    scheduler.clear();

    expect(scheduler.count()).toBe(0);
    expect(release).toHaveBeenCalled();
  });
});
