// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/**
 * A container with one child carrying a body zone — the shape of an area
 * holding an NPC.
 * @returns {{container: Element, child: Element}}
 */
function world() {
  const container = new Element(0, 0, 900, 560);
  const child = new Element(100, 100, 32, 32);
  child.createCollisionZone(0, 0, 14, 12);
  container.addElement(100, 100, child, 'npc');

  return { container, child };
}

/** A detector standing at a world position, with a body of its own. */
function detectorAt(x, y) {
  const detector = new Element(x, y, 32, 32);
  detector.createCollisionZone(0, 0, 14, 12);

  return detector;
}

describe('aggregate bounding box - following a child that moves', () => {
  it('grows to keep covering a child that walked away', () => {
    const { container, child } = world();
    const before = container.getCollisionBoundingBox().offsets();

    child.y(child.y() + 400);

    const after = container.getCollisionBoundingBox().offsets();
    // The defect: the aggregate was computed when the child was attached and
    // never followed it, so the child ended up outside its own container's box.
    expect(after.y1).toBeGreaterThanOrEqual(before.y1);
    expect(after.y1).toBeGreaterThanOrEqual(child.offsetY() + 12);
  });

  it('keeps a child detectable after it moves out of the original envelope', () => {
    const { container, child } = world();
    // Walk the child far enough that the stale envelope no longer covers it.
    child.x(child.x() + 300);
    child.y(child.y() + 300);

    const detector = detectorAt(child.offsetX(), child.offsetY());

    // This is the reported bug, in one assertion: bodies overlap, and the broad
    // phase must not prune the container before reaching the child.
    expect(detector.overlaps(container)).toBe(true);
  });

  it('follows a child moved on one axis only', () => {
    const { container, child } = world();
    child.x(child.x() - 250);

    const detector = detectorAt(child.offsetX(), child.offsetY());
    expect(detector.overlaps(container)).toBe(true);
  });

  it('follows a child nested two levels down', () => {
    const container = new Element(0, 0, 900, 560);
    const group = new Element(0, 0, 64, 64);
    const leaf = new Element(0, 0, 16, 16);
    leaf.createCollisionZone(0, 0, 14, 12);
    group.addElement(0, 0, leaf, 'leaf');
    container.addElement(50, 50, group, 'group');

    leaf.y(leaf.y() + 400);

    const detector = detectorAt(leaf.offsetX(), leaf.offsetY());
    expect(detector.overlaps(container)).toBe(true);
  });

  it('does not report a hit for a child that is genuinely elsewhere', () => {
    const { container, child } = world();
    child.y(child.y() + 400);

    // Growing the envelope must not make everything collide: the narrow phase
    // still has the last word.
    const detector = detectorAt(child.offsetX() + 500, child.offsetY() + 500);
    expect(detector.overlaps(container)).toBe(false);
  });
});
