import { describe, it, expect } from 'vitest';
import { PatrolBehavior } from '../src/engine/index.js';

/** Minimal geometry that supports clone() and reassignment, like the real one. */
function makeGeometry(x, y) {
  return { _x: x, _y: y, clone() { return makeGeometry(this._x, this._y); } };
}

/**
 * Duck-typed character: drives PatrolBehavior without the full engine.
 * @param {boolean[]} collisionFlags per-step: true → getCollision reports a hit
 */
function fakeCharacter(collisionFlags = []) {
  let call = 0;
  return {
    direction: null,
    geometry: makeGeometry(0, 0),
    setDirection(d) { this.direction = d; },
    x(v) { if (v !== undefined) { this.geometry._x = v; } return this.geometry._x; },
    y(v) { if (v !== undefined) { this.geometry._y = v; } return this.geometry._y; },
    getBoard() { return null; },
    overlaps() { return Boolean(collisionFlags[call++]); },
    update() {},
  };
}

describe('PatrolBehavior', () => {
  it('walks forward, then reverses after travelling the patrol distance', () => {
    const char = fakeCharacter();
    const patrol = new PatrolBehavior(char, { axis: 'horizontal', distance: 12, speed: 4 });

    patrol._step();
    expect(char.direction).toBe('right');
    expect(char.x()).toBe(4);

    patrol._step();
    expect(char.x()).toBe(8);

    patrol._step(); // reaches 12 → reverses for next step
    expect(char.x()).toBe(12);

    patrol._step();
    expect(char.direction).toBe('left');
    expect(char.x()).toBe(8);
  });

  it('restores position and turns around when blocked by a collision', () => {
    const char = fakeCharacter([true]); // collides on the very first step
    const patrol = new PatrolBehavior(char, { axis: 'horizontal', distance: 100, speed: 4 });

    patrol._step();
    expect(char.x()).toBe(0); // step undone

    patrol._step();
    expect(char.direction).toBe('left'); // reversed
    expect(char.x()).toBe(-4);
  });

  it('patrols along the vertical axis when configured', () => {
    const char = fakeCharacter();
    const patrol = new PatrolBehavior(char, { axis: 'vertical', distance: 100, speed: 5 });

    patrol._step();
    expect(char.direction).toBe('down');
    expect(char.y()).toBe(5);
  });
});
