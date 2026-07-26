// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Character, Element } from '../src/engine/index.js';

/**
 * The aggregate collision box is built by two paths — incremental growth
 * (`updateCollisionBoundingBox`) and full recomputation after a child is
 * detached (`recomputeAggregates`). They must agree: an element's broad-phase
 * envelope may not depend on whether it once lost a child.
 */
const corners = box => ({ x0: box.x0(), y0: box.y0(), x1: box.x1(), y1: box.y1() });

describe('aggregate collision box', () => {
  it('is the same before and after a recomputation, for the same state', () => {
    const character = new Character(0, 0);
    const reference = corners(character.getCollisionBoundingBox());

    const child = new Element(0, 0, 8, 8);
    character.addElement(100, 100, child, 'transient');
    character.removeChild(child); // triggers the recomputation path

    expect(corners(character.getCollisionBoundingBox())).toEqual(reference);
  });

  it('bounds the collision zones, not the element rectangle', () => {
    // A character is 48×48 but only collides through its 14×12 feet zone.
    const character = new Character(0, 0);
    const child = new Element(0, 0, 8, 8);
    character.addElement(100, 100, child, 'transient');
    character.removeChild(child);

    expect(corners(character.getCollisionBoundingBox()))
      .toEqual({ x0: 16, y0: 24, x1: 30, y1: 36 });
  });

  it('leaves an element with neither zone nor child harmless', () => {
    const bare = new Element(0, 0, 40, 40);
    const child = new Element(0, 0, 8, 8);
    bare.addElement(10, 10, child, 'transient');
    bare.removeChild(child);

    const walker = new Character(0, 0);
    expect(() => walker.overlaps(bare)).not.toThrow();
    expect(walker.overlaps(bare)).toBe(false);
  });
});
