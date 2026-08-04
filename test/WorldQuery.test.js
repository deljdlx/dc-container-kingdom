// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element, queryRect, sweepRect } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/** A world holding solid bodies at world positions. */
function world(bodies = []) {
  const root = new Element(0, 0, 4000, 2000);
  const placed = bodies.map(({ x, y, w = 14, h = 12, type = 'collision' }, index) => {
    const body = new Element(0, 0, 32, 32);
    body.createCollisionZone(0, 0, w, h, type);
    root.addElement(x, y, body, `body-${index}`);
    return body;
  });

  return { root, placed };
}

const rect = (x, y, w, h) => ({ x0: x, y0: y, x1: x + w, y1: y + h });

describe('queryRect - asking without being in the world', () => {
  it('finds what a bare rectangle touches', () => {
    const { root, placed } = world([{ x: 500, y: 300 }]);

    // The caller is not an Element, owns no zone, is attached to nothing.
    expect(queryRect(root, rect(495, 295, 20, 20))).toEqual([placed[0]]);
  });

  it('finds nothing where there is nothing', () => {
    const { root } = world([{ x: 500, y: 300 }]);
    expect(queryRect(root, rect(0, 0, 20, 20))).toEqual([]);
  });

  it('reports every element in the region', () => {
    const { root, placed } = world([{ x: 100, y: 100 }, { x: 108, y: 104 }]);
    expect(queryRect(root, rect(100, 100, 30, 30))).toEqual(placed);
  });

  it('counts touching edges as a hit, like the collision system does', () => {
    const { root, placed } = world([{ x: 500, y: 300 }]);
    // The body spans 500..514; a rectangle ending exactly at 500 touches it.
    expect(queryRect(root, rect(480, 300, 20, 12))).toEqual([placed[0]]);
  });

  it('separates collision zones from trigger zones', () => {
    const { root, placed } = world([
      { x: 500, y: 300, type: 'collision' },
      { x: 500, y: 300, type: 'trigger' },
    ]);

    expect(queryRect(root, rect(500, 300, 10, 10), { type: 'collision' })).toEqual([placed[0]]);
    expect(queryRect(root, rect(500, 300, 10, 10), { type: 'trigger' })).toEqual([placed[1]]);
  });

  it('lets the caller exclude a source', () => {
    const { root, placed } = world([{ x: 500, y: 300 }, { x: 505, y: 300 }]);

    // A shooter must not hit itself, and only the caller knows who fired.
    expect(queryRect(root, rect(500, 300, 20, 12), { exclude: [placed[0]] })).toEqual([placed[1]]);
  });
});

describe('sweepRect - what a moving box runs into', () => {
  const size = { width: 6, height: 6 };

  it('finds a target the path crosses', () => {
    const { root, placed } = world([{ x: 500, y: 300 }]);

    const hit = sweepRect(root, { x: 300, y: 300 }, { x: 700, y: 300 }, size);

    expect(hit?.element).toBe(placed[0]);
  });

  it('returns null when the way is clear', () => {
    const { root } = world([{ x: 500, y: 900 }]);
    expect(sweepRect(root, { x: 300, y: 300 }, { x: 700, y: 300 }, size)).toBeNull();
  });

  it('returns the FIRST contact, not just any', () => {
    const { root, placed } = world([{ x: 600, y: 300 }, { x: 400, y: 300 }]);

    const hit = sweepRect(root, { x: 300, y: 300 }, { x: 700, y: 300 }, size);

    // Declared far-first on purpose: traversal order must not decide this.
    expect(hit?.element).toBe(placed[1]);
    expect(hit?.at.x).toBeLessThan(500);
  });

  it('does not report a target the diagonal path never touches', () => {
    // Sitting in the corner of the start/end bounding box, off the corridor.
    const { root } = world([{ x: 300, y: 900 }]);

    const hit = sweepRect(root, { x: 300, y: 300 }, { x: 900, y: 900 }, size);

    // Approximating the path by one big rectangle would have "hit" this.
    expect(hit).toBeNull();
  });

  it('still finds a target on the diagonal corridor', () => {
    const { root, placed } = world([{ x: 600, y: 600 }]);

    expect(sweepRect(root, { x: 300, y: 300 }, { x: 900, y: 900 }, size)?.element)
      .toBe(placed[0]);
  });

  it('tests its own position when it has not moved', () => {
    const { root, placed } = world([{ x: 500, y: 300 }]);

    expect(sweepRect(root, { x: 500, y: 300 }, { x: 500, y: 300 }, size)?.element)
      .toBe(placed[0]);
  });

  it('excludes the shooter along the whole path', () => {
    const { root, placed } = world([{ x: 300, y: 300 }, { x: 600, y: 300 }]);

    const hit = sweepRect(root, { x: 300, y: 300 }, { x: 700, y: 300 }, size,
      { exclude: [placed[0]] });

    expect(hit?.element).toBe(placed[1]);
  });
});

describe('sweepRect - the tunneling campaign', () => {
  it('misses nothing, at any speed and any phase', () => {
    const { root } = world([{ x: 500, y: 300 }]);
    const size = { width: 6, height: 6 };

    // The measurement that opened this ticket: testing positions alone, a 6 px
    // projectile crossing a 14 px body missed it 13 % of the time at 24 px per
    // frame and 67 % at 64 px.
    const missRates = [8, 16, 24, 32, 48, 64].map(step => {
      let misses = 0;
      for (let phase = 0; phase < step; phase += 1) {
        let hit = null;
        for (let x = 300 + phase; x <= 700 && !hit; x += step) {
          hit = sweepRect(root, { x, y: 300 }, { x: x + step, y: 300 }, size);
        }
        if (!hit) {
          misses += 1;
        }
      }
      return { step, misses };
    });

    expect(missRates.every(({ misses }) => misses === 0)).toBe(true);
  });
});
