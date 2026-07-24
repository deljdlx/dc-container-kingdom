import { describe, it, expect } from 'vitest';
import { FleeBehavior } from '../src/engine/index.js';

function makeGeometry(x, y) {
  return { _x: x, _y: y, clone() { return makeGeometry(this._x, this._y); } };
}

/** Duck-typed character: drives FleeBehavior without the full engine. */
function fakeCharacter(x, y, collisionFlags = []) {
  let call = 0;
  const geo = makeGeometry(x, y);
  return {
    direction: null,
    geometry: geo,
    x(v) { if (v !== undefined) { geo._x = v; } return geo._x; },
    y(v) { if (v !== undefined) { geo._y = v; } return geo._y; },
    offsetX() { return geo._x; },
    offsetY() { return geo._y; },
    setDirection(d) { this.direction = d; },
    getBoard() { return null; },
    overlaps() { return Boolean(collisionFlags[call++]); },
    moveBlocked(dx, dy, isBlocked) {
      const sx = this.x();
      const sy = this.y();
      this.x(sx + dx);
      this.y(sy + dy);
      if (isBlocked()) { this.x(sx); this.y(sy); return true; }
      return false;
    },
    update() {},
  };
}

describe('FleeBehavior', () => {
  it('stands still when nothing is in range', () => {
    const npc = fakeCharacter(100, 100);
    const flee = new FleeBehavior(npc, { radius: 200, speed: 5 });
    flee._step();
    expect(npc.x()).toBe(100);
    expect(npc.y()).toBe(100);
  });

  it('flees horizontally away from a threat on its side', () => {
    const npc = fakeCharacter(100, 100);
    const threat = fakeCharacter(60, 100); // threat to the LEFT → flee RIGHT
    const flee = new FleeBehavior(npc, { radius: 200, speed: 5 });
    flee._threat = threat;
    flee._step();
    expect(npc.direction).toBe('right');
    expect(npc.x()).toBe(105);
  });

  it('flees vertically when the threat is mostly above/below', () => {
    const npc = fakeCharacter(100, 100);
    const threat = fakeCharacter(100, 160); // threat BELOW → flee UP
    const flee = new FleeBehavior(npc, { radius: 200, speed: 5 });
    flee._threat = threat;
    flee._step();
    expect(npc.direction).toBe('up');
    expect(npc.y()).toBe(95);
  });

  it('forgets a threat that has moved well beyond the radius (backstop)', () => {
    const npc = fakeCharacter(100, 100);
    const threat = fakeCharacter(1000, 100);
    const flee = new FleeBehavior(npc, { radius: 100, speed: 5 });
    flee._threat = threat;
    flee._step();
    expect(flee._threat).toBeNull();
    expect(npc.x()).toBe(100); // did not move
  });

  it('update(dt) steps at the tickDelay cadence', () => {
    const npc = fakeCharacter(100, 100);
    const threat = fakeCharacter(60, 100);
    const flee = new FleeBehavior(npc, { radius: 500, speed: 5, tickDelay: 60 });
    flee._threat = threat;
    flee.update(130); // 2 full ticks
    expect(npc.x()).toBe(110);
  });
});
