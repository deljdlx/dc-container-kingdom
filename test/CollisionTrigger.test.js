// @vitest-environment jsdom
// Characterization tests for the merged collision+trigger detection.
//
// A moving character resolves collisions (blocking, revert) and triggers
// (observing, events) each frame. These lock in two properties the merge must
// preserve:
//   1. Triggers are evaluated at the FINAL position (after any collision
//      revert), so a trigger sitting on a wall does NOT fire when the character
//      is merely blocked by that wall ("no phantom trigger").
//   2. The single-pass detection is equivalent to two separate single-type
//      passes.
// Plus: the enter/exit reconciliation never spams (one enter, one exit).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/** Character body: a collider centred on its own box. */
function character(x, y, size = 40) {
  const el = new Element(x, y, size, size);
  el.createCollisionZone(0, 0, size, size);
  return el;
}

/**
 * One frame of the real moveCharacter protocol (Option A): move, detect both in
 * one pass, revert on collision, reconcile triggers at the final position.
 */
function frame(char, world, dx) {
  const savedX = char.x();
  char.x(char.x() + dx);

  const { collision, trigger } = char.detectCollisionAndTrigger(world);
  const blocked = collision.length > 0;
  if (blocked) {
    char.x(savedX);
    char.getTrigger(world); // re-evaluate at the reverted position
  } else {
    char.reconcileTrigger(trigger); // final position already; reconcile the pass
  }
}

describe('merged collision+trigger — trigger on a wall (blocked before reaching it)', () => {
  function buildWorld() {
    const world = new Element(0, 0, 1000, 1000);
    const wall = new Element(50, 0, 40, 40);
    wall.createCollisionZone(0, 0, 40, 40);
    wall.createTriggerZone(0, 0, 40, 40); // trigger co-located with the solid
    world.addElement(50, 0, wall);
    return { world, wall };
  }

  it('does NOT phantom-fire the trigger when the character bumps the wall', () => {
    const { world, wall } = buildWorld();
    const char = character(0, 0); // body [0..40]; +20 → [20..60] hits wall [50..90], reverts to [0..40]
    const onEnter = vi.fn();
    const onEnd = vi.fn();
    wall.addEventListener('element.trigger', onEnter);
    wall.addEventListener('element.trigger.end', onEnd);

    for (let i = 0; i < 5; i++) frame(char, world, 20); // push into the wall
    for (let i = 0; i < 3; i++) frame(char, world, -20); // walk away

    expect(char.x()).toBe(-60); // was blocked at 0, then walked left freely
    expect(onEnter).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('fires the solid collision exactly once while held against the wall (no spam)', () => {
    const { world, wall } = buildWorld();
    const char = character(0, 0);
    const onCollide = vi.fn();
    const onCollideEnd = vi.fn();
    wall.addEventListener('element.collision', onCollide);
    wall.addEventListener('element.collision.end', onCollideEnd);

    for (let i = 0; i < 5; i++) frame(char, world, 20); // 5 frames blocked
    expect(onCollide).toHaveBeenCalledTimes(1);
    expect(onCollideEnd).not.toHaveBeenCalled();

    for (let i = 0; i < 3; i++) frame(char, world, -20); // walk away → end once
    expect(onCollideEnd).toHaveBeenCalledTimes(1);
  });
});

describe('merged collision+trigger — walkable trigger (no solid)', () => {
  it('fires enter once on entry and end once on exit', () => {
    const world = new Element(0, 0, 1000, 1000);
    const pad = new Element(50, 0, 40, 40);
    pad.createTriggerZone(0, 0, 40, 40); // trigger only → walkable
    world.addElement(50, 0, pad);
    const char = character(0, 0);
    const onEnter = vi.fn();
    const onEnd = vi.fn();
    pad.addEventListener('element.trigger', onEnter);
    pad.addEventListener('element.trigger.end', onEnd);

    for (let i = 0; i < 10; i++) frame(char, world, 20); // walk across the pad and past it

    expect(char.x()).toBe(200);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe('merged detection — equivalence with two separate passes', () => {
  /** Build a small world with mixed collision + trigger geometry. */
  function buildWorld() {
    const world = new Element(0, 0, 1000, 1000);

    const wall = new Element(0, 0, 40, 40);
    wall.createCollisionZone(0, 0, 40, 40);
    world.addElement(60, 0, wall);

    const pad = new Element(0, 0, 40, 40);
    pad.createTriggerZone(0, 0, 40, 40);
    world.addElement(50, 0, pad);

    // A composite with children carrying zones, to exercise recursion.
    const group = new Element(0, 0, 200, 200);
    const child = new Element(0, 0, 40, 40);
    child.createCollisionZone(0, 0, 40, 40);
    child.createTriggerZone(0, 0, 40, 40);
    group.addElement(70, 10, child);
    world.addElement(40, 0, group);

    return world;
  }

  it('single pass yields the same collision and trigger hits as getCollision + getTrigger', () => {
    // Two identical worlds so state on one does not leak into the other.
    const worldA = buildWorld();
    const worldB = buildWorld();
    const charA = character(55, 5);
    const charB = character(55, 5);

    const combined = charA.detectCollisionAndTrigger(worldA);
    const separateCollision = charB.getCollision(worldB) || [];
    const separateTrigger = charB.getTrigger(worldB) || [];

    // Compare by structural position (elements differ across the two worlds).
    const key = (e) => `${e.offsetX()},${e.offsetY()},${e.width()},${e.height()}`;
    const sortKeys = (arr) => arr.map(key).sort();

    expect(sortKeys(combined.collision)).toEqual(sortKeys(separateCollision));
    expect(sortKeys(combined.trigger)).toEqual(sortKeys(separateTrigger));
  });
});
