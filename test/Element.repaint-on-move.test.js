// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/** A root holding one child, both painted once. */
function painted() {
  const root = new Element(0, 0, 900, 560);
  const child = new Element(0, 0, 32, 32);
  root.addElement(100, 100, child, 'child');
  root.update();

  return { root, child };
}

describe('moving an element repaints it', () => {
  it('puts the node where the model went, on the next frame', () => {
    const { root, child } = painted();
    expect(child.getDom().style.top).toBe('100px');

    child.y(400);
    root.update();

    // The defect: the walk came all the way to the dirty node and did nothing,
    // because the base renderer's update() was empty — a projectile would have
    // crossed the map without leaving its starting pixel.
    expect(child.getDom().style.top).toBe('400px');
  });

  it('follows a move on both axes', () => {
    const { root, child } = painted();

    child.x(250);
    child.y(300);
    root.update();

    expect(child.getDom().style.left).toBe('250px');
    expect(child.getDom().style.top).toBe('300px');
  });

  it('keeps the painter depth in step with the new position', () => {
    const { root, child } = painted();
    const before = Number(child.getDom().style.zIndex);

    child.y(child.y() + 200);
    root.update();

    expect(Number(child.getDom().style.zIndex)).toBe(before + 200);
  });

  it('marks the moved node so the walk reaches it', () => {
    const { root, child } = painted();
    expect(child.needUpdate()).toBe(false);

    child.x(200);

    // Half the fix: without the flag, the pruned walk never descends this far.
    expect(child.needUpdate()).toBe(true);
    expect(root.needUpdate()).toBe(true);
  });

  it('writes nothing when the position did not change', () => {
    const { root, child } = painted();
    const style = child.getDom().style;
    const writes = [];
    ['left', 'top', 'zIndex'].forEach(property => {
      let value = style[property];
      Object.defineProperty(style, property, {
        get: () => value,
        set: next => { writes.push(property); value = next; },
        configurable: true,
      });
    });

    child.needUpdate(true);
    root.update();

    // The `_last*` guards must absorb a repaint that has nothing to say — which
    // is what makes a per-frame walk affordable.
    expect(writes).toEqual([]);
  });
});
