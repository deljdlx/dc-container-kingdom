// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Application,
  DEPTH_BASE,
  Element,
  FX_DEPTH,
  GROUND_FX_DEPTH,
} from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/**
 * An element standing at a world Y, painted.
 * @param {number} worldY may be negative — north of the origin
 * @param {number} height
 * @returns {number} the z-index it ends up with
 */
function depthAt(worldY, height = 64) {
  const parent = new Element(0, 0, 900, 560);
  const element = new Element(0, worldY, 48, height);
  parent.addElement(0, worldY, element, 'e');
  element.render();

  return Number(element.getDom().style.zIndex);
}

describe('painter depth - north of the origin', () => {
  it('stays above the ground FX surface for an element north of the origin', () => {
    // The defect this covers: the surface used to sit at DEPTH_BASE - 1, so the
    // very first area north (world Y around -560) painted *under* it and the
    // player's dust covered houses and trees.
    [-140, -260, -560, -1680, -100_000].forEach(worldY => {
      expect(depthAt(worldY)).toBeGreaterThan(GROUND_FX_DEPTH);
    });
  });

  it('keeps the ground FX surface above the ground itself', () => {
    // Grass and flat decals (manualZ) stay at `auto` (≈ 0); the surface must
    // land between them and anything standing.
    expect(GROUND_FX_DEPTH).toBeGreaterThan(0);
  });

  it('keeps the over-map surface above everything standing', () => {
    expect(FX_DEPTH).toBeGreaterThan(depthAt(1_000_000));
  });

  it('orders two elements by world Y whichever side of the origin they are', () => {
    const north = depthAt(-400);
    const origin = depthAt(0);
    const south = depthAt(400);

    expect(north).toBeLessThan(origin);
    expect(origin).toBeLessThan(south);
  });

  it('names the assumed limit: the depth reaches the ground layer far north', () => {
    // Not infinite, and that is the point of writing it down. The floor sits at
    // `offsetY + height <= 1 - DEPTH_BASE`, i.e. about 1785 areas of 560 px
    // north of the origin. Just short of it still works…
    expect(depthAt(-(DEPTH_BASE - 100), 64)).toBeGreaterThan(GROUND_FX_DEPTH);
    // …past it, the map sinks under its own ground FX again.
    expect(depthAt(-(DEPTH_BASE + 100), 64)).toBeLessThan(GROUND_FX_DEPTH);
  });
});
