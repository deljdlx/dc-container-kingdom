import { describe, expect, it } from 'vitest';
import { ParticleSystem } from '../src/engine/index.js';

/** A deterministic RNG: every draw lands mid-range, so angles are reproducible. */
const fixedRandom = () => 0.5;

describe('ParticleSystem - emission', () => {
  it('is empty until something is emitted', () => {
    const system = new ParticleSystem({ random: fixedRandom });

    expect(system.count()).toBe(0);
    expect(system.particles()).toEqual([]);
  });

  it('spawns the requested count at the requested world position', () => {
    const system = new ParticleSystem({ random: fixedRandom });

    system.emit({ x: 120, y: -40, count: 5 });

    expect(system.count()).toBe(5);
    for (const particle of system.particles()) {
      expect(particle.x).toBe(120);
      expect(particle.y).toBe(-40);
      expect(particle.age).toBe(0);
    }
  });

  it('turns direction and speed into a velocity', () => {
    const system = new ParticleSystem({ random: fixedRandom });

    // spread 0 → the angle is exactly `direction`; 0 rad points right.
    system.emit({ count: 1, direction: 0, spread: 0, speed: 100 });

    const [particle] = system.particles();
    expect(particle.vx).toBeCloseTo(100, 6);
    expect(particle.vy).toBeCloseTo(0, 6);
  });
});

describe('ParticleSystem - life', () => {
  it('moves particles by dt, in pixels per second', () => {
    const system = new ParticleSystem({ random: fixedRandom });
    system.emit({ x: 0, y: 0, count: 1, direction: 0, spread: 0, speed: 60, life: 10_000 });

    system.update(500);   // half a second at 60px/s

    const [particle] = system.particles();
    expect(particle.x).toBeCloseTo(30, 6);
    expect(particle.y).toBeCloseTo(0, 6);
  });

  it('applies gravity to the vertical speed', () => {
    const system = new ParticleSystem({ random: fixedRandom });
    system.emit({ count: 1, direction: 0, spread: 0, speed: 0, gravity: 200, life: 10_000 });

    system.update(1_000);

    const [particle] = system.particles();
    expect(particle.vy).toBeCloseTo(200, 6);
    expect(particle.y).toBeCloseTo(200, 6);
  });

  it('drops a particle once its life ran out', () => {
    const system = new ParticleSystem({ random: fixedRandom });
    system.emit({ count: 3, life: 100 });

    system.update(99);
    expect(system.count()).toBe(3);

    system.update(1);
    expect(system.count()).toBe(0);
  });

  it('does nothing on a zero or negative dt', () => {
    const system = new ParticleSystem({ random: fixedRandom });
    system.emit({ count: 1, life: 100 });

    system.update(0);
    system.update(-16);

    expect(system.particles()[0].age).toBe(0);
  });

  it('reports how far through its life a particle is', () => {
    expect(ParticleSystem.progressOf({ age: 0, life: 200 })).toBe(0);
    expect(ParticleSystem.progressOf({ age: 100, life: 200 })).toBe(0.5);
    // Clamped: a particle drawn on the frame it dies must not fade past zero.
    expect(ParticleSystem.progressOf({ age: 400, life: 200 })).toBe(1);
  });
});

describe('ParticleSystem - budget', () => {
  it('never grows past its budget, and drops the oldest first', () => {
    const system = new ParticleSystem({ budget: 4, random: fixedRandom });

    system.emit({ x: 1, count: 3 });
    system.emit({ x: 2, count: 3 });

    expect(system.count()).toBe(4);
    // Two of the first burst are gone; what remains is the newest.
    expect(system.particles().map(particle => particle.x)).toEqual([1, 2, 2, 2]);
  });

  it('survives a burst far larger than the budget', () => {
    const system = new ParticleSystem({ budget: 10, random: fixedRandom });

    system.emit({ count: 5_000 });

    expect(system.count()).toBe(10);
  });

  it('clears everything on demand', () => {
    const system = new ParticleSystem({ random: fixedRandom });
    system.emit({ count: 10 });

    system.clear();

    expect(system.count()).toBe(0);
  });
});
